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

    # Add class hierarchy statements
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
        dateset_graph = towndex_dataset.graph(
            URIRef("https://townofbrunswick.org/files/" + meeting_file_path.stem)
        )
        meeting_minutes_graph = Graph()
        meeting_minutes_graph.parse(meeting_file_path)
        for triples in meeting_minutes_graph:
            dateset_graph.add(triples)

        # Add a TextObject graph to the dataset
        minutes_file = json.load(meeting_file_path.open(encoding="utf-8"))
        document_url = minutes_file[0]["subjectOf"]["@id"]
        text_object_graph = [
            (
                URIRef(document_url),
                RDF.type,
                URIRef("http://schema.org/TextObject"),
            ),
            (
                URIRef(document_url),
                URIRef("http://schema.org/url"),
                URIRef(document_url),
            ),
            (
                URIRef(document_url),
                URIRef("http://schema.org/about"),
                URIRef(minutes_file[0]["@id"]),
            ),
            (
                URIRef(document_url),
                URIRef("http://schema.org/name"),
                Literal(str(document_url).replace("%20", " ")[len(tob) :][:-4]),
            ),
        ]
        for triples in text_object_graph:
            dateset_graph.add(triples)

    towndex_dataset.serialize(
        format="trig", destination=Path("./us/ny/brunswick/minutes.trig")
    )
