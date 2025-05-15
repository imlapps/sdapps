import TermMap from "@rdfjs/term-map";
import type {
  BlankNode,
  DatasetCore,
  Literal,
  NamedNode,
  Term,
} from "@rdfjs/types";
import { Identifier } from "@sdapps/models";
import { rdf, rdfs, schema, xsd } from "@tpluscode/rdf-ns-builders";
import { kebabCase } from "change-case";
import * as N3 from "n3";
import { Maybe } from "purify-ts";
import { type Resource, ResourceSet } from "rdfjs-resource";
import { invariant } from "ts-invariant";
import type { TextObject } from "./TextObject.js";
import { logger } from "./logger.js";

function addInversePropertyQuads({
  instanceDataset,
  propertyOntologyDataset,
}: {
  instanceDataset: DatasetCore;
  propertyOntologyDataset: DatasetCore;
}): DatasetCore {
  const resultDataset = copyDataset(instanceDataset);

  for (const propertyInverseOfQuad of propertyOntologyDataset.match(
    null,
    schema.inverseOf,
    null,
  )) {
    const directProperty = propertyInverseOfQuad.subject;
    invariant(directProperty.termType === "NamedNode");
    const inverseProperty = propertyInverseOfQuad.object;
    invariant(inverseProperty.termType === "NamedNode");

    for (const quad of instanceDataset.match(null, directProperty, null)) {
      invariant(quad.object.termType !== "Literal");
      resultDataset.add(
        N3.DataFactory.quad(
          quad.object,
          inverseProperty,
          quad.subject,
          quad.graph,
        ),
      );
    }
  }

  return resultDataset;
}

function getClassOntologyDataset(ontologyDataset: DatasetCore): DatasetCore {
  const classOntologyDataset = new N3.Store();
  // Add (s, rdfs:subClassOf, o) triples
  for (const quad of ontologyDataset.match(null, rdfs.subClassOf, null)) {
    invariant(quad.graph.termType === "DefaultGraph");
    classOntologyDataset.add(quad);
  }
  return classOntologyDataset;
}

function getPropertyOntologyDataset(ontologyDataset: DatasetCore): DatasetCore {
  const propertyOntologyDataset = new N3.Store();

  // Add (s, rdf:type, rdf:Property) when there's also a (s, schema:inverseOf, o)
  for (const propertyRdfTypeQuad of ontologyDataset.match(
    null,
    rdf.type,
    rdf.Property,
  )) {
    for (const propertyInverseOfQuad of ontologyDataset.match(
      propertyRdfTypeQuad.subject,
      schema.inverseOf,
      null,
    )) {
      propertyOntologyDataset.add(propertyRdfTypeQuad);
      propertyOntologyDataset.add(propertyInverseOfQuad);
    }
    for (const propertySupersededByQuad of ontologyDataset.match(
      propertyRdfTypeQuad.subject,
      schema.supersededBy,
      null,
    )) {
      propertyOntologyDataset.add(propertyRdfTypeQuad);
      propertyOntologyDataset.add(propertySupersededByQuad);
    }
  }

  return propertyOntologyDataset;
}

