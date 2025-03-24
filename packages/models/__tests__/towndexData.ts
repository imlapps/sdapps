import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { RdfjsDatasetModelSet } from "../src/RdfjsDatasetModelSet";

const thisDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);

async function loadDataset(): Promise<N3.Store> {
  const dataset = new N3.Store();
  const parser = new N3.Parser({ format: "application/trig" });
  for (const quad of parser.parse(
    (
      await fs.promises.readFile(
        path.join(thisDirectoryPath, "towndexData.trig"),
      )
    ).toString(),
  )) {
    dataset.add(quad);
  }
  return dataset;
}

const dataset = await loadDataset();
const resourceSet = new MutableResourceSet({
  dataFactory: N3.DataFactory,
  dataset,
});

export const towndexData = {
  dataset,
  rdfjsDatasetModelSet: new RdfjsDatasetModelSet({ dataset }),
};
