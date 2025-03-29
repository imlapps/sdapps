import type { Either } from "purify-ts";
import type {
  Event,
  EventStub,
  Identifier,
  Organization,
  OrganizationStub,
  Person,
  PersonStub,
  Place,
  PlaceStub,
} from "./index.js";

export interface ModelSet {
  model<ModelT extends ModelSet.Model>(kwds: {
    identifier: Identifier;
    type: ModelT["type"] | "Thing";
  }): Promise<Either<Error, ModelT>>;

  modelCount(type: ModelSet.Model["type"]): Promise<Either<Error, number>>;

  models<ModelT extends ModelSet.Model>(
    type: ModelT["type"],
  ): Promise<Either<Error, readonly ModelT[]>>;
}

export namespace ModelSet {
  export type Model =
    | Event
    | EventStub
    | Organization
    | OrganizationStub
    | Person
    | PersonStub
    | Place
    | PlaceStub;
}
