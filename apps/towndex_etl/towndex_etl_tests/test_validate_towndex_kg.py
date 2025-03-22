from pathlib import Path

from towndex_etl.models import MeetingMinutes
from towndex_etl.validate_towndex_kg import validate_towndex_kg


def test_validate_towndex_kg(
    meeting_minutes: MeetingMinutes,
    openai_model_response_file_path: Path,
    shacl_shapes: Path,
    test_directory_path: Path,
) -> None:
    validate_towndex_kg(
        data_graph_path=openai_model_response_file_path,
        shapes_graph_path=shacl_shapes,
        shacl_validator_cache_directory_path=test_directory_path,
    )
    assert (
        test_directory_path / Path(meeting_minutes.id + "_validation_results.txt")
    ).exists()
