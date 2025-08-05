import { describe } from "vitest";
import { behavesLikeTestObjectSet } from "./behavesLikeTestObjectSet.js";
import { behavesLikeTowndexObjectSet } from "./behavesLikeTowndexObjectSet.js";
import { testData } from "./testData.js";
import { towndexData } from "./towndexData.js";

describe("RdfjsDatasetObjectSet", () => {
  behavesLikeTowndexObjectSet(towndexData.rdfjsDatasetObjectSet);

  behavesLikeTestObjectSet(testData.rdfjsDatasetObjectSet);
});
