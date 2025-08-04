import { WikipediaEntityRecognizer } from "../../src/WikipediaEntityRecognizer.js";

export const wikipediaEntities: Record<
  string,
  {
    recognizerInput: Parameters<WikipediaEntityRecognizer["recognize"]>[0];
    entities: readonly {
      readonly wikidata: {
        readonly id: string;
        readonly name: string;
      };
      readonly wikipedia: {
        readonly urlTitle: string;
      }
    }[];
  }
> = {
  singleEntityInFewShotExamples: {
    recognizerInput: { name: "Jean Philippe Rameau", role: "composer" },
    entities: [
      {
        wikidata: {
          id: "Q1145",
          name: "Jean-Philippe Rameau",
        },
        wikipedia: {
          urlTitle: "Jean-Philippe_Rameau",
        }
      },
    ],
  },

  singleEntityNotInFewShotExamples: {
    recognizerInput: { name: "George Frideric Handel", role: "composer" },
    entities: [
      {
        wikidata: {
          id: "Q7302",
          name: "George Frideric Handel"
        },
        wikipedia: {
          urlTitle: "George_Frideric_Handel"
        }
      },
    ],
  },

  singleEntityNonExtant: {
    recognizerInput: { name: "Phoenicia Hartsmuth", role: "composer" },
    entities: [],
  },

  multipleEntitiesInFewShotExamples: {
    recognizerInput: {
      name: "Vienna Phil Orch,Levine, James",
      role: "artist",
    },
    entities: [
      {
        wikidata: {
          id: "Q336388",
          name: "James Levine",
        },
        wikipedia: {
          urlTitle: "James_Levine",
        }
      },
      {
        wikidata: {
          id: "Q154685",
          name: "Vienna Philharmonic"
        },
        wikipedia: {
          urlTitle: "Vienna_Philharmonic",
        }
      },
    ],
  },

  multipleEntitiesNotInFewShotExamples: {
    recognizerInput: {
      name: "Bylsma, Anner,Lamon, Jean,Tafelmusik",
      role: "artist",
    },
    entities: [
      {
        wikidata: {
          id: "Q566461",
          name: "Anner Byslma",
        },
        wikipedia: {
          urlTitle: "Anner_Bylsma",
        }
      },
      {
        wikidata: {
          id: "Q539291",
          name: "Jeanne Lamon",
        },
        wikipedia: {
          urlTitle: "Jeanne_Lamon",
        }
      },
      {
        wikidata: {
          id: "Q218658",
          name: "Tafelmusik Baroque Orchestra"
        },
        wikipedia: {
          urlTitle: "Tafelmusik_Baroque_Orchestra",
        }
      },
    ],
  },

  multipleEntitiesSomeNonExistent: {
    recognizerInput: {
      name: "Vienna Philharmonic,Phoenicia Hartsmuth",
      role: "artist",
    },
    entities: [
      {
        wikidataId: "Q154685",
        wikipediaUrlTitle: "Vienna_Philharmonic",
      },
    ],
  },
};
