import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikidataEntityRecognizer } from "../src/WikidataEntityRecognizer.js";
import { cachesDirectoryPath } from "./paths.js";
import { wikipediaEntityRecognizerTestData } from "./wikipediaEntityRecognizerTestData.js";

describe("WikidataEntityRecognizer", () => {
  const sut = new WikidataEntityRecognizer({ cachesDirectoryPath });

  dotenv.config();

  for (const [id, { input, expectedOutput }] of Object.entries(
    wikipediaEntityRecognizerTestData,
  )) {
    it(`resolve ${id}`, async ({ expect }) => {
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
