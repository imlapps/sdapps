import { DatasetCore } from "@rdfjs/types";
import { WikidataEntityRecognizer } from "@sdapps/etl";
import {
  BroadcastEvent,
  ItemList,
  ListItem,
  MusicAlbum,
  MusicComposition,
  MusicGroup,
  MusicPlaylist,
  MusicRecording,
  Organization,
  Person,
  RadioBroadcastServiceStub,
  RadioEpisode,
  RadioSeries,
  Thing,
  stubify,
} from "@sdapps/models";
import * as dates from "date-fns";
import N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { invariant } from "ts-invariant";
import { z } from "zod";
import { ExtractResult } from "./ExtractResult";
import { Iris } from "./Iris";
import { logger } from "./logger";

type PlaylistJson = z.infer<typeof playlistJsonSchema>;

function durationSecondsToDuration(durationSeconds: number): dates.Duration {
  const duration: dates.Duration = {};
  let durationSecondsLeft = durationSeconds;
  duration.hours =
    durationSecondsLeft >= 3600
      ? Math.floor(durationSecondsLeft / 3600)
      : undefined;
  durationSecondsLeft %= 3600;
  duration.minutes =
    durationSecondsLeft >= 60
      ? Math.floor(durationSecondsLeft / 60)
      : undefined;
  durationSecondsLeft %= 60;
  duration.seconds = durationSecondsLeft > 0 ? durationSecondsLeft : undefined;
  return duration;
}

