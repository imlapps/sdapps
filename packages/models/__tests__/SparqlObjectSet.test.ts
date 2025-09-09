import { describe } from "vitest";
import { $SparqlObjectSet } from "../src/generated.js";
import { behavesLikeTestObjectSet } from "./behavesLikeTestObjectSet.js";
import { behavesLikeTowndexObjectSet } from "./behavesLikeTowndexObjectSet.js";
import { testData } from "./testData.js";
import { testSparqlClient } from "./testSparqlClient.js";
import { towndexData } from "./towndexData.js";

describe("SparqlObjectSet", () => {
  behavesLikeTowndexObjectSet(
    new $SparqlObjectSet({
      sparqlClient: testSparqlClient(towndexData.dataset),
    }),
  );

  behavesLikeTestObjectSet(
    new $SparqlObjectSet({ sparqlClient: testSparqlClient(testData.dataset) }),
  );
});
