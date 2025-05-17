import path from "node:path";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";
import { cachesDirectoryPath } from "./paths";

export const fetch = NodeFetchCache.create({
  cache: new FileSystemCache({
    cacheDirectory: path.join(cachesDirectoryPath, "fetch"),
  }),
});
