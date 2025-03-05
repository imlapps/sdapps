import { describe } from "vitest";
import { behavesLikeModelSet } from "./behavesLikeModelSet";
import { testData } from "./testData";

describe("RdfjsDatasetModelSet", () => {
  behavesLikeModelSet(testData.rdfjsDatasetModelSet);
});
