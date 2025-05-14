import TermMap from "@rdfjs/term-map";
import type {
  BlankNode,
  DatasetCore,
  Literal,
  NamedNode,
  Term,
} from "@rdfjs/types";
import { rdf, schema, xsd } from "@tpluscode/rdf-ns-builders";
import { kebabCase } from "change-case";
import * as N3 from "n3";
import { Maybe } from "purify-ts";
import { MutableResourceSet, type Resource, ResourceSet } from "rdfjs-resource";
import { invariant } from "ts-invariant";
import type { TextObject } from "./TextObject.js";
import { logger } from "./logger.js";

function addInversePropertyQuads(dataset: DatasetCore): DatasetCore {
  const resultDataset = copyDataset(dataset);
  const properties = [[schema.subEvent, schema.superEvent]];
  for (const quad of dataset) {
    for (const [directProperty, inverseProperty] of properties) {
      if (quad.predicate.equals(directProperty)) {
        invariant(quad.object.termType !== "Literal");
        resultDataset.add(
          N3.DataFactory.quad(
            quad.object,
            inverseProperty,
            quad.subject,
            quad.graph,
          ),
        );
      } else if (quad.predicate.equals(inverseProperty)) {
        invariant(quad.object.termType !== "Literal");
        resultDataset.add(
          N3.DataFactory.quad(
            quad.object,
            directProperty,
            quad.subject,
            quad.graph,
          ),
        );
      }
    }
  }
  return resultDataset;
}

function addTextObjectAboutQuad(
  dataset: DatasetCore,
  textObject: TextObject,
): DatasetCore {
  const resultDataset = copyDataset(dataset);
  const resourceSet = new ResourceSet({ dataset: resultDataset });
  for (const eventResource of resourceSet.instancesOf(schema.Event)) {
    if (eventResource.value(schema.superEvent).isLeft()) {
      // This is the root event
      // Assume the TextObject is about it.
      resultDataset.add(
        N3.DataFactory.quad(
          textObject.identifier,
          schema.about,
          eventResource.identifier,
        ),
      );
      return resultDataset;
    }
  }
  return resultDataset;
}

function copyDataset(dataset: DatasetCore): DatasetCore {
  const datasetCopy = new N3.Store();
  for (const quad of dataset) {
    datasetCopy.add(quad);
  }
  return datasetCopy;
}

function fixLiteralDatatypes(dataset: DatasetCore): DatasetCore {
  function fixLiteralDatatype(literal: Literal): Literal {
    invariant(literal.datatype);
    if (literal.datatype.value.startsWith(xsd[""].value)) {
      return literal;
    }
    if (literal.datatype.equals(schema.Date)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(literal.value)) {
        // The JSON-LD -> RDF conversion with the schema.org context has a lot of Date | DateTime unions
        // Test whether it's only a date or also has a time.
        return N3.DataFactory.literal(literal.value, xsd.date);
      }
      return N3.DataFactory.literal(literal.value, xsd.dateTime);
    }
    if (literal.datatype.equals(schema.DateTime)) {
      return N3.DataFactory.literal(literal.value, xsd.dateTime);
    }
    throw new Error(
      `unrecognized schema: literal datatype: ${literal.datatype.value}`,
    );
  }

  const resultDataset = new N3.Store();
  for (const quad of dataset) {
    if (quad.object.termType !== "Literal") {
      resultDataset.add(quad);
      continue;
    }
    resultDataset.add(
      N3.DataFactory.quad(
        quad.subject,
        quad.predicate,
        fixLiteralDatatype(quad.object),
        quad.graph,
      ),
    );
  }
  return resultDataset;
}

function normalizeSdoNamespace(dataset: DatasetCore): DatasetCore {
  invariant(schema[""].value === "http://schema.org/");
  const httpsSdoNamespace = "https://schema.org/";

  function normalizeTermSdoNamespace<TermT extends Term>(term: TermT): TermT {
    switch (term.termType) {
      case "BlankNode":
      case "DefaultGraph":
      case "Quad":
      case "Variable":
        return term;
      case "Literal":
        if (
          term.language.length === 0 &&
          term.datatype.value.startsWith(httpsSdoNamespace)
        ) {
          return N3.DataFactory.literal(
            term.value,
            N3.DataFactory.namedNode(
              `${schema[""].value}${term.datatype.value.substring(httpsSdoNamespace.length)}`,
            ),
          ) as any;
        }
        return term;
      case "NamedNode":
        if (term.value.startsWith(httpsSdoNamespace)) {
          return N3.DataFactory.namedNode(
            `${schema[""].value}${term.value.substring(httpsSdoNamespace.length)}`,
          ) as any;
        }
        return term;
    }
  }

  const resultDataset = new N3.Store();
  for (const quad of dataset) {
    resultDataset.add(
      N3.DataFactory.quad(
        normalizeTermSdoNamespace(quad.subject),
        normalizeTermSdoNamespace(quad.predicate),
        normalizeTermSdoNamespace(quad.object),
        quad.graph,
      ),
    );
  }
  return resultDataset;
}

