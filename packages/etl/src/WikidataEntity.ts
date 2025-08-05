import { DatasetCore, NamedNode } from "@rdfjs/types";
import { MusicGroup, Organization, Person, Thing } from "@sdapps/models";
import { owl, schema } from "@tpluscode/rdf-ns-builders";
import N3, { DataFactory } from "n3";
import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { Resource } from "rdfjs-resource";
import { invariant } from "ts-invariant";
import { Memoize } from "typescript-memoize";
import { WikidataEntityFetcher } from "./WikidataEntityFetcher.js";

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
  private readonly fetcher: WikidataEntityFetcher;
  readonly id: string;
  private readonly logger?: Logger;

  constructor({
    dataset,
    fetcher,
    id,
    logger,
  }: {
    dataset: DatasetCore;
    fetcher: WikidataEntityFetcher;
    id: string;
    logger?: Logger;
  }) {
    this.fetcher = fetcher;
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
      ): Promise<"MusicGroup" | "Organization" | "Person" | "Thing"> => {
        if (visitingWikidataEntityIds.has(wikidataEntity.id)) {
          return "Thing";
        }

        visitingWikidataEntityIds.add(wikidataEntity.id);
        try {
          switch (wikidataEntity.id) {
            case "Q2088357": // musical ensemble
              return "MusicGroup";
            case "Q43229": // organization
              return "Organization";
            case "Q5": // "human"
              return "Person";
            default:
              this.logger?.trace(
                `unrecognized Wikidata entity ${wikidataEntity.id} (name=${wikidataEntity.name.extract()})`,
              );
              break;
          }

          // An "instance" entity will have type/instance of but not subClassOf or sameAs.
          // A "class" entity will have sameAs xor subClassOf.
          const sameAsQuads = [
            ...wikidataEntity.dataset.match(wikidataEntity.iri, owl.sameAs),
          ];
          const subClassOfQuads = [
            ...wikidataEntity.dataset.match(wikidataEntity.iri, wdt.subClassOf),
          ];
          let typeQuads = [
            ...wikidataEntity.dataset.match(wikidataEntity.iri, wdt.type),
          ];
          if (sameAsQuads.length > 0) {
            invariant(subClassOfQuads.length === 0);
            invariant(typeQuads.length === 0);
          }
          if (subClassOfQuads.length > 0) {
            invariant(sameAsQuads.length === 0);
            // Ignore the type of classes (metaclasses)
            typeQuads = [];
          }
          if (typeQuads.length > 0) {
            invariant(sameAsQuads.length === 0);
            invariant(subClassOfQuads.length === 0);
          }

          for (const quads of [sameAsQuads, subClassOfQuads, typeQuads]) {
            for (const quad of quads) {
              if (quad.object.termType !== "NamedNode") {
                continue;
              }
              if (!quad.object.value.startsWith(wd.value)) {
                this.logger?.warn(
                  `${this.iri} related to non-Wikidata entity: ${quad.object.value}`,
                );
                continue;
              }

              const relatedWikidataEntityId = quad.object.value.substring(
                wd.value.length,
              );
              this.logger?.trace(
                `fetching related Wikidata entity ${relatedWikidataEntityId}`,
              );
              const relatedWikidataEntity = await liftEither(
                await this.fetcher.fetch(relatedWikidataEntityId),
              );
              this.logger?.trace(
                `fetched related Wikidata entity ${relatedWikidataEntity.id} (name=${relatedWikidataEntity.name.extract()})`,
              );

              const relatedWikidataEntityType = await wikidataEntityType(
                relatedWikidataEntity,
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
      const kwds: ConstructorParameters<typeof Thing>[0] = {
        description: this.description,
        identifier: this.iri,
        name: this.name,
      };

      switch (type) {
        case "MusicGroup":
          return new MusicGroup(kwds);
        case "Organization":
          return new Organization(kwds);
        case "Person":
          return new Person(kwds);
        case "Thing":
          this.logger?.warn(
            `unable to infer schema.org type for Wikidata entity ${this.id}, defaulting to Thing`,
          );
          return new Thing(kwds);
      }
    });
  }
}
