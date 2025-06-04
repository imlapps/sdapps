#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { command, flag, option, run } from "cmd-ts";
import * as dates from "date-fns";
import * as dotenv from "dotenv";
import { extract } from "./src/extract";
import { logger } from "./src/logger";
import { transform } from "./src/transform";

const thisDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);

run(
  command({
    description: "extract, transform and load Towndex data",
    name: "cli",
    args: {
      cachesDirectoryPath: option({
        defaultValue: () =>
          path.resolve(
            thisDirectoryPath,
            "..",
            "..",
            "data",
            "npr-composer",
            ".caches",
          ),
        long: "caches-directory-path",
      }),
      endDate: option({
        defaultValue: () => "",
        long: "end-date",
        short: "e",
      }),
      noCache: flag({
        long: "no-cache",
      }),
      startDate: option({
        defaultValue: () => "",
        long: "start-date",
        short: "s",
      }),
      ucs: option({
        long: "ucs",
      }),
    },
    handler: async ({
      cachesDirectoryPath,
      endDate: endDateString,
      noCache,
      startDate: startDateString,
      ucs,
    }) => {
      dotenv.config();

      if (noCache) {
        logger.debug(`deleting caches directory ${cachesDirectoryPath}`);
        await fs.promises.rm(cachesDirectoryPath, { recursive: true });
        logger.debug(`deleted cache directory ${cachesDirectoryPath}`);
      }
      logger.debug(`cache directory: ${cachesDirectoryPath}`);

      const currentDate = new Date();
      const endDate = endDateString
        ? dates.parseISO(endDateString)
        : dates.subDays(
            new Date(
              Date.UTC(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
              ),
            ),
            1,
          );
      const startDate = startDateString
        ? dates.parseISO(startDateString)
        : dates.subDays(endDate, 30);

      await transform(
        extract({
          cachesDirectoryPath,
          endDate,
          startDate,
          ucs,
        }),
      );
    },
  }),
  process.argv.slice(2),
);