function skolemize(dataset: DatasetCore, uriSpace: string): DatasetCore {
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
    if (!rdfTypeQuad.object.value.startsWith(schema[""].value)) {
      logger.warn(
        `blank node has non-schema.org rdf:type: ${rdfTypeQuad.object.value}`,
      );
      continue;
    }

    const resource = resourceSet.resource(rdfTypeQuad.subject);

    const nameQualifiers: string[] = [
      kebabCase(rdfTypeQuad.object.value.substring(schema[""].value.length)),
    ];
    resource
      .value(schema.startDate)
      .chain((value) => value.toDate())
      .ifRight((value) => {
        nameQualifiers.push(
          value.getFullYear().toString(),
          (value.getMonth() + 1).toString().padStart(2, "0"),
          value.getDate().toString().padStart(2, "0"),
        );
      });

    const schemaName = resource
      .value(schema.name)
      .chain((value) => value.toString());
    if (!schemaName.isRight()) {
      logger.warn("blank node has no schema:name");
      continue;
    }
    const unqualifiedNameParts: string[] = [];
    resource
      .value(schema.jobTitle)
      .chain((value) => value.toString())
      .ifRight((value) => {
        unqualifiedNameParts.push(value);
      });
    unqualifiedNameParts.push(schemaName.unsafeCoerce());

    blankNodeToNamedNodeMap.set(
      rdfTypeQuad.subject,
      N3.DataFactory.namedNode(
        `${uriSpace}${nameQualifiers.join("/")}/${kebabCase(unqualifiedNameParts.join(" "))}`,
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

function setNamedGraph(
  dataset: DatasetCore,
  namedGraph: NamedNode,
): DatasetCore {
  const resultDataset = new N3.Store();
  const defaultGraph = N3.DataFactory.defaultGraph();
  for (const quad of dataset) {
    if (quad.graph.equals(defaultGraph)) {
      resultDataset.add(
        N3.DataFactory.quad(
          quad.subject,
          quad.predicate,
          quad.object,
          namedGraph,
        ),
      );
    } else {
      logger.warn("quad is already in a named graph");
      resultDataset.add(quad);
    }
  }
  return resultDataset;
}

function propagateEventDates(dataset: DatasetCore): DatasetCore {
  const resultDataset = copyDataset(dataset);

  const resourceSet = new MutableResourceSet({
    dataFactory: N3.DataFactory,
    dataset: resultDataset,
  });

  const eventDateRecursive = (
    eventResource: Resource,
    predicate: NamedNode,
  ): Maybe<Literal> => {
    const eventDateLiteral = eventResource
      .value(predicate)
      .chain((value) => value.toLiteral());
    if (eventDateLiteral.isRight()) {
      return Maybe.of(eventDateLiteral.unsafeCoerce());
    }
    const superEventResource = eventResource
      .value(schema.superEvent)
      .chain((value) => value.toResource());
    if (superEventResource.isRight()) {
      return eventDateRecursive(superEventResource.unsafeCoerce(), predicate);
    }
    return Maybe.empty();
  };

  for (const eventResource of resourceSet.instancesOf(schema.Event)) {
    const eventRdfTypeQuads = [
      ...dataset.match(eventResource.identifier, rdf.type, null),
    ];
    invariant(eventRdfTypeQuads.length > 0);
    const mutateGraph = eventRdfTypeQuads[0].graph;
    for (const predicate of [schema.startDate]) {
      eventDateRecursive(eventResource, predicate).ifJust(
        (eventDateLiteral) => {
          resultDataset.add(
            N3.DataFactory.quad(
              eventResource.identifier,
              predicate,
              eventDateLiteral,
              mutateGraph,
            ),
          );
        },
      );
    }
  }

  return resultDataset;
}

export async function* transform({
  textObjects,
}: {
  textObjects: AsyncIterable<TextObject>;
}): AsyncIterable<DatasetCore> {
  for await (const textObject of textObjects) {
    // Order of transformations is important
    let dataset = textObject.content.dataset;

    dataset = normalizeSdoNamespace(dataset);
    dataset = fixLiteralDatatypes(dataset);
    if (textObject.identifier.termType === "NamedNode") {
      dataset = setNamedGraph(dataset, textObject.identifier);
    }
    dataset = addInversePropertyQuads(dataset);
    dataset = propagateEventDates(dataset);
    dataset = skolemize(dataset, textObject.uriSpace);
    dataset = addTextObjectAboutQuad(dataset, textObject);

    yield dataset;
  }
}
