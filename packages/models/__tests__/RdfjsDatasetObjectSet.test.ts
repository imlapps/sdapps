import { describe } from "vitest";
import { $RdfjsDatasetObjectSet } from "../src/generated.js";
import { behavesLikeTestObjectSet } from "./behavesLikeTestObjectSet.js";
import { behavesLikeTowndexObjectSet } from "./behavesLikeTowndexObjectSet.js";
import { testData } from "./testData.js";
import { towndexData } from "./towndexData.js";

describe("RdfjsDatasetObjectSet", () => {
  behavesLikeTowndexObjectSet(
    new $RdfjsDatasetObjectSet({ dataset: towndexData.dataset }),
  );

  behavesLikeTestObjectSet(
    new $RdfjsDatasetObjectSet({ dataset: testData.dataset }),
  );
});
