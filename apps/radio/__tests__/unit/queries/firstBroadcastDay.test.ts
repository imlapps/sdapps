import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import { firstBroadcastDay } from "@/lib/queries/firstBroadcastDay";
import { Maybe } from "purify-ts";
import { describe, it } from "vitest";

describe("firstBroadcastDay", () => {
  it("return correct result", async ({ expect }) => {
    const radioBroadcastServiceIdentifiers = (
      await testObjectSet.radioBroadcastServiceIdentifiers()
    ).unsafeCoerce();
    expect(radioBroadcastServiceIdentifiers).toHaveLength(1);

    const actualResult = (
      await firstBroadcastDay({
        objectSet: testObjectSet,
        broadcastService: {
          broadcastTimezone: Maybe.of("America/New_York"),
          identifier: radioBroadcastServiceIdentifiers[0],
        },
      })
    )
      .unsafeCoerce()
      .unsafeCoerce();
    expect(actualResult.day).toStrictEqual(8);
    expect(actualResult.month).toStrictEqual(8);
    expect(actualResult.year).toStrictEqual(2025);
  });
});
