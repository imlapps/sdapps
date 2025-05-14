import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openai } from "@ai-sdk/openai";
import { DatasetCore, DefaultGraph, NamedNode } from "@rdfjs/types";
import { DocumentFactory, fileNameCodec } from "@sdapps/etl";
import {
  TextObject as GeneratedTextObject,
  Identifier,
  RdfjsDatasetModelSet,
} from "@sdapps/models";
import { _void, rdf, rdfs, schema } from "@tpluscode/rdf-ns-builders";
import { CoreMessage, generateText } from "ai";
import { FetchDocumentLoader } from "jsonld-context-parser";
import { JsonLdParser } from "jsonld-streaming-parser";
import { jsonrepair } from "jsonrepair";
import * as N3 from "n3";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { invariant } from "ts-invariant";
import { TextObject } from "./TextObject.js";
import { fetch } from "./fetch.js";
import { logger } from "./logger.js";
import { cachesDirectoryPath } from "./paths.js";

function cleanCompletionText(text: string) {
  // Strip characters before the first { and after the last }
  let strippedText = text;
  const openCurlyBraceIndex = strippedText.indexOf("{");
  if (openCurlyBraceIndex > 0) {
    const closeCurlyBraceIndex = strippedText.lastIndexOf("}");
    if (closeCurlyBraceIndex > 0) {
      strippedText = strippedText.slice(
        openCurlyBraceIndex,
        closeCurlyBraceIndex,
      );
    }
  }

  const repairedText = jsonrepair(strippedText);

  return JSON.stringify(JSON.parse(repairedText), undefined, 2); // May throw a SyntaxError
}

const documentFactory = new DocumentFactory({
  cachesDirectoryPath,
  logger,
});

export async function extract(): Promise<{
  inputDataset: DatasetCore;
  ontologyDataset: DatasetCore;
  textObjects: AsyncIterable<TextObject>;
}> {
  const inputDataset = extractInputDataset();
  return {
    inputDataset,
    ontologyDataset: await extractOntologyDataset(),
    textObjects: extractTextObjects(inputDataset),
  };
}

function extractInputDataset(): DatasetCore {
  const inputDataset = new N3.Store();
  logger.debug("extracting input dataset from stdin");
  inputDataset.addQuads(
    new N3.Parser().parse(fs.readFileSync(process.stdin.fd, "utf-8")),
  );
  logger.debug(`extracted ${inputDataset.size} quads from stdin`);
  return inputDataset;
}

async function extractOntologyDataset(): Promise<DatasetCore> {
  const ontologyDataset: DatasetCore = new N3.Store();
  for (const quad of new N3.Parser().parse(
    (
      await fs.promises.readFile(
        path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          "schemaorg-current-http.ttl",
        ),
      )
    ).toString("utf-8"),
  )) {
    ontologyDataset.add(quad);
  }

  const filteredOntologyDataset = new N3.Store();
  // Add (s, rdfs:subClassOf, o) triples
  for (const quad of ontologyDataset.match(null, rdfs.subClassOf, null)) {
    invariant(quad.graph.termType === "DefaultGraph");
    filteredOntologyDataset.add(quad);
  }
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
      filteredOntologyDataset.add(propertyRdfTypeQuad);
      filteredOntologyDataset.add(propertyInverseOfQuad);
    }
    for (const propertySupersededByQuad of ontologyDataset.match(
      propertyRdfTypeQuad.subject,
      schema.supersededBy,
      null,
    )) {
      filteredOntologyDataset.add(propertyRdfTypeQuad);
      filteredOntologyDataset.add(propertySupersededByQuad);
    }
  }

  return filteredOntologyDataset;
}

