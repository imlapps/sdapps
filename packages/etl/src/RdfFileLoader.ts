// tsco:ignore

import { DatasetCore, NamedNode } from "@rdfjs/types";
import {
  _void,
  owl,
  rdf,
  rdfs,
  schema,
  sh,
  xsd,
} from "@tpluscode/rdf-ns-builders";

import N3 from "n3";

export abstract class RdfFileLoader {
  protected readonly fd: any;
  protected readonly format: RdfFileLoader.Format;
  protected readonly prefixes?: N3.Prefixes<string | NamedNode>;

  constructor({
    fd,
    format,
    prefixes,
  }: {
    fd: any;
    format: RdfFileLoader.Format;
    prefixes?: N3.Prefixes<string | NamedNode>;
  }) {
    this.fd = fd;
    this.format = format;
    this.prefixes = prefixes ?? RdfFileLoader.PREFIXES_DEFAULT;
  }

  static create(parameters: ConstructorParameters<typeof RdfFileLoader>[0]) {
    switch (parameters.format) {
      case "application/n-quads":
      case "application/n-triples":
        return new StreamingRdfFileLoader(parameters);
      case "application/trig":
      case "text/turtle":
        return new BufferingRdfFileLoader(parameters);
    }
  }

  abstract load(datasets: AsyncIterable<DatasetCore>): Promise<void>;
}

export namespace RdfFileLoader {
  export type Format =
    | "application/n-quads"
    | "application/n-triples"
    | "application/trig"
    | "text/turtle";

  export const PREFIXES_DEFAULT = {
    owl: owl[""],
    rdf: rdf[""],
    rdfs: rdfs[""],
    schema: schema[""],
    sh: sh[""],
    xsd: xsd[""],
    void: _void[""],
  };
}

class BufferingRdfFileLoader extends RdfFileLoader {
  override async load(datasets: AsyncIterable<DatasetCore>): Promise<void> {
    const buffer = new N3.Store();
    for await (const dataset of datasets) {
      for (const quad of dataset) {
        buffer.add(quad);
      }
    }

    const writer = new N3.Writer(process.stdout, {
      format: this.format,
      end: false,
      prefixes: this.prefixes,
    });

    for (const quad of buffer) {
      writer.addQuad(quad);
    }

    writer.end();
  }
}

class StreamingRdfFileLoader extends RdfFileLoader {
  override async load(datasets: AsyncIterable<DatasetCore>): Promise<void> {
    const writer = new N3.Writer(process.stdout, {
      format: this.format,
      end: false,
      prefixes: this.prefixes,
    });

    for await (const dataset of datasets) {
      for (const quad of dataset) {
        writer.addQuad(quad);
      }
    }

    writer.end();
  }
}
