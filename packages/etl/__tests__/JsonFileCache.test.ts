import { EitherAsync } from "purify-ts";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";
import { z } from "zod";
import { JsonFileCache } from "../src/JsonFileCache.js";

const schema = z.object({
  t: z.number(),
});

async function withJsonFileCache(
  useJsonFileCache: (
    jsonFileCache: JsonFileCache<z.infer<typeof schema>>,
  ) => Promise<void>,
) {
  await tmp.withDir(
    async ({ path: tempDirPath }) => {
      await useJsonFileCache(
        new JsonFileCache({
          directoryPath: tempDirPath,
          parseJson: async (json) => EitherAsync(() => schema.parseAsync(json)),
        }),
      );
    },
    { unsafeCleanup: true },
  );
}

describe("JsonFileCache", () => {
  it("get (miss)", async ({ expect }) =>
    withJsonFileCache(async (jsonFileCache) => {
      expect((await jsonFileCache.get("test")).unsafeCoerce().isNothing()).toBe(
        true,
      );
    }));

  it("get (hit)", async ({ expect }) =>
    withJsonFileCache(async (jsonFileCache) => {
      const expectedValue: z.infer<typeof schema> = { t: 1 };
      await jsonFileCache.set("test", expectedValue);
      const actualValue = (await jsonFileCache.get("test"))
        .unsafeCoerce()
        .unsafeCoerce();
      expect(actualValue).toEqual(expectedValue);
    }));

  it("set", async ({ expect }) =>
    withJsonFileCache(async (jsonFileCache) => {
      await jsonFileCache.set("test", { t: 1 });
    }));
});
