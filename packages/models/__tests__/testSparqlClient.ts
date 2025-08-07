import {
  OxigraphSparqlClient,
  SparqlQueryClient,
} from "@kos-kit/sparql-client";
import { DatasetCore } from "@rdfjs/types";
import N3 from "n3";
import * as oxigraph from "oxigraph";

export function testSparqlClient(dataset: DatasetCore): SparqlQueryClient {
  const store = new oxigraph.Store();
  for (const quad of dataset) {
    store.add(quad);
  }
  return new OxigraphSparqlClient({
    dataFactory: N3.DataFactory,
    store,
    useDefaultGraphAsUnion: true,
  });
}
