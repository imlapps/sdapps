import path from "node:path";
import N3 from "n3";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { TextFileCache } from "./TextFileCache.js";
import { WikidataEntity } from "./WikidataEntity.js";

export class WikidataEntityFetcher {
  private readonly logger?: Logger;
  private readonly fileCache: TextFileCache;
  private readonly memoryCache: Record<string, Either<Error, WikidataEntity>> =
    {};

  constructor({
    cachesDirectoryPath,
    logger,
  }: { cachesDirectoryPath: string; logger?: Logger }) {
    this.logger = logger;
    this.fileCache = new TextFileCache({
      directoryPath: path.join(cachesDirectoryPath, "wikidata", "rdf"),
      fileExtension: ".ttl",
      logger,
    });
  }

  async fetch(id: string): Promise<Either<Error, WikidataEntity>> {
    {
      const result = this.memoryCache[id];
      if (result) {
        return result;
      }
    }

    const result = await EitherAsync<Error, WikidataEntity>(
      async ({ liftEither }) => {
        const dataset = new N3.Store();
        const parser = new N3.Parser();

        const cachedTtl = await liftEither(await this.fileCache.get(id));
        if (cachedTtl.isJust()) {
          for (const quad of parser.parse(cachedTtl.unsafeCoerce())) {
            dataset.add(quad);
          }
        } else {
          const url = `http://www.wikidata.org/entity/${id}`;
          this.logger?.trace(`fetching ${id} Turtle`);
          const response = await fetch(`${url}.ttl`);
          const responseText = await response.text();
          for (const quad of parser.parse(responseText)) {
            dataset.add(quad);
          }
          this.logger?.trace(`fetched ${id} Turtle with ${dataset.size} quads`);
          await this.fileCache.set(id, responseText);
        }

        return new WikidataEntity({
          cache: this,
          dataset,
          id,
          logger: this.logger,
        });
      },
    );

    this.memoryCache[id] = result;

    return result;
  }
}
