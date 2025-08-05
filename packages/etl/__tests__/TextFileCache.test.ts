import * as tmp from "tmp-promise";
import { describe, it } from "vitest";
import { TextFileCache } from "../src/TextFileCache.js";

async function withTextFileCache(
  useTextFileCache: (textFileCache: TextFileCache) => Promise<void>,
) {
  await tmp.withDir(
    async ({ path: tempDirPath }) => {
      await useTextFileCache(
        new TextFileCache({
          directoryPath: tempDirPath,
        }),
      );
    },
    { unsafeCleanup: true },
  );
}

describe("TextFileCache", () => {
  it("get (miss)", async ({ expect }) =>
    withTextFileCache(async (textFileCache) => {
      expect(
        (await textFileCache.get("testkey")).unsafeCoerce().isNothing(),
      ).toBe(true);
    }));

  it("get (hit)", async ({ expect }) =>
    withTextFileCache(async (textFileCache) => {
      await textFileCache.set("testkey", "testvalue");
      const actualValue = (await textFileCache.get("testkey"))
        .unsafeCoerce()
        .unsafeCoerce();
      expect(actualValue).toStrictEqual("testvalue");
    }));

  it("set", async ({ expect }) =>
    withTextFileCache(async (textFileCache) => {
      await textFileCache.set("testkey", "testvalue");
    }));
});
