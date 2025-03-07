#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ImageObject,
  Organization,
  Person,
  QuantitiveValue,
  Role,
} from "@prosopa/models";
import PrefixMap from "@rdfjs/prefix-map/PrefixMap";
import Serializer from "@rdfjs/serializer-turtle";
import type { NamedNode } from "@rdfjs/types";
import { rdf, schema, xsd } from "@tpluscode/rdf-ns-builders";
import { command, flag, run } from "cmd-ts";
import N3 from "n3";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";
import { MutableResourceSet } from "rdfjs-resource";
import yaml from "yaml";
import { z } from "zod";

const dataFactory = N3.DataFactory;

const thisDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);
const dataDirectoryPath = path.resolve(
  thisDirectoryPath,
  "..",
  "..",
  "data",
  "congress",
);
const cacheDirectoryPath = path.join(dataDirectoryPath, ".cache");

const legislatorsBaseUrl =
  "https://unitedstates.github.io/congress-legislators/";
const legislatorSchema = z.object({
  bio: z.object({
    birthday: z.string().date().optional(),
    gender: z.enum(["F", "M"]),
  }),
  id: z.object({
    bioguide: z.string(),
    pictorial: z.number().optional(),
    wikidata: z.string(),
    wikipedia: z.string(),
    // Many other id's
  }),
  leadership_roles: z
    .array(
      z.object({
        chamber: z.string(),
        end: z.string().date(),
        start: z.string().date(),
        title: z.string(),
      }),
    )
    .optional(),
  name: z.object({
    first: z.string(),
    last: z.string(),
    middle: z.string().optional(),
    nickname: z.string().optional(),
    official_full: z.string(),
    suffix: z.string().optional(),
  }),
  terms: z.array(
    z.object({
      address: z.string().optional(),
      caucus: z.string().optional(),
      class: z.number().optional(),
      contact_form: z.string().url().optional(),
      district: z.number().optional(),
      end: z.string().date(),
      fax: z.string().nullable().optional(),
      // Ignore how
      office: z.string().optional(),
      party: z.string(),
      phone: z.string().optional(),
      // Ignore rss_url
      start: z.string().date(),
      state: z.string().length(2),
      state_rank: z.enum(["junior", "senior"]).optional(),
      type: z.enum(["rep", "sen"]),
      url: z.string().url().optional(),
    }),
  ),
});
const legislatorsSchema = z.array(legislatorSchema);

const legislatorSocialMediaSchema = z.object({
  id: z.object({
    bioguide: z.string(),
  }),
  social: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    twitter_id: z.number().optional(),
    youtube: z.string().optional(),
    youtube_id: z.string().optional(),
  }),
});
type legislatorSocialMedia = z.infer<typeof legislatorSocialMediaSchema>;
const legislatorsSocialMediaSchema = z.array(legislatorSocialMediaSchema);

const fetch = NodeFetchCache.create({
  cache: new FileSystemCache({
    cacheDirectory: cacheDirectoryPath,
  }),
});
const fetchYaml = async (url: string): Promise<any> => {
  const response = await fetch(url);
  const responseText = await response.text();
  return yaml.parse(responseText);
};

