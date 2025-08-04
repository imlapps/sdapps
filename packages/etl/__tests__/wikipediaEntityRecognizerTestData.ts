import { WikipediaEntityRecognizer } from "../src/WikipediaEntityRecognizer.js";

export const wikipediaEntityRecognizerTestData: Record<
  string,
  {
    input: Parameters<WikipediaEntityRecognizer["resolve"]>[0];
    expectedOutput: readonly {
      readonly wikidataId: string;
      readonly wikipediaUrlTitle: string;
    }[];
  }
> = {
  singleEntityInFewShotExamples: {
    input: { name: "Jean Philippe Rameau", role: "composer" },
    expectedOutput: [
      {
        wikidataId: "Q1145",
        wikipediaUrlTitle: "Jean-Philippe_Rameau",
      },
    ],
  },

  singleEntityNotInFewShotExamples: {
    input: { name: "George Frideric Handel", role: "composer" },
    expectedOutput: [
      {
        wikidataId: "Q7302",
        wikipediaUrlTitle: "George_Frideric_Handel",
      },
    ],
  },

  singleEntityNonExtant: {
    input: { name: "Phoenicia Hartsmuth", role: "composer" },
    expectedOutput: [],
  },

  multipleEntitiesInFewShotExamples: {
    input: {
      name: "Vienna Phil Orch,Levine, James",
      role: "artist",
    },
    expectedOutput: [
      {
        wikidataId: "Q336388",
        wikipediaUrlTitle: "James_Levine",
      },
      {
        wikidataId: "Q154685",
        wikipediaUrlTitle: "Vienna_Philharmonic",
      },
    ],
  },

  multipleEntitiesNotInFewShotExamples: {
    input: {
      name: "Bylsma, Anner,Lamon, Jean,Tafelmusik",
      role: "artist",
    },
    expectedOutput: [
      {
        wikidataId: "Q566461",
        wikipediaUrlTitle: "Anner_Bylsma",
      },
      {
        wikidataId: "Q539291",
        wikipediaUrlTitle: "Jeanne_Lamon",
      },
      {
        wikidataId: "Q218658",
        wikipediaUrlTitle: "Tafelmusik_Baroque_Orchestra",
      },
    ],
  },

  multipleEntitiesSomeNonExistent: {
    input: {
      name: "Vienna Philharmonic,Phoenicia Hartsmuth",
      role: "artist",
    },
    expectedOutput: [
      {
        wikidataId: "Q154685",
        wikipediaUrlTitle: "Vienna_Philharmonic",
      },
    ],
  },
};
