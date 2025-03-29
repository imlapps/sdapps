import type { DatasetCore, NamedNode } from "@rdfjs/types";
import { Either } from "purify-ts";
import { type Resource, ResourceSet } from "rdfjs-resource";
import type { ModelSet } from "./ModelSet.js";
import {
  Event,
  EventStub,
  type Identifier,
  Organization,
  OrganizationStub,
  Person,
  PersonStub,
  Place,
  PlaceStub,
  Thing,
  VoteAction,
} from "./index.js";

export class RdfjsDatasetModelSet implements ModelSet {
  readonly resourceSet: ResourceSet;

  constructor({
    dataset,
  }: {
    dataset: DatasetCore;
  }) {
    this.resourceSet = new ResourceSet({
      dataset,
    });
  }

  async model<ModelT extends ModelSet.Model>(kwds: {
    identifier: Identifier;
    type: ModelT["type"];
  }): Promise<Either<Error, ModelT>> {
    return this.modelSync(kwds);
  }

  modelSync<ModelT extends ModelSet.Model>({
    identifier,
    type,
  }: {
    identifier: Identifier;
    type: ModelT["type"] | "Thing";
  }): Either<Error, ModelT> {
    const fromRdf = this.modelFromRdf(type);
    const resource = this.resourceSet.resource(identifier);
    return fromRdf({ resource });
  }

  async models<ModelT extends ModelSet.Model>(
    type: ModelT["type"],
  ): Promise<Either<Error, readonly ModelT[]>> {
    return this.modelsSync(type);
  }

  modelsSync<ModelT extends ModelSet.Model>(
    type: ModelT["type"],
  ): Either<Error, readonly ModelT[]> {
    const fromRdf = this.modelFromRdf(type);
    const models: ModelT[] = [];
    for (const resource of this.resourceSet.instancesOf(
      this.modelFromRdfType(type),
    )) {
      const modelEither = fromRdf({ resource });
      if (modelEither.isLeft()) {
        return modelEither;
      }
      models.push(modelEither.unsafeCoerce());
    }
    return Either.of(models);
  }

  async modelCount(
    type: ModelSet.Model["type"],
  ): Promise<Either<Error, number>> {
    return this.modelCountSync(type);
  }

  modelCountSync(type: ModelSet.Model["type"]): Either<Error, number> {
    const fromRdf = this.modelFromRdf(type);
    let count = 0;
    for (const resource of this.resourceSet.instancesOf(
      this.modelFromRdfType(type),
    )) {
      const modelEither = fromRdf({ resource });
      if (modelEither.isRight()) {
        count++;
      }
    }
    return Either.of(count);
  }

  private modelFromRdf<ModelT extends ModelSet.Model>(
    modelType: ModelT["type"] | "Thing",
  ): (parameters: {
    resource: Resource;
  }) => Either<Resource.ValueError, ModelT> {
    switch (modelType) {
      case "Event":
        return Event.fromRdf as any;
      case "EventStub":
        return EventStub.fromRdf as any;
      case "Organization":
        return Organization.fromRdf as any;
      case "OrganizationStub":
        return OrganizationStub.fromRdf as any;
      case "Person":
        return Person.fromRdf as any;
      case "PersonStub":
        return PersonStub.fromRdf as any;
      case "Place":
        return Place.fromRdf as any;
      case "PlaceStub":
        return PlaceStub.fromRdf as any;
      case "Thing":
        return Thing.fromRdf as any;
      case "VoteAction":
        return VoteAction.fromRdf as any;
    }
  }

  private modelFromRdfType<ModelT extends ModelSet.Model>(
    modelType: ModelT["type"],
  ): NamedNode {
    switch (modelType) {
      case "Event":
      case "EventStub":
        return Event.fromRdfType;
      case "Organization":
      case "OrganizationStub":
        return Organization.fromRdfType;
      case "Person":
      case "PersonStub":
        return Person.fromRdfType;
      case "VoteAction":
        return VoteAction.fromRdfType;
      default:
        throw new RangeError(modelType);
    }
  }

  // private modelsCountByRdfTypeSync<ModelT>({
  //   modelFromRdf,
  //   rdfType,
  // }: {
  //   modelFromRdf: (parameters: { resource: Resource }) => Either<Error, ModelT>;
  //   rdfType: NamedNode;
  // }): Either<Error, number> {
  // }
}
