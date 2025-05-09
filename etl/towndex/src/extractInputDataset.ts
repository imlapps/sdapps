import fs from "node:fs";
import { DatasetCore } from "@rdfjs/types";
import * as N3 from "n3";

export function extractInputDataset(): DatasetCore {
  const inputString = fs.readFileSync(process.stdin.fd, "utf-8");
  const inputParser = new N3.Parser();
  const store = new N3.Store();
  store.addQuads(inputParser.parse(inputString));
  return store;
}
