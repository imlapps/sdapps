import { Either } from "purify-ts";
import { it } from "vitest";
import { $ObjectSet } from "../src/generated.js";

export function behavesLikeTowndexObjectSet(objectSet: $ObjectSet): void {
  it("events", async ({ expect }) => {
    const events = Either.rights(await objectSet.events());
    expect(events).toHaveLength(34);
    expect(
      events.filter(
        (event) =>
          event.startDate.isJust() &&
          event.name.isJust() &&
          event.superEvent.isNothing(),
      ),
    ).toHaveLength(4);
  });

  it("event count", async ({ expect }) => {
    expect((await objectSet.eventsCount()).unsafeCoerce()).toEqual(34);
  });

  it("organization stubs", async ({ expect }) => {
    const _actual = await objectSet.organizationStubs();
    expect(Either.rights(await objectSet.organizationStubs())).toHaveLength(2);
  });

  it("organization count", async ({ expect }) => {
    expect((await objectSet.organizationsCount()).unsafeCoerce()).toEqual(2);
  });

  it("person stubs", async ({ expect }) => {
    expect(Either.rights(await objectSet.personStubs())).toHaveLength(37);
  });

  it("person count", async ({ expect }) => {
    expect((await objectSet.peopleCount()).unsafeCoerce()).toEqual(37);
  });
}
