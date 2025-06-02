import {
  DataFactory,
  Quad_Graph,
  Quad_Object,
  Quad_Predicate,
  Quad_Subject,
  Term,
} from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
import * as N3 from "n3";

const dataFactory: DataFactory = N3.DataFactory;

export function deepCopyRdfTerm<TermT extends Term>(term: TermT): TermT {
  switch (term.termType) {
    case "BlankNode":
      return dataFactory.blankNode(term.value) as TermT;
    case "DefaultGraph":
      return dataFactory.defaultGraph() as TermT;
    case "Literal":
      if (term.datatype.equals(xsd.string)) {
        if (term.language) {
          return dataFactory.literal(term.value, term.language) as TermT;
        }
        return dataFactory.literal(term.value) as TermT;
      }
      return dataFactory.literal(term.value, term.datatype) as TermT;
    case "NamedNode":
      return dataFactory.namedNode(term.value) as TermT;
    case "Quad":
      return dataFactory.quad(
        deepCopyRdfTerm(term.subject) as Quad_Subject,
        deepCopyRdfTerm(term.predicate) as Quad_Predicate,
        deepCopyRdfTerm(term.object) as Quad_Object,
        deepCopyRdfTerm(term.graph) as Quad_Graph,
      ) as TermT;
    case "Variable":
      throw new RangeError(`${term.termType} term not supported`);
  }
}
