#!/usr/bin/env npm exec tsx --
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PrefixMap from "@rdfjs/prefix-map/PrefixMap";
import Serializer from "@rdfjs/serializer-turtle";
import type { NamedNode } from "@rdfjs/types";
import {
  ImageObject,
  Organization,
  Person,
  QuantitiveValue,
  Role,
} from "@sdapps/models";
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

const baseUrl = "https://unitedstates.github.io/congress-legislators/";

const committeeSchema = z.object({
  address: z.string().optional(),
  house_committee_id: z.string().length(2).optional(),
  jurisdiction: z.string().optional(),
  jurisdiction_source: z.string().optional(),
  minority_rss_url: z.string().url().optional(),
  name: z.string(),
  phone: z.string().optional(),
  rss_url: z.string().url().optional(),
  senate_committee_id: z.string().length(4).optional(),
  subcommittees: z
    .array(
      z.object({
        name: z.string(),
        thomas_id: z.string().length(2),
      }),
    )
    .optional(),
  thomas_id: z.string().length(4),
  type: z.enum(["house", "joint", "senate"]),
  url: z.string().url().optional(),
  youtube_id: z.string().optional(),
});
const committeesSchema = z.array(committeeSchema);

const committeeMembershipSchema = z.object({
  bioguide: z.string(),
  chamber: z.enum(["house", "senate"]).optional(),
  name: z.string(),
  party: z.enum(["majority", "minority"]),
  rank: z.number(),
  title: z.string().optional(),
});
const committeeMembershipsSchema = z.record(
  z.string(),
  z.array(committeeMembershipSchema),
);

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
    const committees = await committeesSchema.parseAsync(
      await fetchYaml(`${baseUrl}committees-current.yaml`),
    );
    // Bioguide ID -> committee id -> committee membership
    const committeeMembershipsByIds: Record<
      string,
      Record<string, z.infer<typeof committeeMembershipSchema>>
    > = {};
    for (const [committeeId, committeeMemberships] of Object.entries(
      await committeeMembershipsSchema.parseAsync(
        await fetchYaml(`${baseUrl}committee-membership-current.yaml`),
      ),
    )) {
      for (const committeeMembership of committeeMemberships) {
        if (!committeeMembershipsByIds[committeeMembership.bioguide]) {
          committeeMembershipsByIds[committeeMembership.bioguide] = {};
        }
        committeeMembershipsByIds[committeeMembership.bioguide][committeeId] =
          committeeMembership;
      }
    }
    const legislators = await legislatorsSchema.parseAsync(
      await fetchYaml(`${baseUrl}legislators-current.yaml`),
    );
    const legislatorsSocialMediaByBioguideId = (
      await legislatorsSocialMediaSchema.parseAsync(
        await fetchYaml(`${baseUrl}legislators-social-media.yaml`),
      )
    ).reduce(
      (map, element) => {
        map[element.id.bioguide] = element.social;
        return map;
      },
      {} as Record<number, legislatorSocialMedia["social"]>,
    );

    // Transform
    const dataset = new N3.Store();
    const resourceSet = new MutableResourceSet({
      dataFactory,
      dataset,
    });

    const houseOrganization = new Organization({
      identifier: "urn:congress:chamber:house",
      name: "United States House of Representatives",
      sameAs: [dataFactory.namedNode("http://www.wikidata.org/entity/Q11701")],
      url: "https://www.house.gov/",
    });

    const senateOrganization = new Organization({
      identifier: "urn:congress:chamber:senate",
      name: "United States Senate",
      sameAs: [dataFactory.namedNode("http://www.wikidata.org/entity/Q66096")],
      url: "https://www.senate.gov/",
    });

    const committeeOrganizationsById: Record<string, Organization> = {};
    for (const committee of committees) {
      const committeeSameAs: NamedNode[] = [];
      if (committee.url) {
        committeeSameAs.push(dataFactory.namedNode(committee.url));
      }
      if (committee.youtube_id) {
        committeeSameAs.push(
          dataFactory.namedNode(
            `https://youtube.com/channel/${committee.youtube_id}`,
          ),
        );
      }
      const committeeOrganization = new Organization({
        description: committee.jurisdiction,
        identifier: `urn:congress:committee:${committee.thomas_id}`,
        identifiers: [committee.thomas_id],
        name: committee.name,
        sameAs: committeeSameAs,
      });
      committeeOrganizationsById[committee.thomas_id] = committeeOrganization;

      for (const subcommittee of committee.subcommittees ?? []) {
        const subcommitteeOrganization = new Organization({
          identifier: `urn:congress:committee:${committee.thomas_id}:subcommittee:${subcommittee.thomas_id}`,
          name: `${committee.name}: Subcommittees: ${subcommittee.name}`,
          parentOrganizations: [committeeOrganization.identifier],
        });
        committeeOrganization.subOrganizations.push(
          subcommitteeOrganization.identifier,
        );
        committeeOrganizationsById[
          `${committee.thomas_id}${subcommittee.thomas_id}`
        ] = subcommitteeOrganization;
      }

      switch (committee.type) {
        case "house":
          committeeOrganization.parentOrganizations.push(
            houseOrganization.identifier,
          );
          houseOrganization.subOrganizations.push(
            committeeOrganization.identifier,
          );
          break;
        case "joint":
          committeeOrganization.parentOrganizations.push(
            houseOrganization.identifier,
          );
          committeeOrganization.parentOrganizations.push(
            senateOrganization.identifier,
          );
          houseOrganization.subOrganizations.push(
            committeeOrganization.identifier,
          );
          senateOrganization.subOrganizations.push(
            committeeOrganization.identifier,
          );
          break;
        case "senate":
          committeeOrganization.parentOrganizations.push(
            senateOrganization.identifier,
          );
          senateOrganization.subOrganizations.push(
            committeeOrganization.identifier,
          );
          break;
      }
    }

    const partyOrganizationsByName: Record<string, Organization> = {};
    for (const legislator of legislators) {
      const legislatorSocialMedia: legislatorSocialMedia["social"] =
        legislatorsSocialMediaByBioguideId[legislator.id.bioguide] ?? {};

      const currentTerm = legislator.terms[legislator.terms.length - 1];

      const legislatorSameAs: NamedNode[] = [
        dataFactory.namedNode(
          `https://bioguide.congress.gov/search/bio/${legislator.id.bioguide}`,
        ),
      ];
      if (legislator.id.wikidata) {
        legislatorSameAs.push(
          dataFactory.namedNode(
            `http://www.wikidata.org/entity/${legislator.id.wikidata}`,
          ),
        );
      }
      if (legislator.id.wikipedia) {
        legislatorSameAs.push(
          dataFactory.namedNode(
            `https://en.wikipedia.org/wiki/${legislator.id.wikipedia.replaceAll(" ", "_")}`,
          ),
        );
      }
      if (legislatorSocialMedia.facebook) {
        legislatorSameAs.push(
          dataFactory.namedNode(
            `https://facebook.com/${legislatorSocialMedia.facebook}`,
          ),
        );
      }
      if (legislatorSocialMedia.instagram) {
        legislatorSameAs.push(
          dataFactory.namedNode(
            `https://instagram.com/${legislatorSocialMedia.instagram}`,
          ),
        );
      }
      if (legislatorSocialMedia.twitter) {
        legislatorSameAs.push(
          dataFactory.namedNode(
            `https://twitter.com/${legislatorSocialMedia.twitter}`,
          ),
        );
      }
      if (legislatorSocialMedia.youtube) {
        legislatorSameAs.push(
          dataFactory.namedNode(
            `https://youtube.com/user/${legislatorSocialMedia.youtube}`,
          ),
        );
      }
      if (legislatorSocialMedia.youtube_id) {
        legislatorSameAs.push(
          dataFactory.namedNode(
            `https://youtube.com/channel/${legislatorSocialMedia.youtube_id}`,
          ),
        );
      }

      // https://github.com/unitedstates/images
      const legislatorImageObject = ({
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
      const legislatorOriginalImageObject = legislatorImageObject({
        size: "original",
      });
      const legislatorImageObjects = [
        legislatorOriginalImageObject,
        legislatorImageObject({
          isBasedOn: legislatorOriginalImageObject.identifier,
          size: {
            height: 550,
            width: 450,
          },
        }),
        legislatorImageObject({
          isBasedOn: legislatorOriginalImageObject.identifier,
          size: {
            height: 225,
            width: 275,
          },
        }),
      ];
      legislatorImageObjects.forEach((imageObject) =>
        imageObject.toRdf({ resourceSet }),
      );

      const legislatorPerson = new Person({
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
          `urn:congress:legislator:${legislator.id.bioguide}`,
        ),
        images: legislatorImageObjects,
        name: legislator.name.official_full,
        sameAs: legislatorSameAs,
      });

      for (const [committeeId, _committeeMembership] of Object.entries(
        committeeMembershipsByIds[legislator.id.bioguide] ?? {},
      )) {
        const committeeOrganization = committeeOrganizationsById[committeeId];
        committeeOrganization.members.push(legislatorPerson.identifier);
        legislatorPerson.memberOf.push(committeeOrganization.identifier);
      }

      let partyOrganization: Organization | undefined;
      partyOrganization = partyOrganizationsByName[currentTerm.party];
      if (!partyOrganization) {
        let partySameAs: NamedNode | undefined;
        switch (currentTerm.party) {
          case "Democrat":
            partySameAs = dataFactory.namedNode(
              "https://www.wikidata.org/wiki/Q29552",
            );
            break;
          case "Independent":
            break;
          case "Republican":
            partySameAs = dataFactory.namedNode(
              "https://www.wikidata.org/wiki/Q29468",
            );
            break;
          default:
            throw new RangeError(currentTerm.party);
        }
        partyOrganizationsByName[currentTerm.party] = partyOrganization =
          new Organization({
            identifier: `urn:congress:party:${encodeURIComponent(currentTerm.party)}`,
            name: currentTerm.party,
            sameAs: partySameAs ? [partySameAs] : undefined,
          });
      }
      if (partyOrganization) {
        legislatorPerson.memberOf.push(partyOrganization.identifier);
        partyOrganization.members.push(legislatorPerson.identifier);
      }

      legislatorPerson.toRdf({ resourceSet });
    }

    // Serialize organizations after all members have been added
    houseOrganization.toRdf({ resourceSet });
    senateOrganization.toRdf({ resourceSet });
    for (const committee of Object.values(committeeOrganizationsById)) {
      committee.toRdf({ resourceSet });
    }
    for (const party of Object.values(partyOrganizationsByName)) {
      party.toRdf({ resourceSet });
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
