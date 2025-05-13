import TermMap from "@rdfjs/term-map";
import type { BlankNode, DatasetCore, NamedNode } from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { kebabCase } from "change-case";
import * as N3 from "n3";
import { ResourceSet } from "rdfjs-resource";
import type { TextObject } from "./TextObject.js";
import { logger } from "./logger.js";

const sdoNamespaces = ["https://schema.org/", "http://schema.org/"];

function skolemize(dataset: DatasetCore, namespace: NamedNode): DatasetCore {
  // Simple approach: one pass to construct the names and another pass to replace them

  const blankNodeToNamedNodeMap = new TermMap<BlankNode, NamedNode>();
  const resourceSet = new ResourceSet({ dataset });

  for (const rdfTypeQuad of dataset.match(null, rdf.type, null, null)) {
    if (rdfTypeQuad.subject.termType !== "BlankNode") {
      continue;
    }
    if (rdfTypeQuad.object.termType !== "NamedNode") {
      continue;
    }
    const rdfTypeNamespace = sdoNamespaces.find((sdoNamespace) =>
      rdfTypeQuad.object.value.startsWith(sdoNamespace),
    );
    if (!rdfTypeNamespace) {
      logger.warn(
        `blank node has non-schema.org rdf:type: ${rdfTypeQuad.object.value}`,
      );
      continue;
    }

    const resource = resourceSet.resource(rdfTypeQuad.subject);
    let schemaJobTitle: string | undefined;
    let schemaName: string | undefined;
    for (const sdoNamespace of sdoNamespaces) {
      if (!schemaJobTitle) {
        schemaJobTitle = resource
          .value(N3.DataFactory.namedNode(`${sdoNamespace}jobTitle`))
          .chain((value) => value.toString())
          .toMaybe()
          .extract();
      }
      if (!schemaName) {
        schemaName = resource
          .value(N3.DataFactory.namedNode(`${sdoNamespace}name`))
          .chain((value) => value.toString())
          .toMaybe()
          .extract();
      }
    }
    const name: string[] = [];
    if (schemaJobTitle) {
      name.push(schemaJobTitle);
    }
    if (!schemaName) {
      logger.warn("blakn node has no schema:name");
      continue;
    }
    name.push(schemaName);

    blankNodeToNamedNodeMap.set(
      rdfTypeQuad.subject,
      N3.DataFactory.namedNode(
        `${namespace.value}${kebabCase(rdfTypeQuad.object.value.substring(rdfTypeNamespace.length))}/${kebabCase(name.join(" "))}`,
      ),
    );
  }

  const skolemizedDataset = new N3.Store();
  for (const quad of dataset) {
    skolemizedDataset.add(
      N3.DataFactory.quad(
        blankNodeToNamedNodeMap.get(quad.subject) ?? quad.subject,
        quad.predicate,
        blankNodeToNamedNodeMap.get(quad.object) ?? quad.object,
        quad.graph,
      ),
    );
  }
  return skolemizedDataset;
}

export async function* transform({
  namespace,
  textObjects,
}: {
  namespace: NamedNode;
  textObjects: AsyncIterable<TextObject>;
}): AsyncIterable<DatasetCore> {
  for await (const textObject of textObjects) {
    yield skolemize(textObject.content.dataset, namespace);
  }
}
