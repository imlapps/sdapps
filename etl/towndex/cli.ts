#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import { command, flag, run } from "cmd-ts";
import { extractInput } from "./src/extractInputDataset";
import { extractTextObjects } from "./src/extractInputTextObjects";
import { load } from "./src/load";
import { cacheDirectoryPath } from "./src/paths";
import { transform } from "./src/transform";

run(
  command({
    description: "extract, transform and load town data",
    name: "cli",
    args: {
      noCache: flag({
        long: "no-cache",
      }),
    },
    handler: async ({ noCache }) => {
      if (noCache) {
        await fs.promises.rm(cacheDirectoryPath, { recursive: true });
      }

      const inputDataset = extractInput();

      await load(
        transform({
          documentDatasets: extractTextObjects(inputDataset),
          inputDataset,
        }),
      );
    },
  }),
  process.argv.slice(2),
);
