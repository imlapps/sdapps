import { NamedNode } from "@rdfjs/types";

export class WikidataEntity {
  private readonly cachesDirectoryPath: string;
  readonly iri: NamedNode;

  constructor({
    cachesDirectoryPath,
    iri,
  }: { cachesDirectoryPath: string; iri: NamedNode }) {
    this.cachesDirectoryPath = cachesDirectoryPath;
    this.iri = iri;
  }
}
