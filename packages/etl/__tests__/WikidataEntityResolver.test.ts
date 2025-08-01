import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikidataEntityResolver } from "../src/WikidataEntityResolver.js";
import { cachesDirectoryPath } from "./paths.js";
import { wikipediaEntityResolverTestData } from "./wikipediaEntityResolverTestData.js";

describe("WikidataEntityResolver", () => {
  const sut = new WikidataEntityResolver({ cachesDirectoryPath });

  dotenv.config();

  for (const [id, { input, expectedOutput }] of Object.entries(
    wikipediaEntityResolverTestData,
  )) {
    it(id, async ({ expect }) => {
      const actualEntities = (await sut.resolve(input)).unsafeCoerce();
      expect(actualEntities).toHaveLength(expectedOutput.length);
      for (const expectedEntity of expectedOutput) {
        expect(
          actualEntities.some(
            (actualEntity) => actualEntity.id === expectedEntity.wikidataId,
          ),
        ).toStrictEqual(true);
      }
    });
  }
});
