import { dataFactory } from "@/lib/dataFactory";
import { logger } from "@/lib/logger";
import { Playlist } from "@/lib/models/Playlist";
import { broadcastTimeZoneId } from "@/lib/models/broadcastTimeZoneId";
import { objectSet as defaultObjectSet } from "@/lib/objectSet";
import { DateTimeFormatter, nativeJs } from "@js-joda/core";
import TermMap from "@rdfjs/term-map";
import TermSet from "@rdfjs/term-set";
import {
  $SparqlObjectSet,
  $sparqlInstancesOfPattern,
  Event,
  Identifier,
  Model,
  displayLabel,
} from "@sdapps/models";
import { schema } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { toRdf } from "rdf-literal";
import * as sparqljs from "sparqljs";

function modelsByIdentifier<ModelT extends Model>(
  models: readonly Either<Error, ModelT>[],
): TermMap<Identifier, ModelT> {
  return models.reduce((map, model) => {
    model.ifRight((model) => {
      map.set(model.$identifier, model);
    });
    return map;
  }, new TermMap<Identifier, ModelT>());
}

export async function playlist(parameters: {
  broadcastService: {
    $identifier: Identifier;
    broadcastTimezone: Maybe<string>;
  };
  objectSet?: $SparqlObjectSet;
  startDateRange?: [Date, Date];
}): Promise<Either<Error, Playlist>> {
  const { broadcastService, startDateRange } = parameters;
  const broadcastTimeZoneId_ = broadcastTimeZoneId(broadcastService);
  const objectSet = parameters?.objectSet ?? defaultObjectSet;

  return EitherAsync(async () => {
    const musicRecordingBroadcastEvents = Either.rights(
      await objectSet.broadcastEvents({
        order: (objectVariable) => [
          {
            descending: false,
            expression: dataFactory.variable(
              `${objectVariable.value}StartDate`,
            ),
          },
        ],
        where: {
          patterns: (objectVariable) => {
            const patterns: sparqljs.Pattern[] = [];

            const musicRecordingVariable = dataFactory.variable(
              `${objectVariable.value}MusicRecording`,
            );

            if (startDateRange) {
              const startDateVariable = dataFactory.variable(
                `${objectVariable.value}StartDate`,
              );

              patterns.push(
                {
                  triples: [
                    {
                      subject: objectVariable,
                      predicate: schema.startDate,
                      object: startDateVariable,
                    },
                  ],
                  type: "bgp",
                },
                {
                  expression: {
                    args: [
                      {
                        args: [startDateVariable, toRdf(startDateRange[0])],
                        operator: ">=",
                        type: "operation",
                      },
                      {
                        args: [startDateVariable, toRdf(startDateRange[1])],
                        operator: "<=",
                        type: "operation",
                      },
                    ],
                    operator: "&&",
                    type: "operation",
                  },
                  type: "filter",
                },
              );
            }

            // Broadcast service
            patterns.push({
              triples: [
                {
                  subject: objectVariable,
                  predicate: schema.publishedOn,
                  object: broadcastService.$identifier,
                },
              ],
              type: "bgp",
            });

            // Music recording
            patterns.push(
              {
                triples: [
                  {
                    subject: objectVariable,
                    predicate: schema.workPerformed,
                    object: musicRecordingVariable,
                  },
                ],
                type: "bgp",
              },
              $sparqlInstancesOfPattern({
                rdfType: schema.MusicRecording,
                subject: musicRecordingVariable,
              }),
            );

            return patterns;
          },
          type: "patterns",
        },
      }),
    );

    const radioEpisodeBroadcastEventsByIdentifier = modelsByIdentifier(
      await objectSet.broadcastEvents({
        where: {
          identifiers: [
            ...musicRecordingBroadcastEvents.reduce((set, broadcastEvent) => {
              broadcastEvent.superEvent.ifJust((event) =>
                set.add(event.$identifier),
              );
              return set;
            }, new TermSet<Identifier>()),
          ],
          type: "identifiers",
        },
      }),
    );

    const radioEpisodesByIdentifier = modelsByIdentifier(
      await objectSet.radioEpisodeStubs({
        where: {
          identifiers: [
            ...radioEpisodeBroadcastEventsByIdentifier
              .values()
              .reduce((set, broadcastEvent) => {
                for (const creativeWorkStub of broadcastEvent.worksPerformed) {
                  set.add(creativeWorkStub.$identifier);
                }
                return set;
              }, new TermSet<Identifier>()),
          ],
          type: "identifiers",
        },
      }),
    );

    const musicRecordingsByIdentifier = modelsByIdentifier(
      await objectSet.musicRecordings({
        where: {
          identifiers: [
            ...musicRecordingBroadcastEvents.reduce((set, broadcastEvent) => {
              for (const creativeWorkStub of broadcastEvent.worksPerformed) {
                set.add(creativeWorkStub.$identifier);
              }
              return set;
            }, new TermSet<Identifier>()),
          ],
          type: "identifiers",
        },
      }),
    );

    const musicCompositionsByIdentifier = modelsByIdentifier(
      await objectSet.musicCompositions({
        where: {
          identifiers: [
            ...musicRecordingsByIdentifier
              .values()
              .reduce((set, musicRecording) => {
                musicRecording.recordingOf.ifJust((musicComposition) =>
                  set.add(musicComposition.$identifier),
                );
                return set;
              }, new TermSet<Identifier>()),
          ],
          type: "identifiers",
        },
      }),
    );

    const playlist: Playlist = {
      artistsByIdentifier: {},
      composersByIdentifier: {},
      compositionsByIdentifier: {},
      episodes: [],
    };

    const eventDates = (
      event: Event,
    ): { endDate: string; startDate: string } => {
      const startDate = event.startDate.unsafeCoerce();
      const endDate = event.endDate.unsafeCoerce();
      return {
        endDate: DateTimeFormatter.ISO_DATE_TIME.format(
          nativeJs(endDate).withZoneSameLocal(broadcastTimeZoneId_),
        ),
        startDate: DateTimeFormatter.ISO_DATE_TIME.format(
          nativeJs(startDate).withZoneSameLocal(broadcastTimeZoneId_),
        ),
      };
    };

    for (const musicRecordingBroadcastEvent of musicRecordingBroadcastEvents) {
      if (musicRecordingBroadcastEvent.worksPerformed.length !== 1) {
        continue;
      }
      const musicRecording = musicRecordingsByIdentifier.get(
        musicRecordingBroadcastEvent.worksPerformed[0].$identifier,
      );
      if (!musicRecording) {
        logger.warn(
          "missing music recording %s",
          Identifier.toString(
            musicRecordingBroadcastEvent.worksPerformed[0].$identifier,
          ),
        );
        continue;
      }

      let playlistEpisode: Playlist["episodes"][0] | undefined;

      const radioEpisodeBroadcastEvent = musicRecordingBroadcastEvent.superEvent
        .chain((event) =>
          Maybe.fromNullable(
            radioEpisodeBroadcastEventsByIdentifier.get(event.$identifier),
          ),
        )
        .extract();
      if (radioEpisodeBroadcastEvent) {
        if (radioEpisodeBroadcastEvent.worksPerformed.length === 1) {
          const radioEpisode = radioEpisodesByIdentifier.get(
            radioEpisodeBroadcastEvent.worksPerformed[0].$identifier,
          );
          if (radioEpisode) {
            const playlistEpisodeIdentifier = Identifier.toString(
              radioEpisode.$identifier,
            );
            if (
              playlist.episodes.length === 0 ||
              playlist.episodes.at(-1)!.identifier !== playlistEpisodeIdentifier
            ) {
              playlistEpisode = {
                ...eventDates(radioEpisodeBroadcastEvent),
                identifier: Identifier.toString(radioEpisode.$identifier),
                items: [],
                label: displayLabel(radioEpisode),
              };
              playlist.episodes.push(playlistEpisode);
            }
          }
        }
      }

      if (!playlistEpisode) {
        // Synthesize an episode
        playlistEpisode = {
          ...eventDates(musicRecordingBroadcastEvent),
          identifier: Identifier.toString(
            musicRecordingBroadcastEvent.$identifier,
          ),
          items: [],
          label: displayLabel(musicRecording),
        };
        playlist.episodes.push(playlistEpisode);
      }

      playlistEpisode.items.push({
        ...eventDates(musicRecordingBroadcastEvent),
        // Populate the artist, composer, and composition lookups as side effects of map.
        // Inelegant but concise.
        artistIdentifiers: musicRecording.byArtists.map((artist) => {
          const artistIdentifier = Identifier.toString(artist.$identifier);
          if (!playlist.artistsByIdentifier[artistIdentifier]) {
            playlist.artistsByIdentifier[artistIdentifier] = {
              label: displayLabel(artist),
            };
          }
          return artistIdentifier;
        }),
        compositionIdentifier: musicRecording.recordingOf
          .map((compositionStub) => {
            const compositionIdentifier = Identifier.toString(
              compositionStub.$identifier,
            );
            if (!playlist.compositionsByIdentifier[compositionIdentifier]) {
              const composition = musicCompositionsByIdentifier.get(
                compositionStub.$identifier,
              );
              playlist.compositionsByIdentifier[compositionIdentifier] = {
                composerIdentifiers: composition
                  ? composition.composers.map((composer) => {
                      const composerIdentifier = Identifier.toString(
                        composer.$identifier,
                      );
                      if (!playlist.composersByIdentifier[composerIdentifier]) {
                        playlist.composersByIdentifier[composerIdentifier] = {
                          label: displayLabel(composer),
                        };
                      }
                      return composerIdentifier;
                    })
                  : [],
                label: displayLabel(compositionStub),
              };
            }
            return compositionIdentifier;
          })
          .extract(),
        label: displayLabel(musicRecording),
      });
    }

    return playlist;
  });
}
