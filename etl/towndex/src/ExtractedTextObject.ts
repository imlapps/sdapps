import { DatasetCore, NamedNode } from "@rdfjs/types";
import { TextObject } from "@sdapps/models";

export class ExtractedTextObject {
  readonly content: Blob;
  readonly dataset: DatasetCore;
  readonly identifier: TextObject["identifier"];
  readonly url: NamedNode;

  constructor({
    content,
    dataset,
    identifier,
    url,
  }: {
    content: Blob;
    dataset: DatasetCore;
    identifier: TextObject["identifier"];
    url: NamedNode;
  }) {
    this.content = content;
    this.dataset = dataset;
    this.identifier = identifier;
    this.url = url;
  }
}
