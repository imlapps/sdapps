import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikidataEntityRecognizer } from "../src/WikidataEntityRecognizer.js";
import { wikipediaEntities as testData } from "./data/wikipediaEntities.js";
import { cachesDirectoryPath } from "./paths.js";

describe("WikidataEntityRecognizer", () => {
  const sut = new WikidataEntityRecognizer({ cachesDirectoryPath });

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
            (actualEntity) => actualEntity.id === expectedEntity.wikidata.id,
          ),
        ).toStrictEqual(true);
      }
    });
  }
});
