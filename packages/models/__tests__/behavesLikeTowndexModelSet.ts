import { it } from "vitest";
import { ModelSet } from "../src/ModelSet.js";

export function behavesLikeTowndexModelSet(modelSet: ModelSet): void {
  it("should get people", async ({ expect }) => {
    const people = (await modelSet.people()).unsafeCoerce();
    expect(people).toHaveLength(58);
  });
}
