import { DatasetCore, NamedNode } from "@rdfjs/types";
import { Person, Thing } from "@sdapps/models";
import { owl, schema } from "@tpluscode/rdf-ns-builders";
import N3, { DataFactory } from "n3";
import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { Resource } from "rdfjs-resource";
import { Memoize } from "typescript-memoize";
import { WikidataEntityCache } from "./WikidataEntityCache.js";

const wd = DataFactory.namedNode("http://www.wikidata.org/entity/");

namespace wdt {
  export const subClassOf: NamedNode = DataFactory.namedNode(
    "http://www.wikidata.org/prop/direct/P279",
  );

  export const type = DataFactory.namedNode(
    "http://www.wikidata.org/prop/direct/P31",
  );
}

export class WikidataEntity {
  private readonly dataset: DatasetCore;
  private readonly cache: WikidataEntityCache;
  readonly id: string;
  private readonly logger?: Logger;

  constructor({
    cache,
    dataset,
    id,
    logger,
  }: {
    cache: WikidataEntityCache;
    dataset: DatasetCore;
    id: string;
    logger?: Logger;
  }) {
    this.cache = cache;
    this.dataset = dataset;
    this.id = id;
    this.logger = logger;
  }

  get description(): Maybe<string> {
    return this.stringProperty(schema.description);
  }

  @Memoize()
  get iri(): NamedNode {
    return N3.DataFactory.namedNode(
      `http://www.wikidata.org/entity/${this.id}`,
    );
  }

  get name(): Maybe<string> {
    return this.stringProperty(schema.name);
  }

  @Memoize()
  private get resource(): Resource<NamedNode> {
    return new Resource<NamedNode>({
      dataset: this.dataset,
      identifier: this.iri,
    });
  }

  private stringProperty(predicate: NamedNode): Maybe<string> {
    return Maybe.fromNullable(
      this.resource
        .values(predicate)
        .flatMap((value) => value.toLiteral().toMaybe().toList())
        .find((value) => value.language.length === 0 || value.language === "en")
        ?.value,
    );
  }

  toString(): string {
    return this.id;
  }

  async toThing(): Promise<Either<Error, Thing>> {
    return EitherAsync(async ({ liftEither }) => {
      const wikidataEntityType = async (
        wikidataEntity: WikidataEntity,
        visitingWikidataEntityIds: Set<string>,
      ): Promise<"Person" | "Thing"> => {
        if (visitingWikidataEntityIds.has(wikidataEntity.id)) {
          return "Thing";
        }

        visitingWikidataEntityIds.add(wikidataEntity.id);
        try {
          switch (wikidataEntity.id) {
            case "Q5": // "human"
              return "Person";
          }

          // An "instance" entity will have type/instance of but not subClassOf or sameAs.
          // A "class" entity will have sameAs xor subClassOf.
          for (const directClaimPredicate of [
            owl.sameAs,
            wdt.subClassOf,
            wdt.type,
          ]) {
            for (const quad of wikidataEntity.dataset.match(
              wikidataEntity.iri,
              directClaimPredicate,
            )) {
              if (quad.object.termType !== "NamedNode") {
                continue;
              }
              if (!quad.object.value.startsWith(wd.value)) {
                this.logger?.warn(
                  `${this.iri} related (${directClaimPredicate.value}) to non-Wikidata entity: ${quad.object.value}`,
                );
                continue;
              }

              const relatedWikidataEntityType = await wikidataEntityType(
                await liftEither(
                  await this.cache.get(
                    quad.object.value.substring(wd.value.length),
                  ),
                ),
                visitingWikidataEntityIds,
              );

              if (relatedWikidataEntityType !== "Thing") {
                return relatedWikidataEntityType;
              }
            }
          }

          return "Thing";
        } finally {
          visitingWikidataEntityIds.delete(wikidataEntity.id);
        }
      };

      const type = await wikidataEntityType(this, new Set());
      const kwds = {
        description: this.description,
        identifier: this.iri,
        name: this.name,
      };

      switch (type) {
        case "Person":
          return new Person(kwds);
        case "Thing":
          return new Thing(kwds);
      }
    });
  }
}
