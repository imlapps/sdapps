import { DatasetCore } from "@rdfjs/types";
import { Identifier, RdfjsDatasetModelSet, TextObject } from "@sdapps/models";
import { Maybe } from "purify-ts";
import { logger } from "./logger";

export async function extractWebDocuments(
  inputDataset: DatasetCore,
): AsyncIterable<DatasetCore> {
  const modelSet = new RdfjsDatasetModelSet({ dataset: inputDataset });
  for (const model of modelSet.modelsSync("TextObject").unsafeCoerce()) {
    const textObject = model as TextObject;
    const textObjectUrl = textObject.url
      .altLazy(() =>
        textObject.identifier.termType === "NamedNode"
          ? Maybe.of(textObject.identifier)
          : Maybe.empty(),
      )
      .extractNullable()?.value;
    if (textObjectUrl === null || !textObjectUrl?.startsWith("http")) {
      logger.warn("TextObject", Identifier.toString(textObject.identifier), "has no resolvable URL");
      continue;
    }
  }
