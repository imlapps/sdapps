import { BroadcastDay } from "@/lib/models/BroadcastDay";
import { firstOrLastBroadcastDay } from "@/lib/queries/firstOrLastBroadcastDay";
import { $SparqlObjectSet, Identifier } from "@sdapps/models";
import { Either, Maybe } from "purify-ts";

export async function lastBroadcastDay(parameters: {
  broadcastService: {
    broadcastTimezone: Maybe<string>;
    identifier: Identifier;
  };
  objectSet?: $SparqlObjectSet;
}): Promise<Either<Error, Maybe<BroadcastDay>>> {
  return firstOrLastBroadcastDay({ ...parameters, firstOrLast: "last" });
}
