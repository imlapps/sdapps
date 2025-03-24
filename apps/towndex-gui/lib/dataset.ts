import fs from "node:fs/promises";
import { logger } from "@/lib/logger";
import {
  GlobalRef,
  RdfDirectory,
  RdfFile,
  fsEither,
  getRdfFileFormat,
} from "@kos-kit/next-utils/server";
import { DatasetCore } from "@rdfjs/types";
import * as N3 from "n3";
import { configuration } from "./configuration";

async function loadDataset(dataPaths: readonly string[]): Promise<DatasetCore> {
  logger.info("loading dataset from data paths: %s", dataPaths.join(":"));
  const dataFactory = N3.DataFactory;
  const dataset = new N3.Store();

  for (const dataPath of dataPaths) {
    const absoluteDataPath = await fs.realpath(dataPath);
    await (await fsEither.stat(absoluteDataPath))
      .mapLeft(async (error) => {
        logger.warn("error stat'ing %s: %s", absoluteDataPath, error.message);
      })
      .map(async (stat) => {
        if (stat.isDirectory()) {
          for await (const file of new RdfDirectory({
            logger,
            path: absoluteDataPath,
          }).files()) {
            await file.parse({ dataFactory, dataset });
          }
        } else if (stat.isFile()) {
          await getRdfFileFormat(absoluteDataPath)
            .mapLeft(async (error: any) => {
              logger.warn(
                "%s is not an RDF file: %s",
                absoluteDataPath,
                error.message,
              );
            })
            .map(async (rdfFileFormat) => {
              await new RdfFile({
                logger,
                path: absoluteDataPath,
                format: rdfFileFormat,
              }).parse({ dataFactory, dataset });
            })
            .extract();
        } else {
          logger.warn("%s is not a directory or a file", absoluteDataPath);
        }
      })
      .extract();
  }

  if (dataset.size === 0) {
    logger.warn("empty dataset after loading data paths");
  }

  return dataset;
}

const datasetGlobalRef = new GlobalRef<DatasetCore>("dataset");

if (!datasetGlobalRef.value) {
  datasetGlobalRef.value = await loadDataset(configuration.dataPaths);
}
export const dataset: DatasetCore = datasetGlobalRef.value;
