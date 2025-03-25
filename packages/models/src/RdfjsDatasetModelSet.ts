import { DatasetCore, NamedNode } from "@rdfjs/types";
import { Either } from "purify-ts";
import { Resource, ResourceSet } from "rdfjs-resource";
import { ModelSet } from "./ModelSet.js";
import { Organization, Person } from "./index.js";

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

  async organizations(): Promise<Either<Error, readonly Organization[]>> {
    return this.organizationsSync();
  }

  organizationsSync(): Either<Error, readonly Organization[]> {
    return this.modelsByRdfTypeSync({
      modelFromRdf: Organization.fromRdf,
      rdfType: Organization.fromRdfType,
    });
  }

  async organizationsCount(): Promise<Either<Error, number>> {
    return this.organizationsCountSync();
  }

  organizationsCountSync(): Either<Error, number> {
    return this.modelsCountByRdfTypeSync({
      modelFromRdf: Organization.fromRdf,
      rdfType: Organization.fromRdfType,
    });
  }

  async people(): Promise<Either<Error, readonly Person[]>> {
    return this.peopleSync();
  }

  peopleSync(): Either<Error, readonly Person[]> {
    return this.modelsByRdfTypeSync({
      modelFromRdf: Person.fromRdf,
      rdfType: Person.fromRdfType,
    });
  }

  async peopleCount(): Promise<Either<Error, number>> {
    return this.peopleCountSync();
  }

  peopleCountSync(): Either<Error, number> {
    return this.modelsCountByRdfTypeSync({
      modelFromRdf: Person.fromRdf,
      rdfType: Person.fromRdfType,
    });
  }

  private modelsCountByRdfTypeSync<ModelT>({
    modelFromRdf,
    rdfType,
  }: {
    modelFromRdf: (parameters: { resource: Resource }) => Either<Error, ModelT>;
    rdfType: NamedNode;
  }): Either<Error, number> {
    let count = 0;
    for (const resource of this.resourceSet.instancesOf(rdfType)) {
      const modelEither = modelFromRdf({ resource });
      if (modelEither.isRight()) {
        count++;
      }
    }
    return Either.of(count);
  }

  private modelsByRdfTypeSync<ModelT>({
    modelFromRdf,
    rdfType,
  }: {
    modelFromRdf: (parameters: { resource: Resource }) => Either<Error, ModelT>;
    rdfType: NamedNode;
  }): Either<Error, readonly ModelT[]> {
    const models: ModelT[] = [];
    for (const resource of this.resourceSet.instancesOf(rdfType)) {
      const modelEither = modelFromRdf({ resource });
      if (modelEither.isLeft()) {
        return modelEither;
      }
      models.push(modelEither.unsafeCoerce());
    }
    return Either.of(models);
  }
}
