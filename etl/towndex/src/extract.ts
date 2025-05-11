import fs from "node:fs";
import path from "node:path";
import { DatasetCore } from "@rdfjs/types";
import { DocumentFactory, encodeFileName } from "@sdapps/etl";
import {
  TextObject as GeneratedTextObject,
  Identifier,
  RdfjsDatasetModelSet,
} from "@sdapps/models";
import { JsonLdParser } from "jsonld-streaming-parser";
import * as N3 from "n3";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { TextObject } from "./TextObject.js";
import { fetch } from "./fetch.js";
import { logger } from "./logger.js";
import { cachesDirectoryPath } from "./paths.js";

const documentFactory = new DocumentFactory({
  cachesDirectoryPath,
  logger,
});

export async function* extract(
  inputDataset: DatasetCore,
): AsyncIterable<TextObject> {
  const modelSet = new RdfjsDatasetModelSet({ dataset: inputDataset });
  for (const model of modelSet.modelsSync("TextObject").unsafeCoerce()) {
    const textObject = model as GeneratedTextObject;

    const textObjectEither = (await extractTextObjectContent(textObject)).map(
      (content) =>
        new TextObject({
          content,
          identifier: textObject.identifier,
        }),
    );
    if (textObjectEither.isLeft()) {
      logger.error(textObjectEither.extract() as Error);
      continue;
    }
    yield textObjectEither.unsafeCoerce();
  }
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
    const completionsCacheFilePath = path.join(
      completionsCacheDirectoryPath,
      `${encodeFileName(contentUrl.value)}.jsonld`,
    );

    try {
      const stat = await fs.promises.stat(completionsCacheFilePath);
      if (stat.isFile()) {
        return {
          dataset: await parseJsonLdString(
            (await fs.promises.readFile(completionsCacheFilePath)).toString(
              "utf-8",
            ),
          ),
          url: contentUrl,
        };
      }
    } catch (e) {}

    logger.debug(
      `fetching ${Identifier.toString(textObject.identifier)} content from ${contentUrl.value}`,
    );
    const contentResponse = await fetch(contentUrl.value);
    const contentBlob = await contentResponse.blob();
    logger.debug(
      `fetched ${contentBlob.size} bytes from ${contentUrl.value} (cache ${contentResponse.isCacheMiss ? "miss" : "hit"})`,
    );

    const contentHtml = (
      await (
        await documentFactory.createDocumentFromBlob({ blob: contentBlob })
      )
        .unsafeCoerce()
        .html()
    ).unsafeCoerce();

    throw new Error("not implemented");
  });
}

function parseJsonLdString(jsonLdString: string): Promise<DatasetCore> {
  return new Promise((resolve, reject) => {
    const store = new N3.Store();
    const parser = new JsonLdParser({ dataFactory: N3.DataFactory });
    parser.on("data", (quad) => {
      store.add(quad);
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
