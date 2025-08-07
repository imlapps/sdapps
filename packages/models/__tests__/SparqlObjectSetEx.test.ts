import { describe } from "vitest";
import { SparqlObjectSetEx } from "../src/SparqlObjectSetEx.js";
import { radioData } from "./radioData.js";
import { testSparqlClient } from "./testSparqlClient.js";

describe("SparqlObjectSetEx", async () => {
  const sut = new SparqlObjectSetEx({
    sparqlClient: testSparqlClient(radioData.dataset),
  });

  // it("radio episode identifiers by date", async ({expect}) => {
  //   expect(sut.radioEpisodeIdentifiers({where: {date: }}))
  // });
});
