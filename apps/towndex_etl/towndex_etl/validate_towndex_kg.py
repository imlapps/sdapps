from pathlib import Path

from pyshacl import validate


def validate_towndex_kg(
    *,
    data_graph_path: Path,
    shapes_graph_path: Path,
    shacl_validator_cache_directory_path: Path,
) -> None:
    """Validates a Towndex KG against a SHACL graph and caches a validation report."""

    _, _, validation_results = validate(
        data_graph=str(data_graph_path),
        shacl_graph=str(shapes_graph_path),
    )

    shacl_validator_cache_directory_path.mkdir(parents=True, exist_ok=True)

    (
        shacl_validator_cache_directory_path
        / Path(data_graph_path.stem + "_validation_results.txt")
    ).write_text(validation_results)
