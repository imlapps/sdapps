import { BlankNode, DatasetCore, NamedNode } from "@rdfjs/types";

export class TextObject {
  readonly content: TextObject.Content;
  readonly identifier: BlankNode | NamedNode;

  constructor({
    content,
    identifier,
  }: {
    content: TextObject.Content;
    identifier: TextObject["identifier"];
  }) {
    this.content = content;
    this.identifier = identifier;
  }
}

export namespace TextObject {
  export interface Content {
    readonly dataset: DatasetCore;
    readonly url: NamedNode;
  }
}
