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
    expect(entities[0].urlTitle).toStrictEqual("Jean-Philippe_Rameau");
  });

  it("single entity not in few-shot examples", async ({ expect }) => {
    const entities = (
      await sut.resolve({ name: "George Frideric Handel", role: "composer" })
    ).unsafeCoerce();
    expect(entities).toHaveLength(1);
    expect(entities[0].urlTitle).toStrictEqual("George_Frideric_Handel");
  });

  it("single entity non-extant", async ({ expect }) => {
    const entities = (
      await sut.resolve({ name: "Phoenicia Hartsmuth", role: "composer" })
    ).unsafeCoerce();
    expect(entities).toHaveLength(0);
  });

  it("multiple entities in few-shot examples", async ({ expect }) => {
    const entities = (
      await sut.resolve({
        name: "Vienna Phil Orch,Levine, James",
        role: "artist",
      })
    ).unsafeCoerce();
    expect(entities).toHaveLength(2);
    expect(
      entities.some((entity) => entity.urlTitle === "Vienna_Philharmonic"),
    ).toStrictEqual(true);
    expect(
      entities.some((entity) => entity.urlTitle === "James_Levine"),
    ).toStrictEqual(true);
  });

  it("multiple entities not in few-shot examples", async ({ expect }) => {
    const entities = (
      await sut.resolve({
        name: "Bylsma, Anner,Lamon, Jean,Tafelmusik",
        role: "artist",
      })
    ).unsafeCoerce();
    expect(entities).toHaveLength(3);
    expect(
      entities.some((entity) => entity.urlTitle === "Anner_Bylsma"),
    ).toStrictEqual(true);
    expect(
      entities.some((entity) => entity.urlTitle === "Jeanne_Lamon"),
    ).toStrictEqual(true);
    expect(
      entities.some(
        (entity) => entity.urlTitle === "Tafelmusik_Baroque_Orchestra",
      ),
    ).toStrictEqual(true);
  });

  it("multiple entities some non-existent", async ({ expect }) => {
    const entities = (
      await sut.resolve({
        name: "Vienna Philharmonic,Phoenicia Hartsmuth",
        role: "artist",
      })
    ).unsafeCoerce();
    expect(entities).toHaveLength(1);
    expect(entities[0].urlTitle).toStrictEqual("Vienna_Philharmonic");
  });
});
