#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rdfs } from "@tpluscode/rdf-ns-builders";
import { command, flag, run } from "cmd-ts";
import * as dotenv from "dotenv";
import * as N3 from "n3";
import { extract } from "./src/extract";
import { load } from "./src/load";
import { logger } from "./src/logger";
import { cachesDirectoryPath } from "./src/paths";
import { transform } from "./src/transform";

run(
  command({
    description: "extract, transform and load Towndex data",
    name: "cli",
    args: {
      noCache: flag({
        long: "no-cache",
      }),
    },
    handler: async ({ noCache }) => {
      dotenv.config();

      if (noCache) {
        logger.debug(`deleting caches directory ${cachesDirectoryPath}`);
        await fs.promises.rm(cachesDirectoryPath, { recursive: true });
        logger.debug(`deleted cache directory ${cachesDirectoryPath}`);
      }
      logger.debug(`cache directory: ${cachesDirectoryPath}`);

      const inputDataset = new N3.Store();
      logger.debug("extracting input dataset from stdin");
      inputDataset.addQuads(
        new N3.Parser().parse(fs.readFileSync(process.stdin.fd, "utf-8")),
      );
      logger.debug(`extracted ${inputDataset.size} quads from stdin`);

      const sdoDataset = new N3.Store();
      for (const quad of new N3.Parser().parse(
        (
          await fs.promises.readFile(
            path.join(
              path.dirname(fileURLToPath(import.meta.url)),
              "schemaorg-current-http.ttl",
            ),
          )
        ).toString("utf-8"),
      )) {
        if (quad.predicate.equals(rdfs.subClassOf)) {
          sdoDataset.add(quad);
        }
      }

      await load({
        inputDataset,
        sdoDataset,
        transformedDatasets: transform({
          textObjects: extract(inputDataset),
        }),
      });
    },
  }),
  process.argv.slice(2),
);
