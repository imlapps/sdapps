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
    type: ModelT["type"];
  }): Either<Error, ModelT> {
    const { fromRdf } = this.modelFactory(type);
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
    const { fromRdf, fromRdfType } = this.modelFactory(type);
    const models: ModelT[] = [];
    for (const resource of this.resourceSet.instancesOf(fromRdfType)) {
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
    const { fromRdf, fromRdfType } = this.modelFactory(type);
    let count = 0;
    for (const resource of this.resourceSet.instancesOf(fromRdfType)) {
      const modelEither = fromRdf({ resource });
      if (modelEither.isRight()) {
        count++;
      }
    }
    return Either.of(count);
  }

  private modelFactory<ModelT extends ModelSet.Model>(
    modelType: ModelT["type"],
  ): {
    readonly fromRdf: (parameters: {
      [_index: string]: any;
      resource: Resource;
    }) => Either<Resource.ValueError, ModelT>;
    readonly fromRdfType: NamedNode;
  } {
    switch (modelType) {
      case "Event":
        return {
          fromRdf: Event.fromRdf as any,
          fromRdfType: Event.fromRdfType,
        };
      case "EventStub":
        return {
          fromRdf: EventStub.fromRdf as any,
          fromRdfType: EventStub.fromRdfType,
        };
      case "Organization":
        return {
          fromRdf: Organization.fromRdf as any,
          fromRdfType: Organization.fromRdfType,
        };
      case "OrganizationStub":
        return {
          fromRdf: OrganizationStub.fromRdf as any,
          fromRdfType: OrganizationStub.fromRdfType,
        };
      case "Person":
        return {
          fromRdf: Person.fromRdf as any,
          fromRdfType: Person.fromRdfType,
        };
      case "PersonStub":
        return {
          fromRdf: PersonStub.fromRdf as any,
          fromRdfType: PersonStub.fromRdfType,
        };
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
