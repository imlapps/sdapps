import { describe, it } from "vitest";
import { encodeFileName } from "../src/encodeFileName.js";
import { safeFileNames } from "./safeFileNames.js";
import { unsafeFileNames } from "./unsafeFileNames.js";

describe("encodeFileName", () => {
  for (const fileName of safeFileNames.concat(unsafeFileNames)) {
    it(`should encode '${fileName}'`, ({ expect }) => {
      expect(encodeFileName(fileName)).not.toEqual(fileName);
    });
  }
});
