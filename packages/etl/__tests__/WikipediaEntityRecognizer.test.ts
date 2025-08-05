import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikipediaEntityRecognizer } from "../src/WikipediaEntityRecognizer.js";
import { wikipediaEntities as testData } from "./data/wikipediaEntities.js";
import { cachesDirectoryPath } from "./paths.js";

describe("WikipediaEntityRecognizer", () => {
  const sut = new WikipediaEntityRecognizer({ cachesDirectoryPath });

  dotenv.config();

  for (const [id, { entities, recognizerInput }] of Object.entries(testData)) {
    it(`recognize ${id}`, async ({ expect }) => {
      const actualEntities = (
        await sut.recognize(recognizerInput)
      ).unsafeCoerce();
      expect(actualEntities).toHaveLength(entities.length);
      for (const expectedEntity of entities) {
        expect(
          actualEntities.some(
            (actualEntity) =>
              actualEntity.urlTitle === expectedEntity.wikipedia.urlTitle,
          ),
        ).toStrictEqual(true);
      }
    });
  }
});
