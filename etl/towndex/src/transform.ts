import TermMap from "@rdfjs/term-map";
import type { BlankNode, DatasetCore, NamedNode } from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { kebabCase } from "change-case";
import * as N3 from "n3";
import { Either, Left } from "purify-ts";
import { type Resource, ResourceSet } from "rdfjs-resource";
import type { TextObject } from "./TextObject.js";
import { logger } from "./logger.js";

const sdoNamespaces = ["https://schema.org/", "http://schema.org/"];

function sdoValue(
  resource: Resource,
  unqualifiedPredicate: string,
): Either<Resource.ValueError, Resource.Value> {
  let valueError: Either<Resource.ValueError, Resource.Value>;
  for (const sdoNamespace of sdoNamespaces) {
    const value = resource.value(
      N3.DataFactory.namedNode(`${sdoNamespace}${unqualifiedPredicate}`),
    );
    if (value.isRight()) {
      return value;
    }
    valueError = value;
  }
  return valueError!;
}

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

    const nameQualifiers: string[] = [
      kebabCase(rdfTypeQuad.object.value.substring(rdfTypeNamespace.length)),
    ];
    sdoValue(resource, "startDate")
      .chain((value) => value.toString())
      // startDate doesn't always have proper literal datatype
      .chain((value) => {
        const date = Date.parse(value);
        return !Number.isNaN(date)
          ? Either.of(new Date(date))
          : Left(new Error("value is not a date"));
      })
      .ifRight((value) => {
        nameQualifiers.push(
          value.getFullYear().toString(),
          value.getMonth().toString().padStart(2, "0"),
          value.getDate().toString().padStart(2, "0"),
        );
      });

    const schemaName = sdoValue(resource, "name").chain((value) =>
      value.toString(),
    );
    if (!schemaName.isRight()) {
      logger.warn("blank node has no schema:name");
      continue;
    }
    const unqualifiedNameParts: string[] = [];
    sdoValue(resource, "jobTitle")
      .chain((value) => value.toString())
      .ifRight((value) => {
        unqualifiedNameParts.push(value);
      });
    unqualifiedNameParts.push(schemaName.unsafeCoerce());

    blankNodeToNamedNodeMap.set(
      rdfTypeQuad.subject,
      N3.DataFactory.namedNode(
        `${namespace.value}${nameQualifiers.join("/")}/${kebabCase(unqualifiedNameParts.join(" "))}`,
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
