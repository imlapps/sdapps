import { DatasetCore } from "@rdfjs/types";
import { WikidataEntityRecognizer } from "@sdapps/etl";
import {
  BroadcastEvent,
  ItemList,
  ListItem,
  Model,
  MusicAlbum,
  MusicArtistRoleStub,
  MusicArtistStub,
  MusicComposition,
  MusicGroup,
  MusicPlaylist,
  MusicRecording,
  Organization,
  Person,
  RadioBroadcastServiceStub,
  RadioEpisode,
  RadioSeries,
  stubify,
} from "@sdapps/models";
import * as dates from "date-fns";
import N3, { DataFactory } from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { invariant } from "ts-invariant";
import { z } from "zod";
import { ExtractResult } from "./ExtractResult";
import { Iris } from "./Iris";
import { logger } from "./logger";

const RECOGNIZE_ARTIST_WIKIDATA_ENTITIES = false;
const RECOGNIZE_COMPOSER_WIKIDATA_ENTITIES = true;

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
}): AsyncIterable<Model> {
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
    name: playlistJson.name,
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

    const artistRoles: (MusicArtistStub | MusicArtistRoleStub)[] = [];
    const artistsByNameLowerCase: Record<string, (MusicGroup | Person)[]> = {};
    const artistNamesByRole: [
      (
        | { identifier: MusicArtistRoleStub["roleName"]; label: string }
        | undefined
      ),
      string | undefined,
    ][] = [
      [
        {
          identifier: DataFactory.namedNode(
            "http://purl.org/sdapps/ontology#MusicConductorRoleName",
          ),
          label: "conductor",
        },
        playlistItemJson.conductor,
      ],
      [
        {
          identifier: DataFactory.namedNode(
            "http://purl.org/sdapps/ontology#MusicEnsembleRoleName",
          ),
          label: "ensemble",
        },
        playlistItemJson.ensembles,
      ],
      [
        {
          identifier: DataFactory.namedNode(
            "http://purl.org/sdapps/ontology#MusicSoloistRoleName",
          ),
          label: "soloist",
        },
        playlistItemJson.soloists,
      ],
      [undefined, playlistItemJson.artistName],
    ];

    for (const [roleName, artistName] of artistNamesByRole) {
      if (!artistName) {
        continue;
      }
      const artistNameLowerCase = artistName.toLowerCase();

      const artists = artistsByNameLowerCase[artistNameLowerCase] ?? [];
      if (artists.length === 0) {
        if (RECOGNIZE_ARTIST_WIKIDATA_ENTITIES && roleName) {
          // Only do NER on artists with known roles.

          const qualifiedName = roleName
            ? `${artistName} (${roleName.label})`
            : artistName;

          const wikidataEntities = (
            await wikidataEntityRecognizer.recognize({
              name: artistName,
              role: roleName?.label,
            })
          ).orDefault([]);

          for (const wikidataEntity of wikidataEntities) {
            (
              await wikidataEntity.toThing({
                alternateNames:
                  wikidataEntities.length === 1 &&
                  wikidataEntities[0].name.isJust() &&
                  wikidataEntities[0].name.unsafeCoerce() !== artistName
                    ? [artistName]
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
                if (thing instanceof MusicGroup || thing instanceof Person) {
                  artists.push(thing as MusicGroup | Person);
                } else {
                  logger.warn(
                    `Wikidata entity ${wikidataEntity.id} converted to a ${thing.$type}`,
                  );
                }
              });
          }

          if (
            artists.length > 0 &&
            artists.length === wikidataEntities.length
          ) {
            const wikidataEntitiesString = wikidataEntities
              .map(
                (wikidataEntity, i) =>
                  `${wikidataEntity.id} (${artists[i].name.extract()})`,
              )
              .join(", ");
            logger.trace(
              `recognized Wikidata entities in "${qualifiedName}": ${wikidataEntitiesString}`,
            );
          } else {
            // logger.warn(
            //   `unable to recognize Wikidata entities in "${qualifiedName}"`,
            // );
          }
        }

        if (artists.length === 0) {
          logger.trace("synthesizing artist for %s", artistName);
          artists.push(
            new (roleName?.identifier.value ===
            "http://purl.org/sdapps/ontology#MusicEnsembleRoleName"
              ? MusicGroup
              : Person)({
              $identifier: Iris.artist({
                name: artistName,
              }),
              name: artistName,
            }),
          );
        }

        artistsByNameLowerCase[artistNameLowerCase] = artists;
      }

      for (const artist of artists) {
        const artistStub =
          artist instanceof MusicGroup ? stubify(artist) : stubify(artist);
        let artistRole: MusicArtistRoleStub | MusicArtistStub;
        if (roleName) {
          artistRole = new MusicArtistRoleStub({
            byArtist: artistStub,
            $identifier: Iris.artistRole({
              name: artistName,
              roleName: roleName.identifier,
            }),
            roleName: roleName.identifier,
          });
        } else {
          if (
            artistRoles.some(
              (artistRole) =>
                artistRole.$type === "MusicArtistRoleStub" &&
                artistRole.byArtist.$identifier.equals(artistStub.$identifier),
            )
          ) {
            logger.trace(
              "ignoring artist without role (%s) in favor of same artist with a role",
              artistName,
            );
            continue;
          }

          artistRole = artistStub;
        }

        artistRoles.push(artistRole);

        yield artist;
      }
    }

    const musicAlbum = playlistItemJson.collectionName
      ? new MusicAlbum({
          byArtists: artistRoles,
          $identifier: Iris.album(playlistItemJson),
          name: playlistItemJson.collectionName,
        })
      : undefined;
    if (musicAlbum) {
      yield musicAlbum;
    }

    let musicComposition: MusicComposition | undefined;
    if (playlistItemJson.composerName) {
      const composers: (Organization | Person)[] = [];

      if (RECOGNIZE_COMPOSER_WIKIDATA_ENTITIES) {
        const wikidataEntities = (
          await wikidataEntityRecognizer.recognize({
            name: playlistItemJson.composerName,
            role: "composer",
          })
        ).orDefault([]);
        for (const wikidataEntity of wikidataEntities) {
          (
            await wikidataEntity.toThing({
              alternateNames:
                wikidataEntities.length === 1 &&
                wikidataEntities[0].name.isJust() &&
                wikidataEntities[0].name.unsafeCoerce() !==
                  playlistItemJson.composerName
                  ? [playlistItemJson.composerName]
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
              if (thing instanceof Organization || thing instanceof Person) {
                composers.push(thing);
              } else {
                logger.warn(
                  `Wikidata entity ${wikidataEntity.id} converted to a ${thing.$type}`,
                );
              }
            });
        }

        if (composers.length === 0) {
          // logger.warn(
          //   `unable to recognize Wikidata entities in "${qualifiedName}", synthesizing composer Person`,
          // );
          composers.push(
            new Person({
              $identifier: Iris.composer({
                name: playlistItemJson.composerName,
              }),
              name: playlistItemJson.composerName,
            }),
          );
        }

        yield* composers;

        musicComposition = new MusicComposition({
          composers: composers.map((composer) =>
            composer instanceof Person ? stubify(composer) : stubify(composer),
          ),
          $identifier: Iris.composition(playlistItemJson),
          name: playlistItemJson.trackName,
        });
      }
    }

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
      byArtists: artistRoles,
      inAlbum: musicAlbum ? stubify(musicAlbum) : undefined,
      $identifier: Iris.recording(playlistItemJson),
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
