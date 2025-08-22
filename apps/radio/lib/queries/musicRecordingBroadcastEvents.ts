import { dataFactory } from "@/lib/dataFactory";
import { objectSet as defaultObjectSet } from "@/lib/objectSet";
import TermMap from "@rdfjs/term-map";
import TermSet from "@rdfjs/term-set";
import {
  $SparqlObjectSet,
  $sparqlInstancesOfPattern,
  AgentStub,
  BroadcastEvent,
  Identifier,
  Model,
  MusicRecording,
  RadioEpisodeStub,
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

export async function musicRecordingBroadcastEvents(parameters: {
  broadcastService: {
    $identifier: Identifier;
  };
  objectSet?: $SparqlObjectSet;
  startDateRange?: [Date, Date];
}): Promise<
  Either<
    Error,
    readonly {
      readonly musicComposers: readonly AgentStub[];
      readonly musicRecording: MusicRecording;
      readonly musicRecordingBroadcastEvent: BroadcastEvent;
      readonly radioEpisode: Maybe<RadioEpisodeStub>;
      readonly radioEpisodeBroadcastEvent: Maybe<BroadcastEvent>;
    }[]
  >
> {
  const { broadcastService, startDateRange } = parameters;
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

    return musicRecordingBroadcastEvents.flatMap(
      (musicRecordingBroadcastEvent) => {
        return musicRecordingBroadcastEvent.worksPerformed.flatMap(
          (creativeWorkStub) => {
            const musicRecording = musicRecordingsByIdentifier.get(
              creativeWorkStub.$identifier,
            );
            if (!musicRecording) {
              return [];
            }

            const radioEpisodeBroadcastEvent =
              musicRecordingBroadcastEvent.superEvent.chain((event) =>
                Maybe.fromNullable(
                  radioEpisodeBroadcastEventsByIdentifier.get(
                    event.$identifier,
                  ),
                ),
              );

            return [
              {
                musicComposers: musicRecording.recordingOf
                  .toList()
                  .flatMap(
                    (recordingOf) =>
                      musicCompositionsByIdentifier.get(recordingOf.$identifier)
                        ?.composers ?? [],
                  ),
                musicRecording,
                musicRecordingBroadcastEvent,
                radioEpisode: radioEpisodeBroadcastEvent.chain(
                  (radioEpisodeBoadcastEvent) =>
                    radioEpisodeBoadcastEvent.worksPerformed.length === 1
                      ? Maybe.fromNullable(
                          radioEpisodesByIdentifier.get(
                            radioEpisodeBoadcastEvent.worksPerformed[0]
                              .$identifier,
                          ),
                        )
                      : Maybe.empty(),
                ),
                radioEpisodeBroadcastEvent,
              },
            ];
          },
        );
      },
    );
  });
}
