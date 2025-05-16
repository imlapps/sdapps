import TermMap from "@rdfjs/term-map";
import type {
  BlankNode,
  DatasetCore,
  Literal,
  NamedNode,
  Quad_Graph,
  Quad_Object,
  Quad_Subject,
  Term,
} from "@rdfjs/types";
import { Identifier } from "@sdapps/models";
import { rdf, rdfs, schema, xsd } from "@tpluscode/rdf-ns-builders";
import { kebabCase } from "change-case";
import * as N3 from "n3";
import { Either, Left, Maybe } from "purify-ts";
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

  for (const rootResource of rootResources(mergedDatasetResourceSet)) {
    // (textObject, schema:about, rootResource)
    resultDataset.add(
      N3.DataFactory.quad(
        textObject.identifier,
        schema.about,
        rootResource.identifier,
        textObject.identifier,
      ),
    );
    // (rootResource, schema:subjectOf, textObject)
    resultDataset.add(
      N3.DataFactory.quad(
        rootResource.identifier,
        schema.subjectOf,
        textObject.identifier,
        textObject.identifier,
      ),
    );
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
    if (
      literal.datatype.equals(schema.Date) ||
      literal.datatype.equals(schema.DateTime)
    ) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(literal.value)) {
        // The JSON-LD -> RDF conversion with the schema.org context has a lot of Date | DateTime unions
        // Test whether it's only a date or also has a time.
        return N3.DataFactory.literal(literal.value, xsd.date);
      }
      const parsedDateNumber = Date.parse(literal.value);
      if (Number.isNaN(parsedDateNumber)) {
        logger.warn(`invalid date/date-time literal: ${literal.value}`);
        return N3.DataFactory.literal(literal.value, xsd.dateTime);
      }
      const parsedDate = new Date(parsedDateNumber);
      if (
        parsedDate.getUTCHours() === 0 &&
        parsedDate.getUTCMinutes() === 0 &&
        parsedDate.getUTCSeconds() === 0 &&
        parsedDate.getUTCMilliseconds() === 0
      ) {
        // Treat a date-time at UTC midnight as a date, which is probably the intention coming out of the LLM.
        return N3.DataFactory.literal(iso8601DateString(parsedDate), xsd.date);
      }
      // Some of the date-time literals from the LLM don't have seconds, which are required by ISO 8601
      // rdf-literal correctly refuses to validate those.
      // JavaScript's Date is more lenient. Use it to write a correct ISO 8601 date-time.
      return N3.DataFactory.literal(parsedDate.toISOString(), xsd.dateTime);
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

