import { BlankNode, DatasetCore, NamedNode } from "@rdfjs/types";

export class TextObject {
  readonly content: TextObject.Content;
  readonly dataset: DatasetCore;
  readonly identifier: BlankNode | NamedNode;

  constructor({
    content,
    dataset,
    identifier,
  }: {
    content: TextObject.Content;
    dataset: DatasetCore;
    identifier: TextObject["identifier"];
  }) {
    this.content = content;
    this.dataset = dataset;
    this.identifier = identifier;
  }
}

export namespace TextObject {
  export interface Content {
    readonly blob: Blob;
    readonly dataset: DatasetCore;
    readonly url: NamedNode;
  }
}
