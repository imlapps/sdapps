import { DatasetCore } from "@rdfjs/types";
import { RdfFileLoader } from "@sdapps/etl";

import N3 from "n3";

export async function load(
  datasets: AsyncIterable<DatasetCore>,
): Promise<void> {
  return RdfFileLoader.create({
    fd: process.stdout,
    format: "text/turtle",
    prefixes: {
      ...RdfFileLoader.PREFIXES_DEFAULT,
      "npr-composer": N3.DataFactory.namedNode(
        "https://api.composer.nprstations.org/v1/",
      ),
      radio: N3.DataFactory.namedNode("http://purl.org/sdapps/instance/radio/"),
      sdapps: N3.DataFactory.namedNode("http://purl.org/sdapps/ontology#"),
    },
  }).load(datasets);
}
