import { EitherAsync } from "purify-ts";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";
import { z } from "zod";
import { JsonFileDirectoryCache } from "../src/JsonFileDirectoryCache.js";

const schema = z.object({
  t: z.number(),
});

async function withJsonFileDirectoryCache(
  useJsonFileDirectoryCache: (
    jsonFileDirectoryCache: JsonFileDirectoryCache<z.infer<typeof schema>>,
  ) => Promise<void>,
) {
  await tmp.withDir(
    async ({ path: tempDirPath }) => {
      await useJsonFileDirectoryCache(
        new JsonFileDirectoryCache({
          directoryPath: tempDirPath,
          parseJson: async (json) => EitherAsync(() => schema.parseAsync(json)),
        }),
      );
    },
    { unsafeCleanup: true },
  );
}

describe("JsonFileDirectoryCache", () => {
  it("get (miss)", async ({ expect }) =>
    withJsonFileDirectoryCache(async (jsonFileDirectoryCache) => {
      expect(
        (await jsonFileDirectoryCache.get("test")).unsafeCoerce().isNothing(),
      ).toBe(true);
    }));

  it("get (hit)", async ({ expect }) =>
    withJsonFileDirectoryCache(async (jsonFileDirectoryCache) => {
      const expectedValue: z.infer<typeof schema> = { t: 1 };
      await jsonFileDirectoryCache.set("test", expectedValue);
      const actualValue = (await jsonFileDirectoryCache.get("test"))
        .unsafeCoerce()
        .unsafeCoerce();
      expect(actualValue).toEqual(expectedValue);
    }));

  it("set", async ({ expect }) =>
    withJsonFileDirectoryCache(async (jsonFileDirectoryCache) => {
      await jsonFileDirectoryCache.set("test", { t: 1 });
    }));
});
