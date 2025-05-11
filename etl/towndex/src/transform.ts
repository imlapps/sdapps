import { DatasetCore } from "@rdfjs/types";
import { TextObject } from "./TextObject";

export async function* transform(
  textObjects: AsyncIterable<TextObject>,
): AsyncIterable<DatasetCore> {
  for await (const textObject of textObjects) {
    yield textObject.content.dataset;
  }
}
