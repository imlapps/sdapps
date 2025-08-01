import * as dotenv from "dotenv";
import { describe, it } from "vitest";
import { WikipediaEntityResolver } from "../src/WikipediaEntityResolver.js";
import { cachesDirectoryPath } from "./paths.js";

describe("WikipediaEntityResolver", () => {
  const sut = new WikipediaEntityResolver({ cachesDirectoryPath });

  dotenv.config();

  it("single entity in few-shot examples", async ({ expect }) => {
    const entities = (
      await sut.resolve({ name: "Jean Philippe Rameau", role: "composer" })
    ).unsafeCoerce();
    expect(entities).toHaveLength(1);
    expect(entities[0].url.toString()).toStrictEqual(
      "https://en.wikipedia.org/wiki/Jean-Philippe_Rameau",
    );
  });

  it("single entity not in few-shot examples", async ({ expect }) => {
    const entities = (
      await sut.resolve({ name: "George Frideric Handel", role: "composer" })
    ).unsafeCoerce();
    expect(entities).toHaveLength(1);
    expect(entities[0].url.toString()).toStrictEqual(
      "https://en.wikipedia.org/wiki/George_Frideric_Handel",
    );
  });
});
