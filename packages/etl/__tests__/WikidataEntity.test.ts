import { Person } from "@sdapps/models";
import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikidataEntity } from "../src/WikidataEntity.js";
import { WikidataEntityRecognizer } from "../src/WikidataEntityRecognizer.js";
import { cachesDirectoryPath } from "./paths.js";
import { wikipediaEntityRecognizerTestData } from "./wikipediaEntityRecognizerTestData.js";

describe("WikidataEntity", () => {
  const sut = new WikidataEntityRecognizer({ cachesDirectoryPath });

  dotenv.config();

  for (const [id, { input }] of Object.entries(
    wikipediaEntityRecognizerTestData,
  )) {
    it(`${id} fetch`, async ({ expect }) => {
      for (const actualEntity of (await sut.resolve(input)).unsafeCoerce()) {
        const fetched = (await actualEntity.fetch()).unsafeCoerce();
        expect(fetched.dataset.size).not.toStrictEqual(0);
        expect([...fetched.dataset.match(actualEntity.iri)]).not.toHaveLength(
          0,
        );
      }
    });

    it(`${id} name`, async ({ expect }) => {
      for (const actualEntity of (await sut.resolve(input)).unsafeCoerce()) {
        const fetched = (await actualEntity.fetch()).unsafeCoerce();
        expect(fetched.dataset.size).not.toStrictEqual(0);
        expect([...fetched.dataset.match(actualEntity.iri)]).not.toHaveLength(
          0,
        );
      }
    });
  }

  it(
    "toThing (MusicGroup)",
    async ({ expect }) => {
      const thing = (
        await (
          await new WikidataEntity({
            cachesDirectoryPath,
            id: "Q154685",
          }).fetch()
        )
          .unsafeCoerce()
          .toThing()
      ).unsafeCoerce();
      expect(thing).toBeInstanceOf(Person);
      expect(thing.name.extract()).toStrictEqual("Vienna Philharmonic");
      expect(thing.description.extract()).toStrictEqual(
        "symphonic orchestra based in Vienna, Austria",
      );
    },
    { timeout: 120000 },
  );

  it("toThing (Person)", async ({ expect }) => {
    const thing = (
      await new WikidataEntity({ cachesDirectoryPath, id: "Q1145" }).toThing()
    ).unsafeCoerce();
    expect(thing).toBeInstanceOf(Person);
    expect(thing.name.extract()).toStrictEqual("Jean-Philippe Rameau");
    expect(thing.description.extract()).toStrictEqual(
      "French composer and music theorist (1683–1764)",
    );
  });
});
