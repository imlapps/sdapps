import * as N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";

const dataFactory = N3.DataFactory;
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
      identifier: dataFactory.namedNode(`http://example.com/person/${index}`),
      givenName: "Person",
      familyName: index.toString(),
      name: `Person ${index}`,
    }),
);

for (const person of people) {
  person.toRdf({ mutateGraph, resourceSet });
}

export const testData = {
  dataset,
  models: {
    people,
  },
};
