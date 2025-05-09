import path from "node:path";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";
import { cacheDirectoryPath } from "./paths";

export const fetch = NodeFetchCache.create({
  cache: new FileSystemCache({
    cacheDirectory: path.join(cacheDirectoryPath, "fetch-cache"),
  }),
});
