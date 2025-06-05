import { NamedNode } from "@rdfjs/types";
import N3 from "n3";

const dataFactory = N3.DataFactory;

export namespace Iris {
  const nprComposerApiBaseUrl = "https://api.composer.nprstations.org/v1/";

  export function episode(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}episode/${id}`);
  }

  export function program(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}program/${id}`);
  }

  export function ucs(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}ucs/${id}`);
  }
}
