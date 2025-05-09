import { DatasetCore } from "@rdfjs/types";

export async function transform({
  documentDatasets,
  inputDataset,
}: {
  documentDatasets: AsyncIterable<DatasetCore>;
  inputDataset: DatasetCore;
}): AsyncIterable<DatasetCore> {}
