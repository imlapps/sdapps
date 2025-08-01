import { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import sanitizeFilename from "sanitize-filename";
import { Memoize } from "typescript-memoize";

export class JsonFileCache<JsonT> {
  private readonly directoryPath: string;
  private readonly logger?: Logger;
  private readonly parseJson: (json: unknown) => Promise<Either<Error, JsonT>>;

  constructor({
    directoryPath,
    logger,
    parseJson,
  }: {
    directoryPath: string;
    logger?: Logger;
    parseJson: (json: unknown) => Promise<Either<Error, JsonT>>;
  }) {
    this.directoryPath = directoryPath;
    this.logger = logger;
    this.parseJson = parseJson;
  }

  @Memoize()
  private filePath(key: string): string {
    return path.join(this.directoryPath, `${sanitizeFilename(key)}.json`);
  }

  async get(key: string): Promise<Either<Error, Maybe<JsonT>>> {
    return EitherAsync(async () => {
      const filePath = this.filePath(key);

      let fileStats: Stats | undefined;
      try {
        fileStats = await fs.stat(this.filePath(key));
        this.logger?.debug(`cache file ${filePath} exists`);
      } catch {
        this.logger?.debug(`cache file ${filePath} does not exist`);
      }

      if (fileStats) {
        const parseResult = await this.parseJson(
          JSON.parse((await fs.readFile(filePath)).toString("utf-8")),
        );
        if (parseResult.isRight()) {
          this.logger?.debug(
            `successfully parsed cache file ${filePath}:\n${JSON.stringify(parseResult.unsafeCoerce())}`,
          );
          return parseResult.toMaybe();
        }
      }

      return Maybe.empty();
    });
  }

  async set(key: string, value: JsonT): Promise<Either<Error, void>> {
    return EitherAsync(async () => {
      await fs.mkdir(this.directoryPath, { recursive: true });
      await fs.writeFile(this.filePath(key), JSON.stringify(value));
    });
  }
}