function inferTextObjectQuads({
  classOntologyDataset,
  instanceDataset,
  textObject,
}: {
  classOntologyDataset: DatasetCore;
  instanceDataset: DatasetCore;
  textObject: TextObject;
}): DatasetCore {
  const resultDataset = copyDataset(instanceDataset);

  const mergedDatasetResourceSet = new ResourceSet({
    dataset: mergeDatasets(classOntologyDataset, instanceDataset),
  });

  for (const eventResource of mergedDatasetResourceSet.instancesOf(
    schema.Event,
  )) {
    if (eventResource.value(schema.superEvent).isLeft()) {
      // This is the root schema:Event
      // Assume the schema:TextObject is schema:about it.
      resultDataset.add(
        N3.DataFactory.quad(
          textObject.identifier,
          schema.about,
          eventResource.identifier,
          textObject.identifier,
        ),
      );
      // Add the inverse schema:subjectOf from the schema:Event to the schema:TextObject
      resultDataset.add(
        N3.DataFactory.quad(
          eventResource.identifier,
          schema.subjectOf,
          textObject.identifier,
          textObject.identifier,
        ),
      );
      break;
    }
  }

  const textObjectResource = mergedDatasetResourceSet.resource(
    textObject.identifier,
  );
  if (textObjectResource.value(schema.name).isLeft()) {
    const contentUrlPath = new URL(textObject.content.url.value).pathname.split(
      "/",
    );
    if (contentUrlPath.at(-1)!.length > 0) {
      // Use the last non-empty path segment as the schema:name
      resultDataset.add(
        N3.DataFactory.quad(
          textObject.identifier,
          schema.name,
          N3.DataFactory.literal(contentUrlPath.at(-1)!),
          textObject.identifier,
        ),
      );
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

function fixLiteralDatatypes(instanceDataset: DatasetCore): DatasetCore {
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
  for (const quad of instanceDataset) {
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

function mergeDatasets(...datasets: readonly DatasetCore[]): DatasetCore {
  const mergedDataset = new N3.Store();
  for (const dataset of datasets) {
    for (const quad of dataset) {
      mergedDataset.add(quad);
    }
  }
  return mergedDataset;
}

function normalizeSdoNamespace(instanceDataset: DatasetCore): DatasetCore {
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
  for (const quad of instanceDataset) {
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

function replaceSupersededPredicates({
  instanceDataset,
  propertyOntologyDataset,
}: {
  instanceDataset: DatasetCore;
  propertyOntologyDataset: DatasetCore;
}): DatasetCore {
  const resultDataset = new N3.Store();

  for (const quad of instanceDataset) {
    let addQuad = true;
    for (const supersededByQuad of propertyOntologyDataset.match(
      null,
      schema.supersededBy,
      null,
    )) {
      if (quad.predicate.equals(supersededByQuad.subject)) {
        invariant(supersededByQuad.object.termType === "NamedNode");
        resultDataset.add(
          N3.DataFactory.quad(
            quad.subject,
            supersededByQuad.object,
            quad.object,
            quad.graph,
          ),
        );
        addQuad = false;
        break;
      }
    }
    if (addQuad) {
      resultDataset.add(quad);
    }
  }

  return resultDataset;
}

function skolemize({
  instanceDataset,
  classOntologyDataset,
  uriSpace,
}: {
  classOntologyDataset: DatasetCore;
  instanceDataset: DatasetCore;
  uriSpace: string;
}): DatasetCore {
  // Simple approach: one pass to construct the names and another pass to replace them

  // Merge the instance and ontology datasets in order to do instance-of checks on subclasses
  const mergedDataset = mergeDatasets(classOntologyDataset, instanceDataset);
  const mergedResourceSet = new ResourceSet({ dataset: mergedDataset });

  const blankNodeToNamedNodeMap = new TermMap<BlankNode, NamedNode>();

  for (const rdfTypeQuad of mergedDataset.match(null, rdf.type, null, null)) {
    if (rdfTypeQuad.subject.termType !== "BlankNode") {
      continue;
    }
    const rdfType = rdfTypeQuad.object;
    if (rdfType.termType !== "NamedNode") {
      continue;
    }
    if (!rdfType.value.startsWith(schema[""].value)) {
      logger.warn(
        `blank node has non-schema.org rdf:type: ${rdfTypeQuad.object.value}`,
      );
      continue;
    }

    const resource = mergedResourceSet.resource(rdfTypeQuad.subject);

    const nameQualifiers: string[] = [
      kebabCase(rdfType.value.substring(schema[""].value.length)),
    ];
    let datePredicate: NamedNode | undefined;
    if (resource.isInstanceOf(schema.Action)) {
      datePredicate = schema.startTime;
    } else if (resource.isInstanceOf(schema.CreativeWork)) {
      datePredicate = schema.datePublished;
    } else if (resource.isInstanceOf(schema.Event)) {
      datePredicate = schema.startDate;
    } else if (resource.isInstanceOf(schema.Invoice)) {
      datePredicate = schema.paymentDueDate;
    } else if (resource.isInstanceOf(schema.MonetaryAmount)) {
      datePredicate = schema.validFrom;
    } else if (resource.isInstanceOf(schema.OrderReturned)) {
      datePredicate = schema.orderDate;
    }
    if (datePredicate) {
      resource
        .value(datePredicate)
        .chain((value) => value.toDate())
        .ifRight((value) =>
          nameQualifiers.push(
            value.getFullYear().toString(),
            (value.getMonth() + 1).toString().padStart(2, "0"),
            value.getDate().toString().padStart(2, "0"),
          ),
        );
    }

    const schemaName = resource
      .value(schema.name)
      .chain((value) => value.toString());
    if (!schemaName.isRight()) {
      logger.warn(
        `blank node with rdf:type ${rdfType.value} has no schema:name`,
      );
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

  const skolemizedInstanceDataset = new N3.Store();
  for (const quad of instanceDataset) {
    skolemizedInstanceDataset.add(
      N3.DataFactory.quad(
        blankNodeToNamedNodeMap.get(quad.subject) ?? quad.subject,
        quad.predicate,
        blankNodeToNamedNodeMap.get(quad.object) ?? quad.object,
        quad.graph,
      ),
    );
  }
  return skolemizedInstanceDataset;
}

function propagateDates({
  classOntologyDataset,
  instanceDataset,
}: {
  classOntologyDataset: DatasetCore;
  instanceDataset: DatasetCore;
}): DatasetCore {
  const mergedResourceSet = new ResourceSet({
    dataset: mergeDatasets(classOntologyDataset, instanceDataset),
  });

  const predicates = [
    {
      actionPredicate: schema.startTime,
      creativeWorkPredicate: schema.datePublished,
      eventPredicate: schema.startDate,
      invoicePredicate: schema.paymentDueDate,
    },
  ];

  const resultDataset = copyDataset(instanceDataset);

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

  for (const eventResource of mergedResourceSet.instancesOf(schema.Event)) {
    const eventRdfTypeQuads = [
      ...instanceDataset.match(eventResource.identifier, rdf.type, null),
    ];
    invariant(eventRdfTypeQuads.length > 0);
    const mutateGraph = eventRdfTypeQuads[0].graph;
    for (const {
      actionPredicate,
      creativeWorkPredicate,
      eventPredicate,
      invoicePredicate,
    } of predicates) {
      eventDateRecursive(eventResource, eventPredicate).ifJust(
        (eventDateLiteral) => {
          // Propagate the date from the super event to this event
          resultDataset.add(
            N3.DataFactory.quad(
              eventResource.identifier,
              eventPredicate,
              eventDateLiteral,
              mutateGraph,
            ),
          );

          // Propagate the date to the event's schema:about
          for (const aboutResource of eventResource
            .values(schema.about)
            .flatMap((value) => value.toResource().toMaybe().toList())) {
            if (aboutResource.isInstanceOf(schema.Action)) {
              // logger.debug(
              //   `propagating schema:Event ${Identifier.toString(eventResource.identifier)} ${eventPredicate.value} to schema:Action ${Identifier.toString(aboutResource.identifier)} ${actionPredicate.value}`,
              // );
              resultDataset.add(
                N3.DataFactory.quad(
                  aboutResource.identifier,
                  actionPredicate,
                  eventDateLiteral,
                  mutateGraph,
                ),
              );
            } else if (aboutResource.isInstanceOf(schema.CreativeWork)) {
              // logger.debug(
              //   `propagating schema:Event ${Identifier.toString(eventResource.identifier)} ${eventPredicate.value} to schema:CreativeWork ${Identifier.toString(aboutResource.identifier)} ${creativeWorkPredicate.value}`,
              // );
              resultDataset.add(
                N3.DataFactory.quad(
                  aboutResource.identifier,
                  creativeWorkPredicate,
                  eventDateLiteral,
                  mutateGraph,
                ),
              );
            } else if (aboutResource.isInstanceOf(schema.Invoice)) {
              // logger.debug(
              //   `propagating schema:Event ${Identifier.toString(eventResource.identifier)} ${eventPredicate.value} to schema:Invoice ${Identifier.toString(aboutResource.identifier)} ${invoicePredicate.value}`,
              // );
              resultDataset.add(
                N3.DataFactory.quad(
                  aboutResource.identifier,
                  invoicePredicate,
                  eventDateLiteral,
                  mutateGraph,
                ),
              );
            } else if (
              aboutResource.isInstanceOf(schema.Organization) ||
              aboutResource.isInstanceOf(schema.Person) ||
              aboutResource.isInstanceOf(schema.Thing, {
                excludeSubclasses: true,
              })
            ) {
              // logger.debug(
              //   `event ${Identifier.toString(eventResource.identifier)} is about ${Identifier.toString(aboutResource.identifier)}`,
              // );
            } else {
              logger.warn(
                `event ${Identifier.toString(eventResource.identifier)} is schema:about an unknown type: ${
                  aboutResource
                    .value(rdf.type)
                    .chain((value) => value.toIri())
                    .toMaybe()
                    .extractNullable()?.value
                }`,
              );
            }
          }
        },
      );
    }
  }

  return resultDataset;
}

export async function* transform({
  inputDataset,
  ontologyDataset,
  textObjects,
}: {
  inputDataset;
  ontologyDataset;
  textObjects: AsyncIterable<TextObject>;
}): AsyncIterable<DatasetCore> {
  const classOntologyDataset = getClassOntologyDataset(ontologyDataset);
  const propertyOntologyDataset = getPropertyOntologyDataset(ontologyDataset);

  yield classOntologyDataset;
  yield inputDataset;

  for await (const textObject of textObjects) {
    // Order of transformations is important
    let transformedTextObjectContentDataset = textObject.content.dataset;
    const textObjectIdentifierString = Identifier.toString(
      textObject.identifier,
    );

    logger.debug(
      `${textObjectIdentifierString}: normalizing schema.org namespaces`,
    );
    transformedTextObjectContentDataset = normalizeSdoNamespace(
      transformedTextObjectContentDataset,
    );

    logger.debug(
      `${textObjectIdentifierString}: replacing superseded predicates`,
    );
    transformedTextObjectContentDataset = replaceSupersededPredicates({
      instanceDataset: transformedTextObjectContentDataset,
      propertyOntologyDataset,
    });

    logger.debug(`${textObjectIdentifierString}: fixing literal datatypes`);
    transformedTextObjectContentDataset = fixLiteralDatatypes(
      transformedTextObjectContentDataset,
    );

    logger.debug(
      `${textObjectIdentifierString}: adding inverse property quads`,
    );
    transformedTextObjectContentDataset = addInversePropertyQuads({
      instanceDataset: transformedTextObjectContentDataset,
      propertyOntologyDataset: ontologyDataset,
    });

    logger.debug(`${textObjectIdentifierString}: propagating dates`);
    transformedTextObjectContentDataset = propagateDates({
      classOntologyDataset,
      instanceDataset: transformedTextObjectContentDataset,
    });

    logger.debug(`${textObjectIdentifierString}: skolemizing`);
    transformedTextObjectContentDataset = skolemize({
      classOntologyDataset,
      instanceDataset: transformedTextObjectContentDataset,
      uriSpace: textObject.uriSpace,
    });

    logger.debug(`${textObjectIdentifierString}: inferring TextObject quads`);
    transformedTextObjectContentDataset = inferTextObjectQuads({
      classOntologyDataset,
      instanceDataset: transformedTextObjectContentDataset,
      textObject,
    });

    logger.debug(`${textObjectIdentifierString}: done with transformation`);

    yield transformedTextObjectContentDataset;
  }
}
