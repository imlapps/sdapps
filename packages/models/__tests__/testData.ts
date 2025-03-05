import * as N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { RdfjsDatasetModelSet } from "../src/RdfjsDatasetModelSet";

const dataset = new N3.Store();
const mutateGraph = N3.DataFactory.defaultGraph();
const resourceSet = new MutableResourceSet({
  dataFactory: N3.DataFactory,
  dataset,
});

import { Person } from "../src";

const people = [...new Array(3).keys()].map(
  (_, index) =>
    new Person({
      name: `Person ${index}`,
    }),
);

people.forEach((person) => person.toRdf({ mutateGraph, resourceSet }));

export const testData = {
  dataset,
  models: {
    people,
  },
  rdfjsDatasetModelSet: new RdfjsDatasetModelSet({ dataset }),
};
