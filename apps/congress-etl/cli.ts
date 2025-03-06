#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { command, flag, run } from "cmd-ts";
import N3 from "n3";
import NodeFetchCache, { FileSystemCache } from "node-fetch-cache";
import { MutableResourceSet } from "rdfjs-resource";
import yaml from "yaml";
import { z } from "zod";

const thisDirectoryPath = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url))),
);
const dataDirectoryPath = path.resolve(thisDirectoryPath, "..", "..", "data", "congress");
const cacheDirectoryPath = path.join(dataDirectoryPath, ".cache");

const congressLegislatorsBaseUrl =
  "https://unitedstates.github.io/congress-legislators/";
const congressLegislatorsSchema = z.array(
  z.object({
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
  }),
);
const congressLegislatorsSocialMediaSchema = z.array(
  z.object({
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
  }),
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

    const congressLegislators = await congressLegislatorsSchema.parseAsync(
      await fetchYaml(`${congressLegislatorsBaseUrl}legislators-current.yaml`),
    );
    const congressLegislatorsSocialMedia =
      await congressLegislatorsSocialMediaSchema.parseAsync(
        await fetchYaml(
          `${congressLegislatorsBaseUrl}legislators-social-media.yaml`,
        ),
      );

    const resourceSet = new MutableResourceSet({dataset: });
  },
});

run(cmd, process.argv.slice(2));
