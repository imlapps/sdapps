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
  MusicAlbumStub,
  MusicArtistStub,
  MusicComposition,
  MusicCompositionStub,
  MusicRecording,
  MusicRecordingStub,
  stubify,
} from "@sdapps/models";
import { schema } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { toRdf } from "rdf-literal";
import * as sparqljs from "sparqljs";

export async function musicRecordingBroadcastEvents(parameters: {
  broadcastService: {
    $identifier: Identifier;
  };
  endDate?: Date;
  objectSet?: $SparqlObjectSet;
  startDate?: Date;
}): Promise<
  Either<
    Error,
    readonly {
      readonly broadcastEvent: BroadcastEvent;
      readonly musicArtists: readonly MusicArtistStub[];
      readonly musicComposition: Maybe<MusicCompositionStub>;
      readonly musicComposers: readonly AgentStub[];
      readonly musicAlbum: Maybe<MusicAlbumStub>;
      readonly musicRecording: MusicRecordingStub;
    }[]
  >
> {
  const { broadcastService, endDate, startDate } = parameters;
  const objectSet = parameters?.objectSet ?? defaultObjectSet;

  return EitherAsync(async () => {
    const broadcastEventEithers = await objectSet.broadcastEvents({
      where: {
        patterns: (objectVariable) => {
          const patterns: sparqljs.Pattern[] = [];

          const musicRecordingVariable = dataFactory.variable(
            `${objectVariable.value}MusicRecording`,
          );

          if (endDate) {
            const endDateVariable = dataFactory.variable(
              `${objectVariable.value}EndDate`,
            );

            patterns.push(
              {
                triples: [
                  {
                    subject: objectVariable,
                    predicate: schema.endDate,
                    object: endDateVariable,
                  },
                ],
                type: "bgp",
              },
              {
                expression: {
                  args: [endDateVariable, toRdf(endDate)],
                  operator: "<=",
                  type: "operation",
                },
                type: "filter",
              },
            );
          }

          if (startDate) {
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
                  args: [startDateVariable, toRdf(startDate)],
                  operator: ">=",
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
    });

    const broadcastEvents: BroadcastEvent[] = [];
    const musicRecordingIdentifiers = new TermSet<Identifier>();
    for (const broadcastEventEither of broadcastEventEithers) {
      broadcastEventEither.ifRight((broadcastEvent) => {
        broadcastEvents.push(broadcastEvent);
        for (const creativeWorkStub of broadcastEvent.worksPerformed) {
          musicRecordingIdentifiers.add(creativeWorkStub.$identifier);
        }
      });
    }

    const musicRecordings = await objectSet.musicRecordings({
      where: {
        identifiers: [...musicRecordingIdentifiers],
        type: "identifiers",
      },
    });

    const musicCompositionIdentifiers = new TermSet<Identifier>();
    const musicRecordingsByIdentifier = new TermMap<
      Identifier,
      MusicRecording
    >();
    for (const musicRecording of musicRecordings) {
      musicRecording.ifRight((musicRecording) => {
        musicRecordingsByIdentifier.set(
          musicRecording.$identifier,
          musicRecording,
        );
        musicRecording.recordingOf.ifJust((musicComposition) =>
          musicCompositionIdentifiers.add(musicComposition.$identifier),
        );
      });
    }

    const musicCompositionsByIdentifier = new TermMap<
      Identifier,
      MusicComposition
    >();
    for (const musicComposition of await objectSet.musicCompositions({
      where: {
        identifiers: [...musicCompositionIdentifiers],
        type: "identifiers",
      },
    })) {
      musicComposition.ifRight((musicComposition) =>
        musicCompositionsByIdentifier.set(
          musicComposition.$identifier,
          musicComposition,
        ),
      );
    }

    return broadcastEvents.flatMap((broadcastEvent) => {
      return broadcastEvent.worksPerformed.flatMap((creativeWorkStub) => {
        const musicRecording = musicRecordingsByIdentifier.get(
          creativeWorkStub.$identifier,
        );
        if (!musicRecording) {
          return [];
        }

        const musicComposers: AgentStub[] = [];
        musicRecording.recordingOf.ifJust((musicCompositionStub) => {
          const musicComposition = musicCompositionsByIdentifier.get(
            musicCompositionStub.$identifier,
          );
          if (musicComposition) {
            musicComposers.push(...musicComposition.composers);
          }
        });

        return [
          {
            broadcastEvent,
            musicAlbum: musicRecording.inAlbum,
            musicArtists: musicRecording.byArtists,
            musicComposers,
            musicComposition: musicRecording.recordingOf,
            musicRecording: stubify(musicRecording),
          },
        ];
      });
    });
  });
}
