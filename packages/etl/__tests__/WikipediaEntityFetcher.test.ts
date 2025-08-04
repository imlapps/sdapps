import { describe, it } from "vitest";
import { WikipediaEntityFetcher } from "../src/WikipediaEntityFetcher.js";
import { wikipediaEntities as testData } from "./data/wikipediaEntities.js";
import { cachesDirectoryPath } from "./paths.js";

describe("WikipediaEntityFetcher", () => {
  for (const [id, { entities }] of Object.entries(testData)) {
    it(`${id} fetch + memory cache`, async ({ expect }) => {
      const sut = new WikipediaEntityFetcher({ cachesDirectoryPath });
      for (let i = 0; i < 2; i++) {
        for (const expectedEntity of entities) {
          const actualEntity = (
            await sut.fetch(expectedEntity.wikipedia.url)
          ).unsafeCoerce();
          expect(actualEntity.wikidataEntityId).toStrictEqual(
            expectedEntity.wikidata.id,
          );
        }
      }
    });

    it(`${id} fetch + file system cache`, async ({ expect }) => {
      for (let i = 0; i < 2; i++) {
        const sut = new WikipediaEntityFetcher({ cachesDirectoryPath });
        for (const expectedEntity of entities) {
          const actualEntity = (
            await sut.fetch(expectedEntity.wikipedia.url)
          ).unsafeCoerce();
          expect(actualEntity.wikidataEntityId).toStrictEqual(
            expectedEntity.wikidata.id,
          );
        }
      }
    });
  }
});
