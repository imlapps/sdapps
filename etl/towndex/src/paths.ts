import path from "node:path";
import { fileURLToPath } from "node:url";

const thisDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);

export const dataDirectoryPath = path.resolve(
  thisDirectoryPath,
  "..",
  "..",
  "..",
  "data",
  "towndex",
);

export const cachesDirectoryPath = path.join(dataDirectoryPath, ".caches");
