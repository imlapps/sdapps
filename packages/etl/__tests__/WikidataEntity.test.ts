import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikidataEntityResolver } from "../src/WikidataEntityResolver.js";
import { cachesDirectoryPath } from "./paths.js";
import { wikipediaEntityResolverTestData } from "./wikipediaEntityResolverTestData.js";

describe("WikidataEntity", () => {
  const sut = new WikidataEntityResolver({ cachesDirectoryPath });

  dotenv.config();

  for (const [id, { input }] of Object.entries(
    wikipediaEntityResolverTestData,
  )) {
    it(`${id} dataset`, async ({ expect }) => {
      for (const actualEntity of (await sut.resolve(input)).unsafeCoerce()) {
        const dataset = (await actualEntity.dataset()).unsafeCoerce();
        expect(dataset.size).not.toStrictEqual(0);
        expect([...dataset.match(actualEntity.iri)]).not.toHaveLength(0);
      }
    });
  }
});
