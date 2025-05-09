import { DatasetCore } from "@rdfjs/types";
import { Identifier, RdfjsDatasetModelSet, TextObject } from "@sdapps/models";
import { Maybe } from "purify-ts";
import { ExtractedTextObject } from "./ExtractedTextObject";
import { logger } from "./logger";

export async function* resolveInputTextObjects(
  inputDataset: DatasetCore,
): AsyncIterable<ExtractedTextObject> {
  const modelSet = new RdfjsDatasetModelSet({ dataset: inputDataset });
  for (const model of modelSet.modelsSync("TextObject").unsafeCoerce()) {
    const textObject = model as TextObject;
    const textObjectUrl = textObject.url
      .altLazy(() =>
        textObject.identifier.termType === "NamedNode"
          ? Maybe.of(textObject.identifier)
          : Maybe.empty(),
      )
      .extractNullable();
    if (textObjectUrl === null || !textObjectUrl?.value.startsWith("http")) {
      logger.warn(
        "TextObject",
        Identifier.toString(textObject.identifier),
        "has no resolvable URL",
      );
      continue;
    }

    const response = await fetch(textObjectUrl.value);
    yield new ExtractedTextObject({
      content: await response.blob(),
      dataset: inputDataset,
      identifier: textObject.identifier,
      url: textObjectUrl,
    });
  }
}
