import { DatasetCore, NamedNode } from "@rdfjs/types";
import { Either } from "purify-ts";
import { Resource, ResourceSet } from "rdfjs-resource";
import { ModelSet } from "./ModelSet.js";
import { Person } from "./index.js";

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

  async people(): Promise<Either<Error, readonly Person[]>> {
    return this.peopleSync();
  }

  peopleSync(): Either<Error, readonly Person[]> {
    return this.modelsByRdfTypeSync({
      modelFromRdf: Person.fromRdf,
      rdfType: Person.fromRdfType,
    });
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
