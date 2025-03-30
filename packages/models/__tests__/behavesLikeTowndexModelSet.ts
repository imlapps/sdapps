import { it } from "vitest";
import { ModelSet } from "../src/ModelSet.js";
import { Event } from "../src/generated.js";

export function behavesLikeTowndexModelSet(modelSet: ModelSet): void {
  it("events", async ({ expect }) => {
    const events = (await modelSet.models<Event>("Event")).unsafeCoerce();
    expect(events).toHaveLength(113);
    expect(
      events.filter(
        (event) =>
          event.startDate.isJust() &&
          event.name.isJust() &&
          event.superEvent.isNothing(),
      ),
    ).toHaveLength(17);
  });

  it("event count", async ({ expect }) => {
    expect((await modelSet.modelCount("Event")).unsafeCoerce()).toEqual(113);
  });

  it("organization stubs", async ({ expect }) => {
    expect(
      (await modelSet.models("OrganizationStub")).unsafeCoerce(),
    ).toHaveLength(3);
  });

  it("organization count", async ({ expect }) => {
    expect((await modelSet.modelCount("Organization")).unsafeCoerce()).toEqual(
      3,
    );
  });

  it("person stubs", async ({ expect }) => {
    expect((await modelSet.models("PersonStub")).unsafeCoerce()).toHaveLength(
      52,
    );
  });

  it("person count", async ({ expect }) => {
    expect((await modelSet.modelCount("Person")).unsafeCoerce()).toEqual(52);
  });
}