async function* transformPlaylistJson({
  cachesDirectoryPath,
  playlistJson,
  radioBroadcastService,
  ucsId,
}: {
  cachesDirectoryPath: string;
  playlistJson: PlaylistJson;
  radioBroadcastService: RadioBroadcastServiceStub;
  ucsId: string;
}): AsyncIterable<Thing> {
  const radioEpisodeBroadcastEvent = new BroadcastEvent({
    endDate: new Date(playlistJson.end_utc),
    $identifier: Iris.episodeBroadcastEvent({
      episodeId: playlistJson.episode_id,
    }),
    publishedOn: radioBroadcastService,
    startDate: new Date(playlistJson.start_utc),
  });
  const radioEpisodeBroadcastEventStub = stubify(radioEpisodeBroadcastEvent);

  const radioSeries = new RadioSeries({
    $identifier: Iris.program(playlistJson.program_id),
    name: playlistJson.name,
  });

  const radioEpisode = new RadioEpisode({
    $identifier: Iris.episode(playlistJson.episode_id),
    partOfSeries: stubify(radioSeries),
    publication: [radioEpisodeBroadcastEventStub],
  });
  const radioEpisodeStub = stubify(radioEpisode);
  radioEpisodeBroadcastEvent.worksPerformed.push(radioEpisodeStub);
  radioSeries.episodes.push(radioEpisodeStub);

  const ucsUtcOffsetMs =
    Date.parse(`${playlistJson.date}T${playlistJson.start_time}:00.000Z`) -
    radioEpisodeBroadcastEvent.startDate.unsafeCoerce().getTime();
  invariant(ucsUtcOffsetMs % (1000 * 60 * 60) === 0);
  const utcOffsetHours = ucsUtcOffsetMs / (1000 * 60 * 60);
  // logger.debug(`UCS UTC offset hours: ${utcOffsetHours}`);

  const musicPlaylist = new MusicPlaylist({
    $identifier: Iris.episodePlaylist({ episodeId: playlistJson.episode_id }),
    isPartOf: [radioEpisodeStub],
  });
  const musicPlaylistStub = stubify(musicPlaylist);
  radioEpisode.hasParts.push(musicPlaylistStub);
  const musicPlaylistItemList = new ItemList({
    $identifier: Iris.episodePlaylistItemList({
      episodeId: playlistJson.episode_id,
    }),
  });
  musicPlaylist.tracks.push(stubify(musicPlaylistItemList));

  const wikidataEntityRecognizer = new WikidataEntityRecognizer({
    cachesDirectoryPath,
    logger,
  });

  for (const playlistItemJson of playlistJson.playlist) {
    // 05-05-2025 00:00:00
    const startDate = dates.parse(
      `${playlistItemJson._start_time} ${utcOffsetHours > 0 ? "+" : "-"}${Math.abs(utcOffsetHours).toString().padStart(2, "0").padEnd(4, "0")}`,
      "MM-dd-yyyy HH:mm:ss XX",
      new Date(),
    );

    const composers: (Organization | Person)[] = [];
    const artists: (MusicGroup | Person)[] = [];
    const artistNames = new Set<string>();

    for (const [role, name] of Object.entries({
      "": playlistItemJson.artistName,
      composer: playlistItemJson.composerName,
      conductor: playlistItemJson.conductor,
      ensembles: playlistItemJson.ensembles,
      soloists: playlistItemJson.soloists,
    })) {
      if (!name || artistNames.has(name)) {
        continue;
      }
      const qualifiedName = role.length > 0 ? `${name} (${role})` : name;

      const wikidataEntities =
        role === "composer"
          ? (
              await wikidataEntityRecognizer.recognize({ name, role })
            ).orDefault([])
          : [];

      const wikidataArtists: (MusicGroup | Person)[] = [];
      for (const wikidataEntity of wikidataEntities) {
        (
          await wikidataEntity.toThing({
            alternateNames:
              wikidataEntities.length === 1 &&
              wikidataEntities[0].name.isJust() &&
              wikidataEntities[0].name.unsafeCoerce() !== name
                ? [name]
                : undefined,
          })
        )
          .ifLeft((error) =>
            logger.warn(
              "error converting Wikidata entity %s to schema.org: %s",
              wikidataEntity.id,
              error.message,
            ),
          )
          .ifRight((thing) => {
            switch (thing.$type) {
              case "MusicGroup":
              case "Person":
                wikidataArtists.push(thing as MusicGroup | Person);
                break;
              default:
                logger.warn(
                  `Wikidata entity ${wikidataEntity.id} converted to a ${thing.$type}`,
                );
                break;
            }
          });
      }

      if (
        wikidataArtists.length > 0 &&
        wikidataArtists.length === wikidataEntities.length
      ) {
        const wikidataEntitiesString = wikidataEntities
          .map(
            (wikidataEntity, i) =>
              `${wikidataEntity.id} (${wikidataArtists[i].name.extract()})`,
          )
          .join(", ");
        logger.trace(
          `recognized Wikidata entities in "${qualifiedName}": ${wikidataEntitiesString}`,
        );
        artists.push(...wikidataArtists);
        yield* wikidataArtists;
        if (role === "composer") {
          composers.push(...wikidataArtists);
        }
      } else {
        // logger.warn(
        //   `unable to recognize Wikidata entities in "${qualifiedName}", synthesizing MusicGroup`,
        // );
        const syntheticMusicGroup = new MusicGroup({
          $identifier: Iris.musicGroup({ name: qualifiedName }),
          name: qualifiedName,
        });
        artists.push(syntheticMusicGroup);
        yield syntheticMusicGroup;
        if (role === "composer") {
          composers.push(syntheticMusicGroup);
        }
      }
    }

    if (artists.length === 0) {
      logger.debug(
        `playlist item ${playlistItemJson.id} has no group names, skipping: ${JSON.stringify(playlistItemJson)}`,
      );
      continue;
    }
    const artistStubs = artists.map((artist) => {
      switch (artist.$type) {
        case "MusicGroup":
          return stubify(artist);
        case "Person":
          return stubify(artist);
      }
    });

    const musicAlbum = playlistItemJson.collectionName
      ? new MusicAlbum({
          byArtists: artistStubs,
          $identifier: Iris.musicAlbum(playlistItemJson),
          name: playlistItemJson.collectionName,
        })
      : undefined;
    if (musicAlbum) {
      yield musicAlbum;
    }

    const musicComposition =
      composers.length > 0
        ? new MusicComposition({
            composers: composers.map((composer) =>
              composer.$type === "Person"
                ? stubify(composer)
                : stubify(composer),
            ),
            $identifier: Iris.musicComposition(playlistItemJson),
            name: playlistItemJson.trackName,
          })
        : undefined;

    const musicRecordingBroadcastEvent = new BroadcastEvent({
      endDate: new Date(startDate.getTime() + playlistItemJson._duration),
      $identifier: Iris.episodePlaylistItemBroadcastEvent({
        episodeId: playlistJson.episode_id,
        playlistItemId: playlistItemJson.id,
      }),
      publishedOn: radioBroadcastService,
      startDate: startDate,
      superEvent: radioEpisodeBroadcastEventStub,
    });
    const musicRecordingBroadcastEventStub = stubify(
      musicRecordingBroadcastEvent,
    );
    radioEpisodeBroadcastEvent.subEvents.push(musicRecordingBroadcastEventStub);

    const musicRecording = new MusicRecording({
      duration: dates.formatISODuration(
        durationSecondsToDuration(playlistItemJson._duration / 1000),
      ),
      byArtists: artistStubs,
      inAlbum: musicAlbum ? stubify(musicAlbum) : undefined,
      $identifier: Iris.musicRecording(playlistItemJson),
      inPlaylists: [musicPlaylistStub],
      name: playlistItemJson.trackName,
      publication: [musicRecordingBroadcastEventStub],
      recordingOf: musicComposition ? stubify(musicComposition) : undefined,
    });
    yield musicRecording;
    const musicRecordingStub = stubify(musicRecording);
    musicRecordingBroadcastEvent.worksPerformed.push(musicRecordingStub);
    yield musicRecordingBroadcastEvent;

    if (musicComposition) {
      musicComposition.recordedAs.push(musicRecordingStub);
      yield musicComposition;
    }

    const musicPlaylistItem = new ListItem({
      disambiguatingDescription: JSON.stringify(playlistItemJson),
      $identifier: Iris.episodePlaylistItem({
        episodeId: playlistJson.episode_id,
        playlistItemId: playlistItemJson.id,
      }),
      item: musicRecordingStub,
      position: playlistItemJson.id, // The id's monotonically increase, so this can be used for sorting
    });
    yield musicPlaylistItem;
    musicPlaylistItemList.itemListElements.push(stubify(musicPlaylistItem));
  }

  yield musicPlaylist;
  yield musicPlaylistItemList;
  yield radioEpisode;
  yield radioEpisodeBroadcastEvent;
  yield radioSeries;
}

