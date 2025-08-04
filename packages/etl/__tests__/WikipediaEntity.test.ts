import { describe, it } from "vitest";
import { WikipediaEntityFetcher } from "../src/WikipediaEntityFetcher.js";
import { wikipediaEntities as testData } from "./data/wikipediaEntities.js";
import { cachesDirectoryPath } from "./paths.js";

describe("WikipediaEntity", () => {
  const sut = new WikipediaEntityFetcher({ cachesDirectoryPath });

  for (const [id, { entities }] of Object.entries(testData)) {
    it(`${id} wikidataEntityId`, async ({ expect }) => {
      for (const expectedEntity of entities) {
        const actualEntity = (
          await sut.fetch(expectedEntity.wikipedia.url)
        ).unsafeCoerce();
        expect(actualEntity.wikidataEntityId).toStrictEqual(
          expectedEntity.wikidata.id,
        );
      }
    });
  }
});
