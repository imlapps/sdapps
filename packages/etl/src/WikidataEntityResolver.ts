import { Logger } from "pino";
import { Either } from "purify-ts";
import { WikidataEntity } from "./WikidataEntity";
import { WikipediaEntityResolver } from "./WikipediaEntityResolver.js";

export class WikidataEntityResolver {
  private readonly wikipediaEntityResolver: WikipediaEntityResolver;

  constructor({
    cachesDirectoryPath,
    logger,
  }: {
    cachesDirectoryPath: string;
    logger?: Logger;
  }) {
    this.wikipediaEntityResolver = new WikipediaEntityResolver({
      cachesDirectoryPath,
      logger,
    });
  }

  async resolve(
    parameters: Parameters<WikipediaEntityResolver["resolve"]>[0],
  ): Promise<Either<Error, readonly WikidataEntity[]>> {
    const wikipediaEntities =
      await this.wikipediaEntityResolver.resolve(parameters);
    if (wikipediaEntities.isLeft()) {
      return wikipediaEntities;
    }

    const wikidataEntities: WikidataEntity[] = [];
    for (const wikipediaEntity of wikipediaEntities.unsafeCoerce()) {
      const wikidataEntity = await wikipediaEntity.wikidataEntity();
      if (wikidataEntity.isLeft()) {
        return wikidataEntity;
      }
      wikidataEntity
        .unsafeCoerce()
        .ifJust((wikidataEntity) => wikidataEntities.push(wikidataEntity));
    }
    return Either.of(wikidataEntities);
  }
}
