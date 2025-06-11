import type { DatasetCore } from "@rdfjs/types";
import { Either } from "purify-ts";
import { ResourceSet } from "rdfjs-resource";
import type { ModelSet } from "./ModelSet.js";
import { $ObjectTypes, type Identifier, Model } from "./index.js";

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

  async model<ModelT extends Model>(kwds: {
    identifier: Identifier;
    type: ModelT["type"];
  }): Promise<Either<Error, ModelT>> {
    return this.modelSync(kwds);
  }

  modelSync<ModelT extends Model>({
    identifier,
    type,
  }: {
    identifier: Identifier;
    type: ModelT["type"];
  }): Either<Error, ModelT> {
    const fromRdf = $ObjectTypes[type].fromRdf;
    const resource = this.resourceSet.resource(identifier);
    return fromRdf({ resource }) as unknown as Either<Error, ModelT>;
  }

  async models<ModelT extends Model>(
    type: ModelT["type"],
  ): Promise<Either<Error, readonly ModelT[]>> {
    return this.modelsSync(type);
  }

  modelsSync<ModelT extends Model>(
    type: ModelT["type"],
  ): Either<Error, readonly ModelT[]> {
    const fromRdf = $ObjectTypes[type].fromRdf;
    const models: ModelT[] = [];
    for (const resource of this.resourceSet.instancesOf(
      $ObjectTypes[type].fromRdfType,
    )) {
      const modelEither = fromRdf({ resource }) as unknown as Either<
        Error,
        ModelT
      >;
      if (modelEither.isLeft()) {
        return modelEither;
      }
      models.push(modelEither.unsafeCoerce());
    }
    return Either.of(models);
  }

  async modelCount(type: Model["type"]): Promise<Either<Error, number>> {
    return this.modelCountSync(type);
  }

  modelCountSync(type: Model["type"]): Either<Error, number> {
    const fromRdf = $ObjectTypes[type].fromRdf;
    let count = 0;
    for (const resource of this.resourceSet.instancesOf(
      $ObjectTypes[type].fromRdfType,
    )) {
      const modelEither = fromRdf({ resource });
      if (modelEither.isRight()) {
        count++;
      }
    }
    return Either.of(count);
  }
}
