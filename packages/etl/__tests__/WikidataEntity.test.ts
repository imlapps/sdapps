import { MusicGroup, Person } from "@sdapps/models";
import { describe, it } from "vitest";
import { WikidataEntityFetcher } from "../src/WikidataEntityFetcher.js";
import { wikipediaEntities as testData } from "./data/wikipediaEntities.js";
import { cachesDirectoryPath } from "./paths.js";

describe("WikidataEntity", () => {
  const fetcher = new WikidataEntityFetcher({ cachesDirectoryPath });

  for (const [id, { entities }] of Object.entries(testData)) {
    it(`${id} name`, async ({ expect }) => {
      for (const expectedEntity of entities) {
        const actualEntity = (
          await fetcher.fetch(expectedEntity.wikidata.id)
        ).unsafeCoerce();
        expect(actualEntity.name).toStrictEqual(expectedEntity.wikidata.name);
      }
    });
  }

  it(
    "toThing (MusicGroup)",
    async ({ expect }) => {
      const thing = (
        await (await fetcher.fetch("Q154685")).unsafeCoerce().toThing()
      ).unsafeCoerce();
      expect(thing).toBeInstanceOf(MusicGroup);
      expect(thing.name.extract()).toStrictEqual("Vienna Philharmonic");
      expect(thing.description.extract()).toStrictEqual(
        "symphonic orchestra based in Vienna, Austria",
      );
    },
    { timeout: 120000 },
  );

  it("toThing (Person)", async ({ expect }) => {
    const thing = (
      await (await fetcher.fetch("Q1145")).unsafeCoerce().toThing()
    ).unsafeCoerce();
    expect(thing).toBeInstanceOf(Person);
    expect(thing.name.extract()).toStrictEqual("Jean-Philippe Rameau");
    expect(thing.description.extract()).toStrictEqual(
      "French composer and music theorist (1683–1764)",
    );
  });
});
