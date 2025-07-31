import { DatasetCore } from "@rdfjs/types";
import {
  BroadcastEvent,
  ItemList,
  ListItem,
  MusicAlbum,
  MusicComposition,
  MusicGroup,
  MusicPlaylist,
  MusicRecording,
  RadioBroadcastService,
  RadioEpisode,
  RadioSeries,
  Thing,
  stubify,
} from "@sdapps/models";
import * as dates from "date-fns";

import N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { z } from "zod";

import { invariant } from "ts-invariant";
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
  playlistJson,
  radioBroadcastService,
  ucsId,
}: {
  playlistJson: PlaylistJson;
  radioBroadcastService: RadioBroadcastService;
  ucsId: string;
}): AsyncIterable<Thing> {
  const radioEpisodeBroadcastEvent = new BroadcastEvent({
    endDate: new Date(playlistJson.end_utc),
    identifier: Iris.episodeBroadcastEvent({
      episodeId: playlistJson.episode_id,
    }),
    publishedOn: stubify(radioBroadcastService),
    startDate: new Date(playlistJson.start_utc),
  });
  const radioEpisodeBroadcastEventStub = stubify(radioEpisodeBroadcastEvent);

  const radioSeries = new RadioSeries({
    identifier: Iris.program(playlistJson.program_id),
    name: playlistJson.name,
  });

  const radioEpisode = new RadioEpisode({
    identifier: Iris.episode(playlistJson.episode_id),
    partOfSeries: stubify(radioSeries),
    publication: [radioEpisodeBroadcastEventStub],
  });
  const radioEpisodeStub = stubify(radioEpisode);
  radioSeries.episodes.push(radioEpisodeStub);

  const ucsUtcOffsetMs =
    Date.parse(`${playlistJson.date}T${playlistJson.start_time}:00.000Z`) -
    radioEpisodeBroadcastEvent.startDate.unsafeCoerce().getTime();
  invariant(ucsUtcOffsetMs % (1000 * 60 * 60) === 0);
  const utcOffsetHours = ucsUtcOffsetMs / (1000 * 60 * 60);
  // logger.debug(`UCS UTC offset hours: ${utcOffsetHours}`);

  const musicPlaylist = new MusicPlaylist({
    identifier: Iris.episodePlaylist({ episodeId: playlistJson.episode_id }),
    isPartOf: [radioEpisodeStub],
  });
  const musicPlaylistStub = stubify(musicPlaylist);
  radioEpisode.hasParts.push(musicPlaylistStub);
  const musicPlaylistItemList = new ItemList({
    identifier: Iris.episodePlaylistItemList({
      episodeId: playlistJson.episode_id,
    }),
  });
  musicPlaylist.tracks.push(stubify(musicPlaylistItemList));

  for (const playlistItemJson of playlistJson.playlist) {
    // 05-05-2025 00:00:00
    const startDate = dates.parse(
      `${playlistItemJson._start_time} ${utcOffsetHours > 0 ? "+" : "-"}${Math.abs(utcOffsetHours).toString().padStart(2, "0").padEnd(4, "0")}`,
      "MM-dd-yyyy HH:mm:ss XX",
      new Date(),
    );

    let composerMusicGroup: MusicGroup | undefined;
    const musicGroups: MusicGroup[] = [];
    const musicGroupUnqualifiedNames = new Set<string>();
    for (const [qualifier, unqualifiedName] of Object.entries({
      "": playlistItemJson.artistName,
      composer: playlistItemJson.composerName,
      conductor: playlistItemJson.conductor,
      ensembles: playlistItemJson.ensembles,
      soloists: playlistItemJson.soloists,
    })) {
      if (!unqualifiedName || musicGroupUnqualifiedNames.has(unqualifiedName)) {
        continue;
      }
      const qualifiedName =
        qualifier.length > 0
          ? `${unqualifiedName} (${qualifier})`
          : unqualifiedName;
      const musicGroup = new MusicGroup({
        identifier: Iris.musicGroup({ name: qualifiedName }),
        name: qualifiedName,
      });
      yield musicGroup;
      musicGroups.push(musicGroup);
      if (qualifier === "composer") {
        composerMusicGroup = musicGroup;
      }
    }

    if (musicGroups.length === 0) {
      logger.debug(
        `playlist item ${playlistItemJson.id} has no group names, skipping: ${JSON.stringify(playlistItemJson)}`,
      );
      continue;
    }
    const musicGroupStubs = musicGroups.map((musicGroup) =>
      stubify(musicGroup),
    );

    const musicAlbum = playlistItemJson.collectionName
      ? new MusicAlbum({
          byArtists: musicGroupStubs,
          identifier: Iris.musicAlbum(playlistItemJson),
          name: playlistItemJson.collectionName,
        })
      : undefined;
    if (musicAlbum) {
      yield musicAlbum;
    }

    const musicComposition = composerMusicGroup
      ? new MusicComposition({
          composer: composerMusicGroup
            ? stubify(composerMusicGroup)
            : undefined,
          identifier: Iris.musicComposition(playlistItemJson),
          name: playlistItemJson.trackName,
        })
      : undefined;

    const musicRecordingBroadcastEvent = new BroadcastEvent({
      endDate: new Date(startDate.getTime() + playlistItemJson._duration),
      identifier: Iris.episodePlaylistItemBroadcastEvent({
        episodeId: playlistJson.episode_id,
        playlistItemId: playlistItemJson.id,
      }),
      publishedOn: stubify(radioBroadcastService),
      startDate: startDate,
      superEvent: radioEpisodeBroadcastEventStub,
    });
    yield musicRecordingBroadcastEvent;
    const musicRecordingBroadcastEventStub = stubify(
      musicRecordingBroadcastEvent,
    );
    radioEpisodeBroadcastEvent.subEvents.push(musicRecordingBroadcastEventStub);

    const musicRecording = new MusicRecording({
      duration: dates.formatISODuration(
        durationSecondsToDuration(playlistItemJson._duration / 1000),
      ),
      byArtists: musicGroupStubs,
      inAlbum: musicAlbum ? stubify(musicAlbum) : undefined,
      identifier: Iris.musicRecording(playlistItemJson),
      inPlaylists: [musicPlaylistStub],
      name: playlistItemJson.trackName,
      publication: [musicRecordingBroadcastEventStub],
      recordingOf: musicComposition ? stubify(musicComposition) : undefined,
    });
    yield musicRecording;
    const musicRecordingStub = stubify(musicRecording);

    if (musicComposition) {
      musicComposition.recordedAs.push(musicRecordingStub);
      yield musicComposition;
    }

    const musicPlaylistItem = new ListItem({
      identifier: Iris.episodePlaylistItem({
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
  extractResults,
  inputDataset,
}: {
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
        playlistJson,
        radioBroadcastService: extractResult.radioBroadcastService,
        ucsId: extractResult.ucsIdentifier,
      })) {
        yield model.toRdf({
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
