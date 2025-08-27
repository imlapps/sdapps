import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import * as queries from "@/lib/queries";
import { describe, it } from "vitest";

describe("lastBroadcastEvent", () => {
  it("return correct result", async ({ expect }) => {
    const radioBroadcastServiceIdentifiers = (
      await testObjectSet.radioBroadcastServiceIdentifiers()
    ).unsafeCoerce();
    expect(radioBroadcastServiceIdentifiers).toHaveLength(1);

    const broadcastEvent = (
      await queries.lastBroadcastEvent({
        objectSet: testObjectSet,
        broadcastService: {
          $identifier: radioBroadcastServiceIdentifiers[0],
        },
      })
    )
      .unsafeCoerce()
      .unsafeCoerce();
    const startDate = broadcastEvent.startDate.unsafeCoerce();
    expect(startDate.getUTCDate()).toStrictEqual(26);
    expect(startDate.getUTCMonth() + 1).toStrictEqual(8);
    expect(startDate.getUTCFullYear()).toStrictEqual(2025);
  });
});
