import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import N3 from "n3";

const thisDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);

export async function loadDataset(fileName: string): Promise<N3.Store> {
  const dataset = new N3.Store();
  const parser = new N3.Parser();
  for (const quad of parser.parse(
    (
      await fs.promises.readFile(path.join(thisDirectoryPath, fileName))
    ).toString(),
  )) {
    dataset.add(quad);
  }
  return dataset;
}