const cmd = command({
  description:
    "extract, transform and load data about the United States Congress",
  name: "extract-transform-load",
  args: {
    noCache: flag({
      long: "no-cache",
    }),
  },
  handler: async ({ noCache }) => {
    if (noCache) {
      await fs.promises.rm(cacheDirectoryPath, { recursive: true });
    }

    // Extract
    const legislators = await legislatorsSchema.parseAsync(
      await fetchYaml(`${legislatorsBaseUrl}legislators-current.yaml`),
    );
    const legislatorsSocialMediaByBioguideId = (
      await legislatorsSocialMediaSchema.parseAsync(
        await fetchYaml(`${legislatorsBaseUrl}legislators-social-media.yaml`),
      )
    ).reduce(
      (map, element) => {
        map[element.id.bioguide] = element.social;
        return map;
      },
      {} as Record<number, legislatorSocialMedia["social"]>,
    );

    const dataset = new N3.Store();
    const resourceSet = new MutableResourceSet({
      dataFactory,
      dataset,
    });

    const partiesByName: Record<string, Organization> = {};

    // Transform
    for (const legislator of legislators) {
      const legislatorSocialMedia: legislatorSocialMedia["social"] =
        legislatorsSocialMediaByBioguideId[legislator.id.bioguide] ?? {};

      const currentTerm = legislator.terms[legislator.terms.length - 1];

      let party: Organization | undefined;
      party = partiesByName[currentTerm.party];
      if (!party) {
        let partyIdentifier: NamedNode | undefined;
        switch (currentTerm.party) {
          case "Democrat":
            partyIdentifier = dataFactory.namedNode(
              "https://www.wikidata.org/wiki/Q29552",
            );
            break;
          case "Independent":
            break;
          case "Republican":
            partyIdentifier = dataFactory.namedNode(
              "https://www.wikidata.org/wiki/Q29468",
            );
            break;
          default:
            throw new RangeError(currentTerm.party);
        }
        if (partyIdentifier) {
          partiesByName[currentTerm.party] = party = new Organization({
            identifier: partyIdentifier,
            name: currentTerm.party,
          });
        }
      }

      const personSameAs: NamedNode[] = [];
      if (legislator.id.wikidata) {
        personSameAs.push(
          dataFactory.namedNode(
            `http://www.wikidata.org/entity/${legislator.id.wikidata}`,
          ),
        );
      }
      if (legislator.id.wikipedia) {
        personSameAs.push(
          dataFactory.namedNode(
            `https://en.wikipedia.org/wiki/${legislator.id.wikipedia.replaceAll(" ", "_")}`,
          ),
        );
      }
      if (legislatorSocialMedia.facebook) {
        personSameAs.push(
          dataFactory.namedNode(
            `https://facebook.com/${legislatorSocialMedia.facebook}`,
          ),
        );
      }
      if (legislatorSocialMedia.instagram) {
        personSameAs.push(
          dataFactory.namedNode(
            `https://instagram.com/${legislatorSocialMedia.instagram}`,
          ),
        );
      }
      if (legislatorSocialMedia.twitter) {
        personSameAs.push(
          dataFactory.namedNode(
            `https://twitter.com/${legislatorSocialMedia.twitter}`,
          ),
        );
      }
      if (legislatorSocialMedia.youtube) {
        personSameAs.push(
          dataFactory.namedNode(
            `https://youtube.com/user/${legislatorSocialMedia.youtube}`,
          ),
        );
      }
      if (legislatorSocialMedia.youtube_id) {
        personSameAs.push(
          dataFactory.namedNode(
            `https://youtube.com/channel/${legislatorSocialMedia.youtube_id}`,
          ),
        );
      }

      // https://github.com/unitedstates/images
      const personImageObject = ({
        isBasedOn,
        size,
      }: {
        isBasedOn?: NamedNode;
        size: "original" | { height: number; width: number };
      }): ImageObject => {
        const contentUrl = `https://unitedstates.github.io/images/congress/${size === "original" ? "original" : `${size.width}x${size.height}`}/${legislator.id.bioguide}.jpg`;
        return new ImageObject({
          contentUrl: contentUrl,
          height:
            size !== "original"
              ? new QuantitiveValue({
                  identifier: dataFactory.namedNode(`${contentUrl}#height`),
                  value: size.height,
                })
              : undefined,
          identifier: contentUrl,
          isBasedOn: isBasedOn ? [isBasedOn] : undefined,
          width:
            size !== "original"
              ? new QuantitiveValue({
                  identifier: dataFactory.namedNode(`${contentUrl}#width`),
                  value: size.width,
                })
              : undefined,
        });
      };
      const personOriginalImageObject = personImageObject({ size: "original" });
      const personImageObjects = [
        personOriginalImageObject,
        personImageObject({
          isBasedOn: personOriginalImageObject.identifier,
          size: {
            height: 550,
            width: 450,
          },
        }),
        personImageObject({
          isBasedOn: personOriginalImageObject.identifier,
          size: {
            height: 225,
            width: 275,
          },
        }),
      ];
      personImageObjects.forEach((imageObject) =>
        imageObject.toRdf({ resourceSet }),
      );

      const person = new Person({
        affiliations: party ? [party] : undefined,
        birthDate: legislator.bio.birthday
          ? new Date(legislator.bio.birthday)
          : undefined,
        familyName: legislator.name.last,
        gender: legislator.bio.gender === "F" ? schema.Female : schema.Male,
        givenName: legislator.name.first,
        hasOccupation: legislator.terms.map(
          (term) =>
            new Role({
              endDate: new Date(term.end),
              name:
                term.type === "rep"
                  ? "United States representative"
                  : "United States senator",
              roleName:
                term.type === "rep"
                  ? "https://www.wikidata.org/wiki/Q13218630"
                  : "https://www.wikidata.org/wiki/Q4416090",
              startDate: new Date(term.start),
            }),
        ),
        identifier: dataFactory.namedNode(
          `https://bioguide.congress.gov/search/bio/${legislator.id.bioguide}`,
        ),
        images: personImageObjects,
        name: legislator.name.official_full,
        sameAs: personSameAs,
      });

      person.toRdf({ resourceSet });
    }

    // Load
    await fs.promises.writeFile(
      path.join(dataDirectoryPath, "congress.ttl"),
      new Serializer({
        prefixes: new PrefixMap(
          [
            ["schema", schema[""]],
            ["rdf", rdf[""]],
            ["xsd", xsd[""]],
          ],
          {
            factory: dataFactory,
          },
        ),
      }).transform([...dataset]),
    );
  },
});

run(cmd, process.argv.slice(2));
