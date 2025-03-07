#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Person } from "@prosopa/models";
import PrefixMap from "@rdfjs/prefix-map/PrefixMap";
import Serializer from "@rdfjs/serializer-turtle";
import { NamedNode } from "@rdfjs/types";
import { rdf, schema, xsd } from "@tpluscode/rdf-ns-builders";
import { command, flag, run } from "cmd-ts";
import N3 from "n3";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";
import { MutableResourceSet } from "rdfjs-resource";
import yaml from "yaml";
import { z } from "zod";

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

const congressLegislatorsBaseUrl =
  "https://unitedstates.github.io/congress-legislators/";
const congressLegislatorSchema = z.object({
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
type CongressLegislator = z.infer<typeof congressLegislatorSchema>;
const congressLegislatorsSchema = z.array(congressLegislatorSchema);

const congressLegislatorSocialMediaSchema = z.object({
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
type CongressLegislatorSocialMedia = z.infer<
  typeof congressLegislatorSocialMediaSchema
>;
const congressLegislatorsSocialMediaSchema = z.array(
  congressLegislatorSocialMediaSchema,
);

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
    const congressLegislators = await congressLegislatorsSchema.parseAsync(
      await fetchYaml(`${congressLegislatorsBaseUrl}legislators-current.yaml`),
    );
    const congressLegislatorsSocialMediaByBioguideId = (
      await congressLegislatorsSocialMediaSchema.parseAsync(
        await fetchYaml(
          `${congressLegislatorsBaseUrl}legislators-social-media.yaml`,
        ),
      )
    ).reduce(
      (map, element) => {
        map[element.id.bioguide] = element.social;
        return map;
      },
      {} as Record<number, CongressLegislatorSocialMedia["social"]>,
    );

    const dataset = new N3.Store();
    const resourceSet = new MutableResourceSet({
      dataFactory: N3.DataFactory,
      dataset,
    });

    // Transform
    for (const congressLegislator of congressLegislators) {
      const socialMedia: CongressLegislatorSocialMedia["social"] =
        congressLegislatorsSocialMediaByBioguideId[
          congressLegislator.id.bioguide
        ] ?? {};

      const personSameAs: NamedNode[] = [];
      if (congressLegislator.id.wikidata) {
        personSameAs.push(
          N3.DataFactory.namedNode(
            `http://www.wikidata.org/entity/${congressLegislator.id.wikidata}`,
          ),
        );
      }
      if (congressLegislator.id.wikipedia) {
        personSameAs.push(
          N3.DataFactory.namedNode(
            `https://en.wikipedia.org/wiki/${congressLegislator.id.wikipedia.replaceAll(" ", "_")}`,
          ),
        );
      }
      if (socialMedia.facebook) {
        personSameAs.push(
          N3.DataFactory.namedNode(
            `https://facebook.com/${socialMedia.facebook}`,
          ),
        );
      }
      if (socialMedia.instagram) {
        personSameAs.push(
          N3.DataFactory.namedNode(
            `https://instagram.com/${socialMedia.instagram}`,
          ),
        );
      }
      if (socialMedia.twitter) {
        personSameAs.push(
          N3.DataFactory.namedNode(
            `https://twitter.com/${socialMedia.twitter}`,
          ),
        );
      }
      if (socialMedia.youtube) {
        personSameAs.push(
          N3.DataFactory.namedNode(
            `https://youtube.com/user/${socialMedia.youtube}`,
          ),
        );
      }
      if (socialMedia.youtube_id) {
        personSameAs.push(
          N3.DataFactory.namedNode(
            `https://youtube.com/channel/${socialMedia.youtube_id}`,
          ),
        );
      }

      const person = new Person({
        birthDate: congressLegislator.bio.birthday
          ? new Date(congressLegislator.bio.birthday)
          : undefined,
        familyName: congressLegislator.name.last,
        gender:
          congressLegislator.bio.gender === "F" ? schema.Female : schema.Male,
        givenName: congressLegislator.name.first,
        identifier: N3.DataFactory.namedNode(
          `https://bioguide.congress.gov/search/bio/${congressLegislator.id.bioguide}`,
        ),
        name: congressLegislator.name.official_full,
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
            factory: N3.DataFactory,
          },
        ),
      }).transform([...dataset]),
    );
  },
});

run(cmd, process.argv.slice(2));
