import { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import sanitizeFilename from "sanitize-filename";
import { Memoize } from "typescript-memoize";

export class TextFileCache {
  private readonly directoryPath: string;
  private readonly fileExtension: string;
  private readonly logger?: Logger;

  constructor({
    directoryPath,
    fileExtension,
    logger,
  }: {
    directoryPath: string;
    fileExtension?: string;
    logger?: Logger;
  }) {
    this.directoryPath = directoryPath;
    this.fileExtension = fileExtension ?? ".txt";
    this.logger = logger;
  }

  @Memoize()
  private filePath(key: string): string {
    return path.join(
      this.directoryPath,
      `${sanitizeFilename(key)}${this.fileExtension}`,
    );
  }

  async get(key: string): Promise<Either<Error, Maybe<string>>> {
    return EitherAsync(async () => {
      const filePath = this.filePath(key);

      let fileStats: Stats | undefined;
      try {
        fileStats = await fs.stat(filePath);
        this.logger?.trace(`cache file ${filePath} exists`);
      } catch {
        this.logger?.trace(`cache file ${filePath} does not exist`);
      }

      if (fileStats) {
        return Maybe.of((await fs.readFile(filePath)).toString("utf-8"));
      }

      return Maybe.empty();
    });
  }

  async set(key: string, value: string): Promise<Either<Error, void>> {
    return EitherAsync(async () => {
      await fs.mkdir(this.directoryPath, { recursive: true });
      await fs.writeFile(this.filePath(key), value, { encoding: "utf-8" });
    });
  }
}
