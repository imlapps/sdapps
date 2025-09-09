import { firstOrLastBroadcastEvent } from "@/lib/queries/firstOrLastBroadcastEvent";
import {
  $SparqlObjectSet,
  BroadcastEventStub,
  Identifier,
} from "@sdapps/models";
import { Either, Maybe } from "purify-ts";

export async function firstBroadcastEvent(parameters: {
  broadcastService: {
    $identifier: Identifier;
  };
  objectSet?: $SparqlObjectSet;
}): Promise<Either<Error, Maybe<BroadcastEventStub>>> {
  return firstOrLastBroadcastEvent({ ...parameters, firstOrLast: "first" });
}
