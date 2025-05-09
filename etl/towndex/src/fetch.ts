import {} from "@sdapps/models";
import {} from "@tpluscode/rdf-ns-builders";
import {} from "cmd-ts";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";
import { cacheDirectoryPath } from "./paths";

export const fetch = NodeFetchCache.create({
  cache: new FileSystemCache({
    cacheDirectory: cacheDirectoryPath,
  }),
});
