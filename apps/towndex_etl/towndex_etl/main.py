from models.settings import Settings

from collate_rdf import collate_rdf
from modify_graphs import modify_graphs
from parse_meeting_minutes import parse_meeting_minutes


settings = Settings()

# Functions must be run in this order
parse_meeting_minutes(
    meeting_minutes_directory_path=settings.meeting_minutes_directory_path,
    meeting_minutes_files_start_index=settings.meeting_minutes_files_start_index,
    openai_model_prompt_file_path=settings.openai_model_prompt_file_path,
    shacl_shapes_graph_file_path=settings.shacl_shapes_graph_file_path,
    shacl_validator_cache_directory_path=settings.shacl_validator_cache_directory_path,
    towndex_kg_builder_output_directory_path=settings.towndex_kg_builder_output_directory_path,
)
modify_graphs(meeting_minutes_graphs_directory_path=settings.towndex_kg_builder_output_directory_path)
collate_rdf(meeting_minutes_graphs_directory_path=settings.towndex_kg_builder_output_directory_path)


