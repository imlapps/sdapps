import json
from pathlib import Path

from rdflib import RDF, Dataset, Graph, Literal, Namespace, URIRef
from rdflib.plugins.stores.memory import Memory

from towndex_etl.models.schema_class_relationships import SCHEMA_CLASS_RELATIONSHIPS


def collate_rdf(meeting_minutes_graphs_directory_path: Path) -> None:
    """Read in RDF graphs and collate them in an RDF dataset."""

    store = Memory()
    towndex_dataset = Dataset(store=store)

    tob = Namespace("https://townofbrunswick.org/files/")

    towndex_dataset.bind("tob", tob)
    towndex_dataset.bind(
        "tdx", Namespace("http://purl.org/towndex/instance/us/ny/brunswick/")
    )
    towndex_dataset.bind("rdfs", Namespace("http://www.w3.org/2000/01/rdf-schema#"))
    towndex_dataset.bind("sdo", Namespace("http://schema.org/"))

    for schema_type in SCHEMA_CLASS_RELATIONSHIPS:
        towndex_dataset.add(
            (
                URIRef("http://schema.org/" + schema_type),
                URIRef("http://www.w3.org/2000/01/rdf-schema#subClassOf"),
                URIRef("http://schema.org/" + SCHEMA_CLASS_RELATIONSHIPS[schema_type]),
            )
        )

    for meeting_file_path in list(
        Path(__file__)
        .parent.absolute()
        .glob(str(meeting_minutes_graphs_directory_path / Path("*.jsonld")))
    ):
        g = towndex_dataset.graph(
            URIRef("https://townofbrunswick.org/files/" + meeting_file_path.stem)
        )
        meeting_minutes_graph = Graph()
        meeting_minutes_graph.parse(meeting_file_path)
        for triples in meeting_minutes_graph:
            g.add(triples)

        minutes_file = json.load(meeting_file_path.open(encoding="utf-8"))
        document_graph = [
            (
                URIRef(minutes_file[0]["url"].replace(" ", "%20")),
                RDF.type,
                URIRef("http://schema.org/TextObject"),
            ),
            (
                URIRef(minutes_file[0]["url"].replace(" ", "%20")),
                URIRef("http://schema.org/url"),
                URIRef(minutes_file[0]["url"].replace(" ", "%20")),
            ),
            (
                URIRef(minutes_file[0]["url"].replace(" ", "%20")),
                URIRef("http://schema.org/about"),
                URIRef(minutes_file[1]["@id"]),
            ),
            (
                URIRef(minutes_file[0]["url"].replace(" ", "%20")),
                URIRef("http://schema.org/name"),
                Literal(minutes_file[0]["url"][len(tob) :][:-4]),
            ),
        ]
        for triples in document_graph:
            g.add(triples)

    towndex_dataset.serialize(
        format="trig", destination=Path("./us/ny/brunswick/minutes.trig")
    )
