import { NamedNode } from "@rdfjs/types";
import { Maybe } from "purify-ts";
import { Thing } from "./index.js";

export function url(thing: Thing): Maybe<NamedNode> {
  return thing.url.altLazy(() => {
    switch (thing.$type) {
      case "TextObject": {
        return thing.$identifier.termType === "NamedNode" &&
          (thing.$identifier.value.startsWith("http://") ||
            thing.$identifier.value.startsWith("https://"))
          ? Maybe.of(thing.$identifier)
          : Maybe.empty();
      }
      default:
        return Maybe.empty();
    }
  });
}