function iso8601DateString(date: Date): string {
  return `${date.getFullYear().toString()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
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

function resourceGraph(resource: Resource): Quad_Graph {
  const rdfTypeQuads = [
    ...resource.dataset.match(resource.identifier, rdf.type, null),
  ];
  invariant(rdfTypeQuads.length > 0);
  return rdfTypeQuads[0].graph;
}

function resourceLabel(resource: Resource): Maybe<string> {
  const label: string[] = [];

  if (resource.isInstanceOf(schema.Person)) {
    label.push(
      ...resource
        .value(schema.jobTitle)
        .chain((value) => value.toString())
        .toMaybe()
        .toList(),
    );
  }

  resource
    .value(schema.name)
    .chain((value) => value.toString())
    .ifRight((schemaName) => {
      label.push(schemaName);
    });

  if (label.length === 0) {
    if (resource.isInstanceOf(schema.MonetaryAmount)) {
      label.push(
        ...resource
          .value(schema.value)
          .chain((value) => value.toNumber())
          .map((value) => value.toString())
          .toMaybe()
          .toList(),
        ...resource
          .value(schema.currency)
          .chain((value) => value.toString())
          .toMaybe()
          .toList(),
      );
    } else if (resource.isInstanceOf(schema.QuantitativeValue)) {
      label.push(
        ...resource
          .value(schema.value)
          .chain((value) => value.toNumber())
          .map((value) => value.toString())
          .toMaybe()
          .toList(),
        ...resource
          .value(schema.unitText)
          .chain((value) => value.toString())
          .toMaybe()
          .toList(),
      );
    }

    if (label.length === 0) {
      return Maybe.empty();
    }
  }

  invariant(label.length > 0);
  return Maybe.of(label.join(" "));
}

function resourceType(resource: Resource): NamedNode {
  return resource
    .value(rdf.type)
    .chain((value) => value.toIri())
    .chain((value) =>
      value.value.startsWith(schema[""].value)
        ? Either.of(value)
        : Left(new Error(`non-schema.org rdf:type: ${value.value}`)),
    )
    .unsafeCoerce();
}

function* rootResources(resourceSet: ResourceSet): Iterable<Resource> {
  for (const eventResource of resourceSet.instancesOf(schema.Event)) {
    if (eventResource.value(schema.superEvent).isLeft()) {
      yield eventResource;
    }
  }
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
  const mergedResourceSet = new ResourceSet({
    dataset: mergeDatasets(classOntologyDataset, instanceDataset),
  });

  const blankNodeToNamedNodeMap = new TermMap<BlankNode, NamedNode>();

  // Organizations, people, et al. have "global" / context-independent identifiers across documents
  const contextIndependentClasses = [
    schema.Organization,
    schema.Person,
    schema.Place,
  ];

  const skolemizeContextIndependentResource = (resource: Resource): void => {
    if (resource.identifier.termType !== "BlankNode") {
      return;
    }

    resourceLabel(resource)
      .ifJust((resourceLabel) => {
        blankNodeToNamedNodeMap.set(
          resource.identifier as BlankNode,
          N3.DataFactory.namedNode(
            `${uriSpace}${kebabCase(resourceType(resource).value.substring(schema[""].value.length))}/${kebabCase(resourceLabel)}`,
          ),
        );
      })
      .ifNothing(() => {
        logger.warn(
          `unable to skolemize blank node with rdf:type ${resourceType(resource)}`,
        );
      });
  };

  for (const contextIndependentResourceClass of contextIndependentClasses) {
    for (const contextIndependentResource of mergedResourceSet.instancesOf(
      contextIndependentResourceClass,
    )) {
      skolemizeContextIndependentResource(contextIndependentResource);
    }
  }

  // Events, actions, et al. and similar resources are dependent on context -- the time of an event or its parent event, for example.
  const skolemizeContextDependentResource = (
    contextIdentifiers: readonly string[],
    contextDependentResource: Resource,
  ): void => {
    if (contextDependentResource.identifier.termType !== "BlankNode") {
      return;
    }

    if (
      contextIndependentClasses.some((contextIndependentClass) =>
        contextDependentResource.isInstanceOf(contextIndependentClass),
      )
    ) {
      return;
    }

    if (blankNodeToNamedNodeMap.has(contextDependentResource.identifier)) {
      logger.warn(
        `resource ${Identifier.toString(contextDependentResource.identifier)} has already been skolemized as ${blankNodeToNamedNodeMap.get(contextDependentResource.identifier)}`,
      );
      return;
    }

    const contextDependentResourceType = resourceType(contextDependentResource);
    invariant(contextDependentResourceType.value.startsWith(schema[""].value));

    const newContextIdentifiers = contextIdentifiers.concat();
    newContextIdentifiers.push(
      kebabCase(
        contextDependentResourceType.value.substring(schema[""].value.length),
      ),
    );
    if (contextDependentResource.isInstanceOf(schema.Event)) {
      contextDependentResource
        .value(schema.startDate)
        .chain((value) => value.toDate())
        .ifRight((startDate) => {
          newContextIdentifiers.push(
            ...iso8601DateString(startDate).split("-"),
          );
        });
      newContextIdentifiers.push(
        ...resourceLabel(contextDependentResource).map(kebabCase).toList(),
      );

      for (const subEventResource of contextDependentResource
        .values(schema.subEvent)
        .flatMap((value) => value.toResource().toMaybe().toList())) {
        skolemizeContextDependentResource(
          newContextIdentifiers,
          subEventResource,
        );
      }
    } else {
      logger.warn(
        `unrecognized context-dependent resource rdf:type: ${resourceType(contextDependentResource).value}`,
      );
      return;
    }

    if (newContextIdentifiers.length <= contextIdentifiers.length) {
      logger.warn(
        `unable to infer context identifiers for resource with rdf:type: ${resourceType(contextDependentResource).value}`,
      );
      return;
    }

    const newContextDependentResourceIdentifier = N3.DataFactory.namedNode(
      `${uriSpace}${newContextIdentifiers.join("/")})}`,
    );
    logger.debug(
      `skolemizing ${Identifier.toString(contextDependentResource.identifier)} with rdf:type ${resourceType(contextDependentResource).value} as ${Identifier.toString(newContextDependentResourceIdentifier)}`,
    );
    blankNodeToNamedNodeMap.set(
      contextDependentResource.identifier,
      newContextDependentResourceIdentifier,
    );
  };

  for (const rootResource of rootResources(mergedResourceSet)) {
    skolemizeContextDependentResource([], rootResource);
  }

  // for (const rdfTypeQuad of mergedDataset.match(null, rdf.type, null, null)) {
  //   if (rdfTypeQuad.subject.termType !== "BlankNode") {
  //     continue;
  //   }
  //   const rdfType = rdfTypeQuad.object;
  //   if (rdfType.termType !== "NamedNode") {
  //     continue;
  //   }
  //   if (!rdfType.value.startsWith(schema[""].value)) {
  //     logger.warn(
  //       `blank node has non-schema.org rdf:type: $rdfTypeQuad.object.value`,
  //     );
  //     continue;
  //   }

  //   const resource = mergedResourceSet.resource(rdfTypeQuad.subject);

  //   const iriPath: string[] = [
  //     kebabCase(rdfType.value.substring(schema[""].value.length)),
  //   ];

  //   // Everything "below" an Event should be appended to that's IRI
  //   // Event about Action
  //   // Event about Report about QuantitativeValue etc.

  //   let datePredicate: NamedNode | null;
  //   if (resource.isInstanceOf(schema.Action)) {
  //     datePredicate = schema.startTime;
  //   } else if (resource.isInstanceOf(schema.CreativeWork)) {
  //     datePredicate = schema.datePublished;
  //   } else if (resource.isInstanceOf(schema.Event)) {
  //     datePredicate = schema.startDate;
  //   } else if (resource.isInstanceOf(schema.Invoice)) {
  //     datePredicate = schema.paymentDueDate;
  //   } else if (resource.isInstanceOf(schema.Order)) {
  //     datePredicate = schema.orderDate;
  //   } else if (
  //   ) {
  //     datePredicate = null;
  //   } else {
  //     logger.debug(
  //       `resource with rdf:type ${rdfType.value} has no date predicate`,
  //     );
  //     datePredicate = null;
  //   }
  //   if (datePredicate) {
  //     resource
  //       .value(datePredicate)
  //       .ifLeft(() => {
  //         logger.debug(
  //           `resource $Identifier.toString(resource.identifier)with rdf:type ${rdfType.value} does not have a value for ${datePredicate.value}`,
  //         );
  //       })
  //       .chain((value) => value.toDate())
  //       .ifLeft((error) => {
  //         logger.debug(
  //           `resource $Identifier.toString(resource.identifier)with rdf:type ${rdfType.value} does not have a valid value for ${datePredicate.value}: $error.message`,
  //         );
  //       })
  //       .ifRight((value) =>
  //         iriPath.push(
  //           value.getFullYear().toString(),
  //           (value.getMonth() + 1).toString().padStart(2, "0"),
  //           value.getDate().toString().padStart(2, "0"),
  //         ),
  //       );
  //   }

  //   const name: string[] = [];

  //   if (resource.isInstanceOf(schema.Person)) {
  //     name.push(
  //       ...resource
  //         .value(schema.jobTitle)
  //         .chain((value) => value.toString())
  //         .toMaybe()
  //         .toList(),
  //     );
  //   }

  //   resource
  //     .value(schema.name)
  //     .chain((value) => value.toString())
  //     .ifRight((schemaName) => {
  //       name.push(schemaName);
  //     })
  //     .ifLeft(() => {
  //       }
  //     });

  //   if (name.length === 0) {
  //     logger.warn(
  //       `could not reconstruct name for blank node with rdf:type ${rdfType.value}`,
  //     );
  //     continue;
  //   }

  //   blankNodeToNamedNodeMap.set(
  //     rdfTypeQuad.subject,
  //     N3.DataFactory.namedNode(
  //       `$uriSpace$iriPath.join("/")/${kebabCase(name.join(" "))}`,
  //     ),
  //   );
  // }

  const skolemizedInstanceDataset = new N3.Store();

  const mapBlankNodeToNamedNode = <NodeT extends Quad_Object | Quad_Subject>(
    node: NodeT,
  ): NodeT => {
    if (node.termType === "BlankNode") {
      const namedNode = blankNodeToNamedNodeMap.get(node);
      if (namedNode) {
        return namedNode as NodeT;
      }
      // logger.warn(
      //   `no skolemization for resource with rdf:type ${resourceType(mergedResourceSet.resource(node)).value}`,
      // );
    }
    return node;
  };

  for (const quad of instanceDataset) {
    skolemizedInstanceDataset.add(
      N3.DataFactory.quad(
        mapBlankNodeToNamedNode(quad.subject),
        quad.predicate,
        mapBlankNodeToNamedNode(quad.object),
        quad.graph,
      ),
    );
  }
  return skolemizedInstanceDataset;
}

function propagateNames({
  classOntologyDataset,
  instanceDataset,
}: {
  classOntologyDataset: DatasetCore;
  instanceDataset: DatasetCore;
}): DatasetCore {
  const resultDataset = copyDataset(instanceDataset);

  for (const orderResource of new ResourceSet({
    dataset: mergeDatasets(classOntologyDataset, resultDataset),
  }).instancesOf(schema.Order)) {
    orderResource
      .value(schema.name)
      .chain((value) => value.toString())
      .ifRight((orderName) => {
        orderResource
          .value(schema.partOfInvoice)
          .chain((value) => value.toResource())
          .ifRight((invoiceResource) => {
            invoiceResource.value(schema.name).ifLeft(() => {
              resultDataset.add(
                N3.DataFactory.quad(
                  invoiceResource.identifier,
                  schema.name,
                  N3.DataFactory.literal(`${orderName} Invoice`),
                  resourceGraph(invoiceResource),
                ),
              );
            });
          });
      });
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

    logger.debug(`${textObjectIdentifierString}: propagating names`);
    transformedTextObjectContentDataset = propagateNames({
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
