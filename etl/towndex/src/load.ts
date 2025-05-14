import { DatasetCore } from "@rdfjs/types";
import { rdf, schema, xsd } from "@tpluscode/rdf-ns-builders";
import * as N3 from "n3";

export async function load(
  datasets: AsyncIterable<DatasetCore>,
): Promise<void> {
  const writer = new N3.Writer(process.stdout, {
    format: "application/trig",
    end: false,
    prefixes: {
      rdf: rdf[""],
      schema: schema[""],
      xsd: xsd[""],
    },
  });

  for await (const dataset of datasets) {
    for (const quad of dataset) {
      writer.addQuad(quad);
    }
  }

  writer.end();
}
