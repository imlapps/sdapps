import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import { lastRadioBroadcastServiceBroadcastEvent } from "@/lib/queries/lastRadioBroadcastServiceBroadcastEvent";
import { describe, it } from "vitest";

describe("lastRadioBroadcastServiceBroadcastEvent", () => {
  it("return correct result", async ({ expect }) => {
    const radioBroadcastServiceIdentifiers = (
      await testObjectSet.radioBroadcastServiceIdentifiers()
    ).unsafeCoerce();
    expect(radioBroadcastServiceIdentifiers).toHaveLength(1);

    const actualResult = (
      await lastRadioBroadcastServiceBroadcastEvent({
        objectSet: testObjectSet,
        radioBroadcastService: {
          identifier: radioBroadcastServiceIdentifiers[0],
        },
      })
    )
      .unsafeCoerce()
      .unsafeCoerce();
    expect(actualResult.identifier.value).toStrictEqual(
      "https://api.composer.nprstations.org/v1/episode/677ef8a09ea18c2245c6142b/playlist/track/688cedb16c98f8b3a8c3d82f/broadcast-event",
    );
  });
});
