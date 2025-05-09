import PrefixMap from "@rdfjs/prefix-map/PrefixMap";
import Serializer from "@rdfjs/serializer-turtle";
import { DatasetCore, Quad } from "@rdfjs/types";
import { rdf, schema, xsd } from "@tpluscode/rdf-ns-builders";
import * as N3 from "n3";

export async function load(
  outputDatasets: AsyncIterable<DatasetCore>,
): Promise<void> {
  const quads: Quad[] = [];
  for await (const outputDataset of outputDatasets) {
    for (const quad of outputDataset) {
      quads.push(quad);
    }
  }

  process.stdout.write(
    new Serializer({
      prefixes: new PrefixMap(
        [
          ["schema", schema[""]],
          ["rdf", rdf[""]],
          ["xsd", xsd[""]],
        ],
        {
          factory: N3.DataFactory,
        },
      ),
    }).transform(quads),
  );
}
