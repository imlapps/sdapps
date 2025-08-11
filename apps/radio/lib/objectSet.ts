import fs from "node:fs/promises";
import { logger } from "@/lib/logger";
import { serverConfiguration } from "@/lib/serverConfiguration";
import {
  GlobalRef,
  RdfDirectory,
  fsEither,
  getRdfFileFormat,
} from "@kos-kit/next-utils/server";
import { OxigraphSparqlClient } from "@kos-kit/sparql-client";
import { $SparqlObjectSet } from "@sdapps/models";
import N3 from "n3";
import * as oxigraph from "oxigraph";

const objectSetGlobalRef = new GlobalRef<$SparqlObjectSet>("objectSet");

if (!objectSetGlobalRef.value) {
  const store = new oxigraph.Store();
  if (serverConfiguration.dataPaths.length > 0) {
    logger.info(
      "loading dataset from data paths: %s",
      serverConfiguration.dataPaths.join(":"),
    );

    for (const dataPath of serverConfiguration.dataPaths) {
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
              store.load(file.path, { format: file.format.rdfFormat });
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
              .map((rdfFileFormat) => {
                store.load(absoluteDataPath, {
                  format: rdfFileFormat.rdfFormat,
                });
              })
              .extract();
          } else {
            logger.warn("%s is not a directory or a file", absoluteDataPath);
          }
        })
        .extract();
    }

    if (store.size === 0) {
      logger.warn("empty dataset after loading data paths");
    }
  } else {
    logger.warn("no data paths specified");
  }

  objectSetGlobalRef.value = new $SparqlObjectSet({
    sparqlClient: new OxigraphSparqlClient({
      dataFactory: N3.DataFactory,
      store,
      useDefaultGraphAsUnion: true,
    }),
  });
}
export const objectSet: $SparqlObjectSet = objectSetGlobalRef.value;
