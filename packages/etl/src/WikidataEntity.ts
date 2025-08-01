import path from "node:path";
import { DatasetCore, NamedNode } from "@rdfjs/types";
import { owl, rdf, rdfs, schema, skos } from "@tpluscode/rdf-ns-builders";
import N3 from "n3";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { TextFileCache } from "./TextFileCache.js";

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

  async dataset(): Promise<Either<Error, DatasetCore>> {
    return EitherAsync(async ({ liftEither }) => {
      const cache = new TextFileCache({
        directoryPath: path.join(
          this.cachesDirectoryPath,
          "wikidata",
          "rdf",
          "raw",
        ),
        fileExtension: ".ttl",
        logger: this.logger,
      });

      const dataset = new N3.Store();
      const parser = new N3.Parser();

      const cachedTtl = await liftEither(await cache.get(this.id));
      if (cachedTtl.isJust()) {
        for (const quad of parser.parse(cachedTtl.unsafeCoerce())) {
          dataset.add(quad);
        }
        return dataset;
      }

      this.logger?.trace(`fetching ${this.iri.value} Turtle`);
      const response = await fetch(`${this.iri.value}.ttl`);
      const responseText = await response.text();
      this.logger?.trace(`fetched ${this.iri.value} Turtle`);
      for (const quad of parser.parse(responseText)) {
        dataset.add(quad);
      }
      await cache.set(this.id, responseText);
      return dataset;
    });
  }

  async filteredDataset(): Promise<Either<Error, DatasetCore>> {
    return EitherAsync(async ({ liftEither }) => {
      const cache = new TextFileCache({
        directoryPath: path.join(
          this.cachesDirectoryPath,
          "wikidata",
          "rdf",
          "filtered",
        ),
        fileExtension: ".nt",
        logger: this.logger,
      });

      const cachedNt = await liftEither(await cache.get(this.id));
      if (cachedNt.isJust()) {
        const filteredDataset = new N3.Store();
        const parser = new N3.Parser({ format: "nt" });
        for (const quad of parser.parse(cachedNt.unsafeCoerce())) {
          filteredDataset.add(quad);
        }
        return filteredDataset;
      }

      const dataset = await liftEither(await this.dataset());

      const filteredDataset: DatasetCore = new N3.Store();
      for (const quad of dataset) {
        if (
          quad.object.termType === "BlankNode" ||
          quad.subject.termType === "BlankNode"
        ) {
          continue;
        }

        if (
          quad.object.termType === "NamedNode" &&
          (quad.object.value.startsWith(owl[""].value) ||
            quad.object.value.startsWith(
              "http://www.wikidata.org/entity/statement/",
            ))
        ) {
          continue;
        }

        filteredDataset.add(quad);
      }

      for (const redundantPredicate of [
        N3.DataFactory.namedNode("http://wikiba.se/ontology#wikiGroup"),
        rdfs.label, // Duplicates schema:name
        skos.prefLabel, // Duplicates schema:name
        skos.altLabel, // Generally duplicates the skos:prefLabel in other languages
        // Keep schema:name and schema:description
      ]) {
        for (const deleteQuad of filteredDataset.match(
          null,
          redundantPredicate,
          null,
        )) {
          filteredDataset.delete(deleteQuad);
        }
      }

      for (const rdfType of [
        // Delete all property definitions
        N3.DataFactory.namedNode("http://wikiba.se/ontology#Property"),
        // Delete all references
        N3.DataFactory.namedNode("http://wikiba.se/ontology#Reference"),
        // Delete all full statements
        N3.DataFactory.namedNode("http://wikiba.se/ontology#Statement"),
        // Delete all schema:Article's
        schema.Article,
        // Delete the schema:Dataset
        schema.Dataset,
      ]) {
        for (const rdfTypeQuad of filteredDataset.match(
          null,
          rdf.type,
          rdfType,
        )) {
          for (const deleteQuad of filteredDataset.match(
            rdfTypeQuad.subject,
            null,
            null,
          )) {
            filteredDataset.delete(deleteQuad);
          }
        }
      }

      await cache.set(
        this.id,
        new N3.Writer({ format: "nt" }).quadsToString([...filteredDataset]),
      );

      return filteredDataset;
    });
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