async function extractTextObjectContent(
  textObject: GeneratedTextObject,
): Promise<Either<Error, TextObject.Content>> {
  return EitherAsync(async () => {
    logger.debug(
      `extracting content dataset for ${Identifier.toString(textObject.identifier)}`,
    );

    const contentUrl = textObject.url
      .altLazy(() =>
        textObject.identifier.termType === "NamedNode"
          ? Maybe.of(textObject.identifier)
          : Maybe.empty(),
      )
      .filter((contentUrl) => contentUrl.value.startsWith("http"))
      .extractNullable();
    if (contentUrl === null) {
      throw new Error(
        `TextObject ${Identifier.toString(textObject.identifier)} doesn't have a resolvable content URL`,
      );
    }

    const completionsCacheDirectoryPath = path.join(
      cachesDirectoryPath,
      "completions",
    );
    const completionCacheFilePath = path.join(
      completionsCacheDirectoryPath,
      `${fileNameCodec.encode(Buffer.from(contentUrl.value, "utf-8"))}.jsonld`,
    );

    try {
      const stat = await fs.promises.stat(completionCacheFilePath);
      if (stat.isFile()) {
        logger.debug(
          `found cached completion for ${Identifier.toString(textObject.identifier)} at ${completionCacheFilePath}`,
        );
        return {
          dataset: await parseJsonLdString(
            (await fs.promises.readFile(completionCacheFilePath)).toString(
              "utf-8",
            ),
          ),
          url: contentUrl,
        };
      }
    } catch (e) {}
    logger.debug(
      `no cached completion for ${Identifier.toString(textObject.identifier)}`,
    );

    logger.debug(
      `fetching ${Identifier.toString(textObject.identifier)} content from ${contentUrl.value}`,
    );
    const contentResponse = await fetch(contentUrl.value);
    const contentBlob = await contentResponse.blob();
    logger.debug(
      `fetched ${contentBlob.size} bytes from ${contentUrl.value} (cache ${contentResponse.isCacheMiss ? "miss" : "hit"})`,
    );

    logger.debug(`getting HTML for ${contentUrl.value}`);
    const contentHtml = (
      await (
        await documentFactory.createDocumentFromBlob({ blob: contentBlob })
      )
        .unsafeCoerce()
        .html()
    ).unsafeCoerce();
    logger.debug(
      `got HTML (${contentHtml.length} characters) for ${contentUrl.value}`,
    );

    const messages: CoreMessage[] = [
      {
        role: "system",
        content: promptSystemMessage,
      },
      {
        role: "user",
        content: `\
Here is the document:
${contentHtml}
`,
      },
    ];

    const { text: completionText } = await generateText({
      messages,
      model: openai("gpt-4o"),
    });
    const cleanedCompletionText = cleanCompletionText(completionText);

    logger.debug(
      `caching completion for ${Identifier.toString(textObject.identifier)}`,
    );
    await fs.promises.mkdir(completionsCacheDirectoryPath, { recursive: true });
    await fs.promises.writeFile(completionCacheFilePath, cleanedCompletionText);
    logger.debug(
      `cached completion for ${Identifier.toString(textObject.identifier)} at ${completionCacheFilePath}`,
    );

    logger.debug("parsing completion JSON-LD");
    const dataset = await parseJsonLdString(
      textObject.identifier.termType === "NamedNode"
        ? textObject.identifier
        : N3.DataFactory.defaultGraph(),
      cleanedCompletionText,
    );
    logger.debug(`parsed ${dataset.size} quads from completion JSON-LD`);

    return {
      dataset,
      url: contentUrl,
    };
  });
}

async function* extractTextObjects(
  inputDataset: DatasetCore,
): AsyncIterable<TextObject> {
  const modelSet = new RdfjsDatasetModelSet({ dataset: inputDataset });
  for (const model of modelSet.modelsSync("TextObject").unsafeCoerce()) {
    const textObject = model as GeneratedTextObject;

    const uriSpace = modelSet.resourceSet
      .resource(textObject.identifier)
      .value(_void.uriSpace)
      .chain((value) => value.toString());
    if (uriSpace.isLeft()) {
      logger.error(
        `TextObject ${Identifier.toString(textObject.identifier)} has no void:uriSpace`,
      );
      continue;
    }

    const textObjectEither = (await extractTextObjectContent(textObject)).map(
      (content) =>
        new TextObject({
          content,
          identifier: textObject.identifier,
          uriSpace: uriSpace.unsafeCoerce(),
        }),
    );
    if (textObjectEither.isLeft()) {
      logger.error(textObjectEither.extract() as Error);
      continue;
    }
    yield textObjectEither.unsafeCoerce();
  }
}

