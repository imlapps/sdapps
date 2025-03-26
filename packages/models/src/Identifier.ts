import { BlankNode, NamedNode } from "@rdfjs/types";
import { DataFactory as dataFactory } from "n3";
import { Resource } from "rdfjs-resource";

export type Identifier = BlankNode | NamedNode;

export namespace Identifier {
  export function fromString(identifier: string) {
    return Resource.Identifier.fromString({ dataFactory, identifier });
  }

  // biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
  export function toString(identifier: Identifier) {
    return Resource.Identifier.toString(identifier);
  }
}
