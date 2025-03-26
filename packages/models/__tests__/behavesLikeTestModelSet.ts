import { it } from "vitest";
import { ModelSet } from "../src/ModelSet.js";
import { testData } from "./testData.js";

export function behavesLikeTestModelSet(modelSet: ModelSet): void {
  it("persons", async ({ expect }) => {
    expect(
      (await modelSet.models("Person"))
        .unsafeCoerce()
        .map((model) => model.toJson()),
    ).toEqual(testData.models.people.map((model) => model.toJson()));
  });

  it("person count", async ({ expect }) => {
    expect((await modelSet.modelCount("Person")).unsafeCoerce()).toEqual(
      testData.models.people.length,
    );
  });
}
