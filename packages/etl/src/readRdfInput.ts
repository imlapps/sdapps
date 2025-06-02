import { Stats } from "node:fs";
import fs from "node:fs/promises";
import { DatasetCore } from "@rdfjs/types";
import * as N3 from "n3";
import { Logger } from "pino";
import { Either, Left, Maybe } from "purify-ts";
import { fromFile } from "rdf-utils-fs";
import { deepCopyRdfTerm } from "./deepCopyRdfTerm.js";

async function readRdfFile({
  filePath,
  logger,
}: { filePath: string; logger?: Logger }): Promise<Either<Error, DatasetCore>> {
  logger?.debug(`reading input RDF from ${filePath}`);
  return new Promise((resolve) => {
    const store = new N3.Store();
    fromFile(filePath)
      .on("data", (quad) => store.add(deepCopyRdfTerm(quad)))
      .on("error", (error) => resolve(Left(error)))
      .on("end", () => {
        logger?.debug(`read ${store.size} quads from ${filePath}`);
        resolve(Either.of(store));
      });
  });
}

async function readRdfFromStdin({
  logger,
}: { logger?: Logger }): Promise<Either<Error, DatasetCore>> {
  logger?.debug("reading input RDF from stdin");
  return new Promise((resolve) => {
    const store = new N3.Store();
    const streamParser = new N3.StreamParser();
    process.stdin
      .pipe(streamParser)
      .on("data", (quad) => store.add(quad))
      .on("error", (error) => resolve(Left(error)))
      .on("end", () => {
        logger?.debug(`read ${store.size} quads from stdin`);
        resolve(Either.of(store));
      });
  });
}

export async function readRdfInput(
  input: Maybe<string>,
  options?: { logger?: Logger },
): Promise<Either<Error, DatasetCore>> {
  const logger = options?.logger;

  if (input.isNothing()) {
    return readRdfFromStdin({ logger });
  }

  let stat: Stats | undefined;
  try {
    stat = await fs.stat(input.unsafeCoerce());
  } catch (e) {
    logger?.debug(`${input.unsafeCoerce()} is not a file or is not accessible`);
  }

  if (stat) {
    if (stat.isFile()) {
      return readRdfFile({ filePath: input.unsafeCoerce(), logger });
    }
  }

  throw new Error("not implemented");
}
