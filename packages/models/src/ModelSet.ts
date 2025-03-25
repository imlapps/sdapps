import type { Either } from "purify-ts";
import type { Organization, Person } from "./index.js";

export interface ModelSet {
  organizations(): Promise<Either<Error, readonly Organization[]>>;
  people(): Promise<Either<Error, readonly Person[]>>;
}
