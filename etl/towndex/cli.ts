#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import { command, flag, run } from "cmd-ts";
import * as dotenv from "dotenv";
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

      await load(transform(await extract()));
    },
  }),
  process.argv.slice(2),
);
