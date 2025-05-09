import { DatasetCore, NamedNode } from "@rdfjs/types";
import { TextObject } from "@sdapps/models";

export class ExtractedTextObject {
  readonly content: Blob;
  readonly contentUrl: NamedNode;
  readonly dataset: DatasetCore;
  readonly identifier: TextObject["identifier"];

  constructor({
    content,
    contentUrl: url,
    dataset,
    identifier,
  }: {
    content: Blob;
    contentUrl: NamedNode;
    dataset: DatasetCore;
    identifier: TextObject["identifier"];
  }) {
    this.content = content;
    this.dataset = dataset;
    this.identifier = identifier;
    this.contentUrl = url;
  }
}
