import { dataFactory } from "@/lib/dataFactory";
import { objectSet as defaultObjectSet } from "@/lib/objectSet";
import {
  $SparqlObjectSet,
  BroadcastEventStub,
  Identifier,
} from "@sdapps/models";
import { schema } from "@tpluscode/rdf-ns-builders";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { invariant } from "ts-invariant";

export async function lastRadioBroadcastServiceBroadcastEvent(parameters: {
  objectSet?: $SparqlObjectSet;
  radioBroadcastService: { identifier: Identifier };
}): Promise<Either<Error, Maybe<BroadcastEventStub>>> {
  return EitherAsync(async ({ liftEither }) => {
    const { radioBroadcastService } = parameters;
    const objectSet = parameters?.objectSet ?? defaultObjectSet;

    const broadcastEventStartDateVariable = dataFactory.variable(
      "broadcastEventStartDate",
    );

    const broadcastEventIdentifiers = await liftEither(
      await objectSet.broadcastEventIdentifiers({
        limit: 1,
        order: () => [
          {
            descending: true,
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
                  object: radioBroadcastService.identifier,
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

    return (
      await objectSet.broadcastEventStub(broadcastEventIdentifiers[0])
    ).toMaybe();
  });
}
