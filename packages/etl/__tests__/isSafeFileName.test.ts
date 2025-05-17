import { describe, it } from "vitest";
import { isSafeFileName } from "../src/isSafeFileName.js";
import { safeFileNames } from "./safeFileNames.js";
import { unsafeFileNames } from "./unsafeFileNames.js";

describe("isSafeFileName", () => {
  for (const fileName of safeFileNames) {
    it(`should consider '${fileName}' safe`, ({ expect }) => {
      expect(isSafeFileName(fileName)).toStrictEqual(true);
    });
  }

  for (const fileName of unsafeFileNames) {
    it(`should consider '${fileName}' unsafe`, ({ expect }) => {
      expect(isSafeFileName(fileName)).toStrictEqual(false);
    });
  }
});
