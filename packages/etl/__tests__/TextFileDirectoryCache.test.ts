import * as tmp from "tmp-promise";
import { describe, it } from "vitest";
import { TextFileDirectoryCache } from "../src/TextFileDirectoryCache.js";

async function withTextFileDirectoryCache(
  useTextFileDirectoryCache: (
    textFileCache: TextFileDirectoryCache,
  ) => Promise<void>,
) {
  await tmp.withDir(
    async ({ path: tempDirPath }) => {
      await useTextFileDirectoryCache(
        new TextFileDirectoryCache({
          directoryPath: tempDirPath,
        }),
      );
    },
    { unsafeCleanup: true },
  );
}

describe("TextFileDirectoryCache", () => {
  it("get (miss)", async ({ expect }) =>
    withTextFileDirectoryCache(async (textFileCache) => {
      expect(
        (await textFileCache.get("testkey")).unsafeCoerce().isNothing(),
      ).toBe(true);
    }));

  it("get (hit)", async ({ expect }) =>
    withTextFileDirectoryCache(async (textFileCache) => {
      await textFileCache.set("testkey", "testvalue");
      const actualValue = (await textFileCache.get("testkey"))
        .unsafeCoerce()
        .unsafeCoerce();
      expect(actualValue).toStrictEqual("testvalue");
    }));

  it("set", async ({ expect }) =>
    withTextFileDirectoryCache(async (textFileCache) => {
      await textFileCache.set("testkey", "testvalue");
    }));
});
