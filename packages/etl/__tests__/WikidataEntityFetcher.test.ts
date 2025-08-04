import { describe, it } from "vitest";
import { WikidataEntityFetcher } from "../src/WikidataEntityFetcher.js";
import { wikipediaEntities as testData } from "./data/wikipediaEntities.js";
import { cachesDirectoryPath } from "./paths.js";

describe("WikidataEntityFetcher", () => {
  for (const [id, { entities }] of Object.entries(testData)) {
    it(`${id} fetch + memory cache`, async ({ expect }) => {
      const sut = new WikidataEntityFetcher({ cachesDirectoryPath });
      for (let i = 0; i < 2; i++) {
        for (const expectedEntity of entities) {
          const actualEntity = (
            await sut.fetch(expectedEntity.wikidata.id)
          ).unsafeCoerce();
          expect(actualEntity.name.unsafeCoerce()).toStrictEqual(
            expectedEntity.wikidata.name,
          );
        }
      }
    });

    it(`${id} fetch + file system cache`, async ({ expect }) => {
      for (let i = 0; i < 2; i++) {
        const sut = new WikidataEntityFetcher({ cachesDirectoryPath });
        for (const expectedEntity of entities) {
          const actualEntity = (
            await sut.fetch(expectedEntity.wikidata.id)
          ).unsafeCoerce();
          expect(actualEntity.name.unsafeCoerce()).toStrictEqual(
            expectedEntity.wikidata.name,
          );
        }
      }
    });
  }

  it("fetch non-extant + memory cache", async ({ expect }) => {
    const sut = new WikidataEntityFetcher({ cachesDirectoryPath });
    for (let i = 0; i < 2; i++) {
      const result = await sut.fetch("Q1111111111111");
      expect(result.isLeft()).toStrictEqual(true);
    }
  });
});