export async function* transform({
  cachesDirectoryPath,
  extractResults,
  inputDataset,
}: {
  cachesDirectoryPath: string;
  extractResults: AsyncIterable<ExtractResult>;
  inputDataset: DatasetCore;
}): AsyncIterable<DatasetCore> {
  yield inputDataset;

  for await (const extractResult of extractResults) {
    const parseResult = await playlistResponseJsonSchema.safeParseAsync(
      extractResult.playlistResponseJson,
    );
    if (!parseResult.success) {
      logger.warn(
        `error parsing playlist response: ${parseResult.error.message}`,
      );
      continue;
    }

    for (const playlistJson of parseResult.data.playlist) {
      for await (const model of transformPlaylistJson({
        cachesDirectoryPath,
        playlistJson,
        radioBroadcastService: stubify(extractResult.radioBroadcastService),
        ucsId: extractResult.ucsIdentifier,
      })) {
        yield model.$toRdf({
          mutateGraph: N3.DataFactory.defaultGraph(),
          resourceSet: new MutableResourceSet({
            dataFactory: N3.DataFactory,
            dataset: new N3.Store(),
          }),
        }).dataset;
      }
    }
  }
}

const playlistJsonSchema = z.object({
  date: z.string().date(),
  episode_id: z.string(),
  end_time: z.string(),
  end_utc: z.string().datetime(),
  name: z.string(),
  playlist: z.array(
    z.strictObject({
      artistName: z.string().optional(),
      buy: z.object({}),
      collectionName: z.string().optional(),
      composerName: z.string().optional(),
      conductor: z.string().optional(),
      ensembles: z.string().optional(),
      _duration: z.number(),
      id: z.string(),
      soloists: z.string().optional(),
      _start_time: z.string(),
      trackName: z.string(),
    }),
  ),
  program_id: z.string(),
  program_format: z.string(),
  start_time: z.string(),
  start_utc: z.string().datetime(),
});
const playlistResponseJsonSchema = z.object({
  dateFilterUsed: z.string(),
  playlist: z.array(playlistJsonSchema),
  ucsNow: z.string(),
});
