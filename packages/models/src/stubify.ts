import { ImageObject, ImageObjectStub } from "./index.js";

/**
 * Convert a model to its stub equivalent e.g., Thing to ThingStub.
 */
export function stubify(model: ImageObject): ImageObjectStub {
  switch (model.type) {
    case "ImageObject":
      return new ImageObjectStub({
        identifier: model.identifier,
      });
  }
}
