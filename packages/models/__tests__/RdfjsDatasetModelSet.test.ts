import { describe } from "vitest";
import { behavesLikeTestModelSet } from "./behavesLikeTestModelSet.js";
import { behavesLikeTowndexModelSet } from "./behavesLikeTowndexModelSet.js";
import { testData } from "./testData.js";
import { towndexData } from "./towndexData.js";

describe("RdfjsDatasetModelSet", () => {
  behavesLikeTowndexModelSet(towndexData.rdfjsDatasetModelSet);

  behavesLikeTestModelSet(testData.rdfjsDatasetModelSet);
});
