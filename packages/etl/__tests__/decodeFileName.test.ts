import { describe, it } from "vitest";
import { decodeFileName } from "../src/decodeFileName.js";
import { encodeFileName } from "../src/encodeFileName.js";
import { safeFileNames } from "./safeFileNames.js";
import { unsafeFileNames } from "./unsafeFileNames.js";

describe("decodeFileName", () => {
  for (const fileName of unsafeFileNames.concat(safeFileNames)) {
    it(`should encode and decode '${fileName}'`, ({ expect }) => {
      const encodedFileName = encodeFileName(fileName);
      const decodedFileName = decodeFileName(encodedFileName);
      expect(decodedFileName).toStrictEqual(fileName);
    });
  }
});
