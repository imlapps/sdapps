import json
from pathlib import Path


def modify_graphs(meeting_minutes_graphs_directory_path: Path) -> None:
    """Modify the JSON-LD graphs that were obtained from the large language model."""

    for file_path in list(
        Path(__file__)
        .parent.absolute()
        .glob(str(meeting_minutes_graphs_directory_path / Path("*.jsonld")))
    ):
        minutes_graph = dict(json.load(file_path.open(encoding="utf-8")))

        if "url" in minutes_graph:
            minutes_graph["subjectOf"] = {
                "@id": minutes_graph["url"].replace(" ", "%20")
            }

        minutes_graph.pop("url", None)
        minutes_graph.pop("@context", None)  # The LLM returned a bad context

        minutes_graph["@context"] = {
            "@vocab": "http://schema.org/",
            "tdx": "http://purl.org/towndex/instance/us/ny/brunswick/",
        }

        json.dump(
            [minutes_graph],
            (
                meeting_minutes_graphs_directory_path / Path(file_path.stem + ".jsonld")
            ).open(mode="w"),
        )
