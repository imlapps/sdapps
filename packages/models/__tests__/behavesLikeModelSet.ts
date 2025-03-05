import { it } from "vitest";
import { ModelSet } from "../src/ModelSet";
import { testData } from "./testData.js";

export function behavesLikeModelSet(modelSet: ModelSet): void {
  it("should get people", async ({ expect }) => {
    expect(testData.models.people.map((model) => model.toJson())).toEqual(
      (await modelSet.people()).unsafeCoerce().map((model) => model.toJson()),
    );
  });
}
