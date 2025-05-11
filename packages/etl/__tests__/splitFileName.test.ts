import { describe, it } from "vitest";
import { splitFileName } from "../src/splitFileName.js";

describe("splitFileName", () => {
  it("should split a file name with no extension", ({ expect }) => {
    expect(splitFileName("test")).toStrictEqual(["test", ""]);
  });

  it("should split a file name with an empty extension", ({ expect }) => {
    expect(splitFileName("test.")).toStrictEqual(["test", "."]);
  });

  it("should split a file name with one extension", ({ expect }) => {
    expect(splitFileName("test.x")).toStrictEqual(["test", ".x"]);
  });

  it("should split a file name with multiple extensions", ({ expect }) => {
    expect(splitFileName("test.x.y")).toStrictEqual(["test.x", ".y"]);
  });
});
