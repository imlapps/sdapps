import fs from "node:fs";
import { DatasetCore } from "@rdfjs/types";
import {
  TextObject as GeneratedTextObject,
  Identifier,
  RdfjsDatasetModelSet,
} from "@sdapps/models";
import * as N3 from "n3";
import { Either, Left, Maybe } from "purify-ts";
import { TextObject } from "./TextObject";

export async function* extract(): AsyncIterable<Either<Error, TextObject>> {
  const inputDatasetEither = extractInputDataset();
  if (inputDatasetEither.isLeft()) {
    yield inputDatasetEither;
    return;
  }
  const inputDataset = inputDatasetEither.unsafeCoerce();

  const modelSet = new RdfjsDatasetModelSet({ dataset: inputDataset });
  for (const model of modelSet.modelsSync("TextObject").unsafeCoerce()) {
    const textObject = model as GeneratedTextObject;

    yield (await extractTextObjectContent(textObject)).map(
      (content) =>
        new TextObject({
          content,
          dataset: inputDataset,
          identifier: textObject.identifier,
        }),
    );
  }
}

function extractInputDataset(): Either<Error, DatasetCore> {
  return Either.encase(() => {
    const inputString = fs.readFileSync(process.stdin.fd, "utf-8");
    const inputParser = new N3.Parser();
    const store = new N3.Store();
    store.addQuads(inputParser.parse(inputString));
    return store;
  });
}

async function extractTextObjectContent(
  textObject: GeneratedTextObject,
): Promise<Either<Error, TextObject.Content>> {
  const contentBlobEither = await extractTextObjectContentBlob(textObject);
  if (contentBlobEither.isLeft()) {
    return contentBlobEither;
  }
  const { blob: contentBlob, url: contentUrl } =
    contentBlobEither.unsafeCoerce();

  const contentDatasetEither =
    await extractTextObjectContentDataset(contentBlob);

  return Either.of({
    blob: contentBlob,
    dataset: contentDatasetEither.unsafeCoerce(),
    url: contentUrl,
  });
}

async function extractTextObjectContentBlob(
  textObject: GeneratedTextObject,
): Promise<Either<Error, Pick<TextObject.Content, "blob" | "url">>> {
  const contentUrl = textObject.url
    .altLazy(() =>
      textObject.identifier.termType === "NamedNode"
        ? Maybe.of(textObject.identifier)
        : Maybe.empty(),
    )
    .extractNullable();
  if (contentUrl === null || !contentUrl?.value.startsWith("http")) {
    return Left(
      new Error(
        `TextObject ${Identifier.toString(textObject.identifier)} has no resolvable content URL`,
      ),
    );
  }

  try {
    const response = await fetch(contentUrl.value);
    return Either.of({ blob: await response.blob(), url: contentUrl });
  } catch (e) {
    return Left(e as Error);
  }
}

async function extractTextObjectContentDataset(
  contentBlob: Blob,
): Promise<Either<Error, DatasetCore>> {
  return Left(new Error("not implemented"));
}
