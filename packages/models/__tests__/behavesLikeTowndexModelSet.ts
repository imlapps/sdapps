import { it } from "vitest";
import { ModelSet } from "../src/ModelSet.js";

export function behavesLikeTowndexModelSet(modelSet: ModelSet): void {
  it("organizations", async ({ expect }) => {
    expect((await modelSet.organizations()).unsafeCoerce()).toHaveLength(0);
  });

  it("organizationsCount", async ({ expect }) => {
    expect((await modelSet.organizationsCount()).unsafeCoerce()).toEqual(0);
  });

  it("people", async ({ expect }) => {
    expect((await modelSet.people()).unsafeCoerce()).toHaveLength(58);
  });

  it("peopleCount", async ({ expect }) => {
    expect((await modelSet.peopleCount()).unsafeCoerce()).toEqual(58);
  });
}
