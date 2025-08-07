import { Either } from "purify-ts";
import {
  $ObjectSet,
  $SparqlObjectSet,
  RadioBroadcastService,
} from "./generated.js";

export class SparqlObjectSetEx extends $SparqlObjectSet {
  override radioBroadcastServiceIdentifiers(
    query?: $ObjectSet.Query<RadioBroadcastService.Identifier> & { x: number },
  ): Promise<Either<Error, readonly RadioBroadcastService.Identifier[]>> {
    return this.$objectIdentifiers({});
  }
}
