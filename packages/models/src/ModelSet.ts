import type { Either } from "purify-ts";
import type { Person } from "./index.js";

export interface ModelSet {
  people(): Promise<Either<Error, readonly Person[]>>;
}
