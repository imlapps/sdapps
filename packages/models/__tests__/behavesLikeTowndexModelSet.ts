import { it } from "vitest";
import { ModelSet } from "../src/ModelSet.js";

export function behavesLikeTowndexModelSet(modelSet: ModelSet): void {
  it("organization stubs", async ({ expect }) => {
    expect(
      (await modelSet.models("OrganizationStub")).unsafeCoerce(),
    ).toHaveLength(0);
  });

  it("organization count", async ({ expect }) => {
    expect((await modelSet.modelCount("Organization")).unsafeCoerce()).toEqual(
      0,
    );
  });

  it("person stubs", async ({ expect }) => {
    expect((await modelSet.models("PersonStub")).unsafeCoerce()).toHaveLength(
      58,
    );
  });

  it("person count", async ({ expect }) => {
    expect((await modelSet.modelCount("Person")).unsafeCoerce()).toEqual(58);
  });
}
