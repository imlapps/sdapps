import { describe } from "vitest";
import { behavesLikeTowndexModelSet } from "./behavesLikeTowndexModelSet";
import { towndexData } from "./towndexData";

describe("RdfjsDatasetModelSet", () => {
  // behavesLikeTestModelSet(testData.rdfjsDatasetModelSet);

  behavesLikeTowndexModelSet(towndexData.rdfjsDatasetModelSet);
});
