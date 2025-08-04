import path from "node:path";
import N3 from "n3";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { TextFileCache } from "./TextFileCache.js";
import { WikidataEntity } from "./WikidataEntity.js";

export class WikidataEntityCache {
  private readonly logger?: Logger;
  private readonly fileCache: TextFileCache;
  private readonly memoryCache: Record<string, WikidataEntity> = {};

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

  async get(id: string): Promise<Either<Error, WikidataEntity>> {
    return EitherAsync(async ({ liftEither }) => {
      {
        const entry = this.memoryCache[id];
        if (entry) {
          return entry;
        }
      }

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
        this.logger?.trace(`fetched ${id} Turtle`);
        for (const quad of parser.parse(responseText)) {
          dataset.add(quad);
        }
        await this.fileCache.set(id, responseText);
      }

      const entry = new WikidataEntity({
        cache: this,
        dataset,
        id,
        logger: this.logger,
      });

      this.memoryCache[id] = entry;

      return entry;
    });
  }
}
