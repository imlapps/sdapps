import fs from "node:fs/promises";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";
import { z } from "zod";
import { JsonFileCache } from "../src/JsonFileCache.js";

async function withJsonFileCache(
  useJsonFileCache: (jsonFileCache: JsonFileCache<string>) => Promise<void>,
) {
  await tmp.withFile(
    async ({ path: tempFilePath }) => {
      await useJsonFileCache(
        new JsonFileCache({
          filePath: tempFilePath,
          valueSchema: z.string(),
        }),
      );
    },
    { unsafeCleanup: true },
  );
}

describe("JsonFileCache", () => {
  const expectedKey = "testkey";
  const expectedValue = "testValue";

  it("get (miss)", async ({ expect }) =>
    withJsonFileCache(async (jsonFileCache) => {
      expect(
        (await jsonFileCache.get(expectedKey)).unsafeCoerce().isNothing(),
      ).toBe(true);
    }));

  it("get (hit)", async ({ expect }) =>
    withJsonFileCache(async (jsonFileCache) => {
      await jsonFileCache.set(expectedKey, expectedValue);
      const actualValue = (await jsonFileCache.get(expectedKey))
        .unsafeCoerce()
        .unsafeCoerce();
      expect(actualValue).toEqual(expectedValue);
    }));

  it("set", async () =>
    withJsonFileCache(async (jsonFileCache) => {
      await jsonFileCache.set(expectedKey, expectedValue);
    }));

  it("set (sorting)", async ({ expect }) =>
    withJsonFileCache(async (jsonFileCache) => {
      await jsonFileCache.set("b", expectedValue);
      await jsonFileCache.set("a", expectedValue);
      await jsonFileCache.set("c", expectedValue);
      expect(
        (await fs.readFile(jsonFileCache.filePath)).toString(),
      ).toStrictEqual(
        JSON.stringify(
          {
            a: expectedValue,
            b: expectedValue,
            c: expectedValue,
          },
          undefined,
          2,
        ),
      );
    }));
});
