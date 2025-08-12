import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import { lastBroadcastDay } from "@/lib/queries/lastBroadcastDay";
import { Maybe } from "purify-ts";
import { describe, it } from "vitest";

describe("lastBroadcastDay", () => {
  it("return correct result", async ({ expect }) => {
    const radioBroadcastServiceIdentifiers = (
      await testObjectSet.radioBroadcastServiceIdentifiers()
    ).unsafeCoerce();
    expect(radioBroadcastServiceIdentifiers).toHaveLength(1);

    const actualResult = (
      await lastBroadcastDay({
        objectSet: testObjectSet,
        broadcastService: {
          broadcastTimezone: Maybe.of("America/New_York"),
          identifier: radioBroadcastServiceIdentifiers[0],
        },
      })
    )
      .unsafeCoerce()
      .unsafeCoerce();
    expect(actualResult.day).toStrictEqual(10);
    expect(actualResult.month).toStrictEqual(8);
    expect(actualResult.year).toStrictEqual(2025);
  });
});
