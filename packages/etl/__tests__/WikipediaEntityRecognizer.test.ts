import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikipediaEntityRecognizer } from "../src/WikipediaEntityRecognizer.js";
import { cachesDirectoryPath } from "./paths.js";
import { wikipediaEntityRecognizerTestData } from "./wikipediaEntityRecognizerTestData.js";

describe("WikipediaEntityRecognizer", () => {
  const sut = new WikipediaEntityRecognizer({ cachesDirectoryPath });

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
            (actualEntity) =>
              actualEntity.urlTitle === expectedEntity.wikipediaUrlTitle,
          ),
        ).toStrictEqual(true);
      }
    });
  }
});
