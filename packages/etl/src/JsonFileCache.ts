import fs from "node:fs/promises";
import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { ZodRecord, ZodString, ZodType, z } from "zod";

export class JsonFileCache<ValueT> {
  readonly filePath: string;
  private cache: Record<string, ValueT> | null = null;
  private readonly logger?: Logger;
  private readonly schema: ZodRecord<ZodString, ZodType<ValueT>>;

  constructor({
    filePath,
    logger,
    valueSchema,
  }: {
    filePath: string;
    logger?: Logger;
    valueSchema: ZodType<ValueT>;
  }) {
    this.filePath = filePath;
    this.logger = logger;
    this.schema = z.record(z.string(), valueSchema);
  }

  async get(key: string): Promise<Either<Error, Maybe<ValueT>>> {
    return EitherAsync(async () => {
      return Maybe.fromNullable((await this.lazyCache())[key]);
    });
  }

  async lazyCache(): Promise<Record<string, ValueT>> {
    if (this.cache !== null) {
      return this.cache;
    }

    this.logger?.trace(`reading ${this.filePath}`);
    let fileContents: string;
    try {
      fileContents = (await fs.readFile(this.filePath)).toString("utf-8");
    } catch {
      this.cache = {};
      return this.cache;
    }
    this.logger?.trace(`read ${this.filePath}`);

    if (fileContents.length === 0) {
      this.cache = {};
      return this.cache;
    }

    this.logger?.trace(`parsing ${this.filePath}`);
    this.cache = await this.schema.parseAsync(JSON.parse(fileContents));
    this.logger?.trace(`parsed ${this.filePath}`);
    return this.cache;
  }

  async set(key: string, value: ValueT): Promise<Either<Error, void>> {
    return EitherAsync(async () => {
      const cache = await this.lazyCache();
      cache[key] = value;

      const sortedCache: Record<string, ValueT> = {};
      for (const key of Object.keys(cache).sort()) {
        sortedCache[key] = cache[key];
      }
      this.cache = sortedCache;

      this.logger?.trace(`writing ${this.filePath}`);
      await fs.writeFile(
        this.filePath,
        JSON.stringify(this.cache, undefined, 2),
      );
      this.logger?.trace(`wrote ${this.filePath}`);
    });
  }
}
