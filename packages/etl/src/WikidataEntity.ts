import { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { DatasetCore, NamedNode } from "@rdfjs/types";
import N3 from "n3";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { Memoize } from "typescript-memoize";

export class WikidataEntity {
  private readonly cachesDirectoryPath: string;
  readonly id: string;
  private readonly logger?: Logger;

  constructor({
    cachesDirectoryPath,
    id,
    logger,
  }: { cachesDirectoryPath: string; id: string; logger?: Logger }) {
    this.cachesDirectoryPath = cachesDirectoryPath;
    this.id = id;
    this.logger = logger;
  }

  async dataset(): Promise<Either<Error, DatasetCore>> {
    return EitherAsync(async () => {
      const cacheDirectoryPath = path.join(
        this.cachesDirectoryPath,
        "wikidata",
        "rdf",
      );
      const cacheFilePath = path.join(cacheDirectoryPath, `${this.id}.ttl`);

      let cacheFileStats: Stats | undefined;
      try {
        cacheFileStats = await fs.stat(cacheFilePath);
        this.logger?.debug(`cache file ${cacheFilePath} exists`);
      } catch {
        this.logger?.debug(`cache file ${cacheFilePath} does not exist`);
      }

      const dataset = new N3.Store();
      const parser = new N3.Parser();
      if (cacheFileStats) {
        for (const quad of parser.parse(
          (await fs.readFile(cacheFilePath)).toString("utf-8"),
        )) {
          dataset.add(quad);
        }
        return dataset;
      }

      const response = await fetch(`${this.iri.value}.ttl`);
      const responseText = await response.text();
      for (const quad of parser.parse(responseText)) {
        dataset.add(quad);
      }
      await fs.mkdir(cacheDirectoryPath, { recursive: true });
      await fs.writeFile(cacheFilePath, responseText, { encoding: "utf-8" });
      return dataset;
    });
  }

  @Memoize()
  get iri(): NamedNode {
    return N3.DataFactory.namedNode(
      `http://www.wikidata.org/entity/${this.id}`,
    );
  }

  toString(): string {
    return this.id;
  }
}
