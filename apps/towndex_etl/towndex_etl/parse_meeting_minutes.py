from pathlib import Path

from towndex_etl.read_meeting_minutes import read_meeting_minutes
from towndex_etl.towndex_kg_builder import TowndexKgBuilder
from towndex_etl.validate_towndex_kg import validate_towndex_kg


def parse_meeting_minutes(  # noqa: PLR0913
    meeting_minutes_directory_path: Path,
    meeting_minutes_files_start_index: int,
    openai_model_prompt_file_path: Path,
    shacl_shapes_graph_file_path: Path,
    shacl_validator_cache_directory_path: Path,
    towndex_kg_builder_output_directory_path: Path,
) -> None:
    """Run a pipeline consisting of TowndexKgBuilder and validate_towndex_kg."""

    minutes_files = list(
        read_meeting_minutes(
            meeting_minutes_directory_path=meeting_minutes_directory_path
        )
    )

    if minutes_files:
        towndex_kg_builder = TowndexKgBuilder(
            towndex_kg_builder_output_directory_path=towndex_kg_builder_output_directory_path,
            openai_model_prompt_file_path=openai_model_prompt_file_path,
        )

        minutes_files_index = meeting_minutes_files_start_index
        while True:
            if minutes_files_index == len(minutes_files):
                break

            # TowndexKgPipeline
            validate_towndex_kg(
                data_graph_path=towndex_kg_builder.build_graph(
                    meeting_minutes=minutes_files[minutes_files_index]
                ),
                shapes_graph_path=shacl_shapes_graph_file_path,
                shacl_validator_cache_directory_path=shacl_validator_cache_directory_path,
            )

            while True:
                user_response = int(
                    input(
                        f"Completed extraction for meeting minutes with document ID: {minutes_files[minutes_files_index].id}.\n\
                         Evaluate SHACL validation report and enter a number to continue:\n\n[1] Extract next meeting minutes\n[2] Re-run pipeline\n\nAnswer:"
                    )
                )
                match user_response:
                    case 1:
                        minutes_files_index = minutes_files_index + 1
                        break
                    case 2:
                        break
                    case _:
                        pass
