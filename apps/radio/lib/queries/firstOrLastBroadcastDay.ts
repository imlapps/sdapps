import { dataFactory } from "@/lib/dataFactory";
import { BroadcastDay } from "@/lib/models/BroadcastDay";
import { objectSet as defaultObjectSet } from "@/lib/objectSet";
import { $SparqlObjectSet, Identifier } from "@sdapps/models";
import { schema } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { invariant } from "ts-invariant";

export async function firstOrLastBroadcastDay(parameters: {
  broadcastService: {
    broadcastTimezone: Maybe<string>;
    identifier: Identifier;
  };
  firstOrLast: "first" | "last";
  objectSet?: $SparqlObjectSet;
}): Promise<Either<Error, Maybe<BroadcastDay>>> {
  return EitherAsync(async ({ liftEither }) => {
    const { broadcastService, firstOrLast } = parameters;
    const objectSet = parameters?.objectSet ?? defaultObjectSet;

    const broadcastEventStartDateVariable = dataFactory.variable(
      "broadcastEventStartDate",
    );

    const broadcastEventIdentifiers = await liftEither(
      await objectSet.broadcastEventIdentifiers({
        limit: 1,
        order: () => [
          {
            descending: firstOrLast === "last",
            expression: broadcastEventStartDateVariable,
          },
        ],
        where: {
          patterns: (broadcastEventVariable) => [
            {
              triples: [
                {
                  subject: broadcastEventVariable,
                  predicate: schema.publishedOn,
                  object: broadcastService.identifier,
                },
              ],
              type: "bgp",
            },
            {
              triples: [
                {
                  subject: broadcastEventVariable,
                  predicate: schema.startDate,
                  object: broadcastEventStartDateVariable,
                },
              ],
              type: "bgp",
            },
          ],
          type: "patterns",
        },
      }),
    );

    if (broadcastEventIdentifiers.length === 0) {
      return Maybe.empty();
    }
    invariant(broadcastEventIdentifiers.length === 1);

    return (await objectSet.broadcastEventStub(broadcastEventIdentifiers[0]))
      .toMaybe()
      .chain((broadcastEvent) =>
        broadcastEvent.startDate.map((startDate) =>
          BroadcastDay.fromDate({ broadcastService, date: startDate }),
        ),
      );
  });
}
