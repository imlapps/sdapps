import { DatasetCore } from "@rdfjs/types";
import { _void, rdf, rdfs, schema, sh, xsd } from "@tpluscode/rdf-ns-builders";
import * as N3 from "n3";

export async function load(
  datasets: AsyncIterable<DatasetCore>,
): Promise<void> {
  const writer = new N3.Writer(process.stdout, {
    format: "application/trig",
    end: false,
    prefixes: {
      rdf: rdf[""],
      rdfs: rdfs[""],
      schema: schema[""],
      sh: sh[""],
      xsd: xsd[""],
      void: _void[""],
    },
  });

  for await (const dataset of datasets) {
    for (const quad of dataset) {
      writer.addQuad(quad);
    }
  }

  writer.end();
}
