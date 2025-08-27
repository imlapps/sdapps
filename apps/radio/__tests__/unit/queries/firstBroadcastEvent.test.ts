import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import * as queries from "@/lib/queries";
import { describe, it } from "vitest";

describe("firstBroadcastEvent", () => {
  it("return correct result", async ({ expect }) => {
    const radioBroadcastServiceIdentifiers = (
      await testObjectSet.radioBroadcastServiceIdentifiers()
    ).unsafeCoerce();
    expect(radioBroadcastServiceIdentifiers).toHaveLength(1);

    const broadcastEvent = (
      await queries.firstBroadcastEvent({
        objectSet: testObjectSet,
        broadcastService: {
          $identifier: radioBroadcastServiceIdentifiers[0],
        },
      })
    )
      .unsafeCoerce()
      .unsafeCoerce();
    const startDate = broadcastEvent.startDate.unsafeCoerce();
    expect(startDate.getUTCDate()).toStrictEqual(8);
    expect(startDate.getUTCMonth() + 1).toStrictEqual(8);
    expect(startDate.getUTCFullYear()).toStrictEqual(2025);
  });
});
