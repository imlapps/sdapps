import { it } from "vitest";
import { ModelSet } from "../src/ModelSet.js";
import { testData } from "./testData.js";

export function behavesLikeTestModelSet(modelSet: ModelSet): void {
  it("people", async ({ expect }) => {
    expect(
      (await modelSet.people()).unsafeCoerce().map((model) => model.toJson()),
    ).toEqual(testData.models.people.map((model) => model.toJson()));
  });

  it("peopleCount", async ({ expect }) => {
    expect((await modelSet.peopleCount()).unsafeCoerce()).toEqual(
      testData.models.people.length,
    );
  });
}
