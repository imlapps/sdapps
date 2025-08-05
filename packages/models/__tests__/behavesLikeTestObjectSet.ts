import { Either } from "purify-ts";
import { it } from "vitest";
import { $ObjectSet } from "../src/generated.js";
import { testData } from "./testData.js";

export function behavesLikeTestObjectSet(objectSet: $ObjectSet): void {
  it("persons", async ({ expect }) => {
    expect(
      Either.rights(await objectSet.people()).map((model) => model.toJson()),
    ).toEqual(testData.models.people.map((model) => model.toJson()));
  });

  it("person count", async ({ expect }) => {
    expect((await objectSet.peopleCount()).unsafeCoerce()).toEqual(
      testData.models.people.length,
    );
  });
}
