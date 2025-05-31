import type { Either } from "purify-ts";
import type {
  Event,
  EventStub,
  Identifier,
  Message,
  Organization,
  OrganizationStub,
  Person,
  PersonStub,
  Place,
  PlaceStub,
  Report,
  ReportStub,
  TextObject,
  VoteAction,
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
    | Message
    | Organization
    | OrganizationStub
    | Person
    | PersonStub
    | Place
    | PlaceStub
    | Report
    | ReportStub
    | TextObject
    | VoteAction;
}
