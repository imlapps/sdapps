#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import { command, flag, option, run } from "cmd-ts";
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
      namespace: option({
        description: "namespace to mint new IRIs in",
        long: "namespace",
        short: "n",
      }),
      noCache: flag({
        long: "no-cache",
      }),
    },
    handler: async ({ namespace, noCache }) => {
      dotenv.config();

      if (noCache) {
        logger.debug(`deleting caches directory ${cachesDirectoryPath}`);
        await fs.promises.rm(cachesDirectoryPath, { recursive: true });
        logger.debug(`deleted cache directory ${cachesDirectoryPath}`);
      }
      logger.debug(`cache directory: ${cachesDirectoryPath}`);

      logger.debug("extracting input dataset from stdin");
      const inputString = fs.readFileSync(process.stdin.fd, "utf-8");
      const inputParser = new N3.Parser();
      const inputDataset = new N3.Store();
      inputDataset.addQuads(inputParser.parse(inputString));
      logger.debug(`extracted ${inputDataset.size} quads from stdin`);

      await load({
        inputDataset,
        transformedDatasets: transform({
          namespace: N3.DataFactory.namedNode(namespace),
          textObjects: extract(inputDataset),
        }),
      });
    },
  }),
  process.argv.slice(2),
);
