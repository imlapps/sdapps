import { NamedNode } from "@rdfjs/types";
import N3 from "n3";
import { Logger } from "pino";
import { Memoize } from "typescript-memoize";

export class WikidataEntity {
  private readonly cachesDirectoryPath: string;
  readonly id: string;
  private readonly logger?: Logger;

  constructor({
    cachesDirectoryPath,
    id,
    logger,
  }: { cachesDirectoryPath: string; id: string; logger?: Logger }) {
    this.cachesDirectoryPath = cachesDirectoryPath;
    this.id = id;
    this.logger = logger;
  }

  @Memoize()
  get iri(): NamedNode {
    return N3.DataFactory.namedNode(
      `http://www.wikidata.org/entity/${this.id}`,
    );
  }

  toString(): string {
    return this.id;
  }
}
