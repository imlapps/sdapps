import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { WikidataEntity } from "./WikidataEntity.js";
import { WikidataEntityFetcher } from "./WikidataEntityFetcher.js";
import { WikipediaEntityRecognizer } from "./WikipediaEntityRecognizer.js";

export class WikidataEntityRecognizer {
  private readonly wikidataEntityFetcher: WikidataEntityFetcher;
  private readonly wikipediaEntityRecognizer: WikipediaEntityRecognizer;

  constructor({
    cachesDirectoryPath,
    logger,
  }: {
    cachesDirectoryPath: string;
    logger?: Logger;
  }) {
    this.wikidataEntityFetcher = new WikidataEntityFetcher({
      cachesDirectoryPath,
      logger,
    });
    this.wikipediaEntityRecognizer = new WikipediaEntityRecognizer({
      cachesDirectoryPath,
      logger,
    });
  }

  async recognize(
    parameters: Parameters<WikipediaEntityRecognizer["recognize"]>[0],
  ): Promise<Either<Error, readonly WikidataEntity[]>> {
    return EitherAsync(async ({ liftEither }) => {
      const wikipediaEntities = await liftEither(
        await this.wikipediaEntityRecognizer.recognize(parameters),
      );

      const wikidataEntities: WikidataEntity[] = [];
      for (const wikipediaEntity of wikipediaEntities) {
        wikidataEntities.push(
          await liftEither(
            await this.wikidataEntityFetcher.fetch(
              wikipediaEntity.wikidataEntityId,
            ),
          ),
        );
      }
      return wikidataEntities;
    });
  }
}
