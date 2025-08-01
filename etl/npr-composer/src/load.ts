import { DatasetCore } from "@rdfjs/types";
import { RdfFileLoader } from "@sdapps/etl";
import { prov, skos } from "@tpluscode/rdf-ns-builders";

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
      prov: prov[""],
      radio: N3.DataFactory.namedNode("http://purl.org/sdapps/instance/radio/"),
      sdapps: N3.DataFactory.namedNode("http://purl.org/sdapps/ontology#"),
      skos: skos[""],
      wd: N3.DataFactory.namedNode("http://www.wikidata.org/entity/"),
      wdno: N3.DataFactory.namedNode("http://www.wikidata.org/prop/novalue/"),
      wdt: N3.DataFactory.namedNode("http://www.wikidata.org/prop/direct/"),
      wdtn: N3.DataFactory.namedNode(
        "http://www.wikidata.org/prop/direct-normalized/",
      ),
      wdv: N3.DataFactory.namedNode("http://www.wikidata.org/value/"),
      wikibase: N3.DataFactory.namedNode("http://wikiba.se/ontology#"),
    },
  }).load(datasets);
}
