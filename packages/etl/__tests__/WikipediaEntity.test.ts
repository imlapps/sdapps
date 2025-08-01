import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikipediaEntityResolver } from "../src/WikipediaEntityResolver.js";
import { cachesDirectoryPath } from "./paths.js";
import { wikipediaEntityResolverTestData } from "./wikipediaEntityResolverTestData.js";

describe("WikipediaEntity", () => {
  const sut = new WikipediaEntityResolver({ cachesDirectoryPath });

  dotenv.config();

  for (const [id, { input, expectedOutput }] of Object.entries(
    wikipediaEntityResolverTestData,
  )) {
    it(`${id} wikidataEntity`, async ({ expect }) => {
      const actualEntities = (await sut.resolve(input)).unsafeCoerce();
      expect(actualEntities).toHaveLength(expectedOutput.length);
      for (const expectedEntity of expectedOutput) {
        let foundExpectedEntity = false;
        for (const actualEntity of actualEntities) {
          if (actualEntity.urlTitle === expectedEntity.wikipediaUrlTitle) {
            expect(
              (await actualEntity.wikidataEntity())
                .unsafeCoerce()
                .unsafeCoerce().id === expectedEntity.wikidataId,
            );
            foundExpectedEntity = true;
            break;
          }
        }
        expect(foundExpectedEntity).toStrictEqual(true);
      }
    });
  }
});
