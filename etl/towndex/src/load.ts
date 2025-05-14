import { DatasetCore } from "@rdfjs/types";
import { rdf, schema, xsd } from "@tpluscode/rdf-ns-builders";
import * as N3 from "n3";

export async function load({
  inputDataset,
  sdoDataset,
  transformedDatasets,
}: {
  inputDataset: DatasetCore;
  sdoDataset: DatasetCore;
  transformedDatasets: AsyncIterable<DatasetCore>;
}): Promise<void> {
  const writer = new N3.Writer(process.stdout, {
    format: "application/trig",
    end: false,
    prefixes: {
      rdf: rdf[""],
      schema: schema[""],
      xsd: xsd[""],
    },
  });

  for (const quad of inputDataset) {
    writer.addQuad(quad);
  }
  for (const quad of sdoDataset) {
    writer.addQuad(quad);
  }
  for await (const transformedDataset of transformedDatasets) {
    for (const quad of transformedDataset) {
      writer.addQuad(quad);
    }
  }

  writer.end();
}
