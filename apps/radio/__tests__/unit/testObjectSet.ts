import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OxigraphSparqlClient } from "@kos-kit/sparql-client";
import { $SparqlObjectSet } from "@sdapps/models";
import N3 from "n3";
import * as oxigraph from "oxigraph";

const thisDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);

export async function loadTestObjectSet(): Promise<$SparqlObjectSet> {
  const store = new oxigraph.Store();
  store.load(
    (
      await fs.promises.readFile(
        path.join(thisDirectoryPath, "testDataset.ttl"),
      )
    ).toString("utf-8"),
    { format: "text/turtle" },
  );

  return new $SparqlObjectSet({
    sparqlClient: new OxigraphSparqlClient({
      dataFactory: N3.DataFactory,
      store,
      // useDefaultGraphAsUnion: true,
    }),
  });
}

export const testObjectSet = await loadTestObjectSet();