function parseJsonLdString(
  defaultGraph: DefaultGraph | NamedNode,
  jsonLdString: string,
): Promise<DatasetCore> {
  return new Promise((resolve, reject) => {
    const store = new N3.Store();
    const parser = new JsonLdParser({
      dataFactory: N3.DataFactory,
      documentLoader: new FetchDocumentLoader(fetch as any),
    });
    parser.on("context", (context) => {
      logger.debug(`JSON-LD context: ${context}`);
    });
    parser.on("data", (quad) => {
      if (
        quad.graph.termType === "DefaultGraph" &&
        defaultGraph.termType !== "DefaultGraph"
      ) {
        store.add(
          N3.DataFactory.quad(
            quad.subject,
            quad.predicate,
            quad.object,
            defaultGraph,
          ),
        );
      } else {
        store.add(quad);
      }
    });
    parser.on("error", reject);
    parser.on("end", () => {
      resolve(store);
    });
    parser.on("error", reject);
    parser.write(jsonLdString);
    parser.end();
  });
}

const promptSystemMessage = `\
A town board's meeting minutes has been attached.

Please identify and extract all entities and relationships from the document and return valid Schema.org JSON-LD.

Below are some constraints for how you should create the graph.

Preserve the following structure. An "Event" is the root of the graph, and all subsections are "Event" types that are the main Event's "subevent".

Subsections include but are not limited to: BUSINESS MEETING, MINUTES OF THE PREVIOUS MEETING, REPORTS, RESOLUTIONS, CORRESPONDENCE, OLD BUSINESS, NEW BUSINESS, WARRANTS, VISITORS WHO WISH TO SPEAK, ADJOURNMENT.

Extract all information under all the subsections.

Use "MonetaryAmount" instead of a "FinancialProduct" type.

This is a town board meeting, so the town supervisor and councilmembers must be involved in all VoteActions. List them under the "participant" property.

Information under the "Reports" section must be classified under the "Report" type.

Each "Report" must have a corresponding "VoteAction".

Information under the "Resolutions" subsection must be classified under the "VoteAction" type.

Information under the "Warrants" section must have a "VoteAction" type.

If there is any financial information under warrants, create an "Invoice" type and add individual fund expenses to the "referencesOrder" property.

Below are constraints for how to use some Schema.org types and properties.

For all types, the properties "description" and "name" are required.

For type "Event", the property "about" is required.

For type "Message", the property "sender" is required.

For type "MonetaryAmount", the property "value" is required.

For type "QuantitativeValue", the properties "unitText" and "value" are required.

For type "VoteAction", the property "agent" is required.

Please do not invent any types of properties.

Below are examples that can help you construct Schema.org graphs:

- Example of "Adjournment" subevent:

  {
    "@type": "Event",
    "name": "Adjournment of Meeting",
    "location": {
      "@type": "Place",
      "name": "Town of Brunswick Town Hall"
    },
    "description": "The meeting was adjourned in honor of Jennifer Mann, a resident deeply committed to the community.",
    "organizer": {
      "@type": "GovernmentOrganization",
      "name": "Town of Brunswick"
    },
    "performers": [
      {
        "@type": "Person",
        "name": "Balistreri"
      },
      {
        "@type": "Person",
        "name": "Herrington"
      }
    ],
    "about": {
      "@type": "Person",
      "name": "Jennifer Mann",
      "description": "A town resident who was deeply committed to the community."
    }
  }

- Example of "Reports" subevent:
  {
    "@type": "Event",
    "name": "Reporting",
    "location": {
      "@type": "Place",
      "name": "Town of Brunswick Town Hall"
    },
    "description": "Reporting session from members of the Town Board.",
    "about": [
      {
        "@type": "Report",
        "name": "Code Enforcement Report",
        "author": {
          "@type": "Person",
          "name": "Kevin Mainello"
        },
        "description": "Report on building code enforcement activities and fee collection.",
        "about": [
          {
            "@type": "QuantitativeValue",
            "name": "Number of FOIL requests received",
            "value": 6,
            "unitText": "requests"
          },
          {
            "@type": "QuantitativeValue",
            "name": "Number of zoning inquiries received",
            "value": 6,
            "unitText": "inquiries"
          }
        ]
      }
    ],
    "performers": [
      {
        "@type": "Person",
        "name": "Kevin Mainello"
      }
    ]
  }

- Example of "Resolutions" subevent:
  {
    "@type": "Event",
    "name": "Resolutions",
    "location": {
      "@type": "Place",
      "name": "Town of Brunswick Town Hall"
    },
    "description": "A set of vote actions made by the town board.",
    "organizer": {
      "@type": "GovernmentOrganization",
      "name": "Town of Brunswick"
    },
    "performers": [
      {
        "@type": "Person",
        "name": "Balistreri",
        "jobTitle": "Councilman"
      },
      {
        "@type": "Person",
        "name": "Christian",
        "jobTitle": "Councilman"
      },
      {
        "@type": "Person",
        "name": "Herrington",
        "jobTitle": "Supervisor"
      },
      {
        "@type": "Person",
        "name": "Sullivan",
        "jobTitle": "Councilman"
      }
    ],
    "about": [
    {
      "@type": "VoteAction",
      "name": "Resolution No. 25 of 2025",
      "description": "RESOLUTION OF THE TOWN OF BRUNSWICK DECLARING NEED AND AUTHORIZING THE APPLICATION",
      "agent": {
        "@type": "Person",
        "name": "Balistreri"
      },
      "participant": [
        {
          "@type": "Person",
          "name": "Balistreri",
          "jobTitle": "Councilman"
        },
        {
          "@type": "Person",
          "name": "Christian",
          "jobTitle": "Councilman"
        },
        {
          "@type": "Person",
          "name": "Herrington",
          "jobTitle": "Supervisor"
        },
        {
          "@type": "Person",
          "name": "Sullivan",
          "jobTitle": "Councilman"
        }
      ],
      "actionStatus": "CompletedActionStatus"
    }
    ]
}

- Example of a "Warrants" subevent:
{
  "@type": "Event",
  "name": "Warrants Discussion",
  "location": {
    "@type": "Place",
    "name": "Town of Brunswick Town Hall"
  },
  "description": "Discussion about current town warrants.",
  "organizer": {
    "@type": "GovernmentOrganization",
    "name": "Town Board"
  },
  "performers": [
    {
      "@type": "Person",
      "name": "Balistreri",
      "jobTitle": "Councilman"
    },
    {
      "@type": "Person",
      "name": "Christian",
      "jobTitle": "Councilman"
    },
    {
      "@type": "Person",
      "name": "Herrington",
      "jobTitle": "Supervisor"
    },
    {
      "@type": "Person",
      "name": "Sullivan",
      "jobTitle": "Councilman"
    }
  ],
  "about": [
    {
      "@type": "Invoice",
      "name": "Approval of Warrants",
      "provider": {
        "@type": "GovernmentOrganization",
        "name": "Town of Brunswick"
      },
      "totalPaymentDue": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": 356520.92
      },
      "description": "Approval of warrants for various funds.",
      "category": "Government Expenses",
      "referencesOrder": [
        {
          "@type": "Order",
          "name": "General Fund",
          "partOfInvoice": {
            "@type": "Invoice",
            "totalPaymentDue": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": 252274.75
            }
          }
        },
        {
          "@type": "Order",
          "name": "Highway Fund",
          "partOfInvoice": {
            "@type": "Invoice",
            "totalPaymentDue": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": 74402.62
            }
          }
        }
      ]
    }
  ]
}`;
