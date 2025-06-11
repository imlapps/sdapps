import type { Either } from "purify-ts";
import type { Identifier, Model } from "./index.js";

export interface ModelSet {
  model<ModelT extends Model>(kwds: {
    identifier: Identifier;
    type: ModelT["type"];
  }): Promise<Either<Error, ModelT>>;

  modelCount(type: Model["type"]): Promise<Either<Error, number>>;

  models<ModelT extends Model>(
    type: ModelT["type"],
  ): Promise<Either<Error, readonly ModelT[]>>;
}
