import { Logger } from "pino";
import { Either } from "purify-ts";
import { WikidataEntity } from "./WikidataEntity.js";
import { WikidataEntityCache } from "./WikidataEntityCache.js";
import { WikipediaEntityRecognizer } from "./WikipediaEntityRecognizer.js";

export class WikidataEntityRecognizer {
  private readonly wikidataEntityCache: WikidataEntityCache;
  private readonly wikipediaEntityRecognizer: WikipediaEntityRecognizer;

  constructor({
    cachesDirectoryPath,
    logger,
  }: {
    cachesDirectoryPath: string;
    logger?: Logger;
  }) {
    this.wikidataEntityCache = new WikidataEntityCache({
      cachesDirectoryPath,
      logger,
    });
    this.wikipediaEntityRecognizer = new WikipediaEntityRecognizer({
      cachesDirectoryPath,
      logger,
    });
  }

  async resolve(
    parameters: Parameters<WikipediaEntityRecognizer["resolve"]>[0],
  ): Promise<Either<Error, readonly WikidataEntity[]>> {
    const wikipediaEntities =
      await this.wikipediaEntityRecognizer.resolve(parameters);
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
