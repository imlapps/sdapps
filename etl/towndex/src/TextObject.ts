import { BlankNode, DatasetCore, NamedNode } from "@rdfjs/types";

export class TextObject {
  readonly content: TextObject.Content;
  readonly identifier: BlankNode | NamedNode;
  readonly uriSpace: string;

  constructor({
    content,
    identifier,
    uriSpace,
  }: {
    content: TextObject.Content;
    identifier: TextObject["identifier"];
    uriSpace: string;
  }) {
    this.content = content;
    this.identifier = identifier;
    this.uriSpace = uriSpace;
  }
}

export namespace TextObject {
  export interface Content {
    readonly dataset: DatasetCore;
    readonly url: NamedNode;
  }
}
