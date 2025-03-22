from pathlib import Path

from pydantic import SecretStr, Field 
from pydantic_settings import BaseSettings, SettingsConfigDict

from typing import Annotated 

CONFIG_DIRECTORY_PATH = Path(__file__).parent.parent.parent.absolute()
DATA_DIRECTORY_PATH = Path(__file__).parent.parent.parent.absolute() / "data"


class Settings(BaseSettings):
    """Pydantic BaseSettings for towndex-etl."""

    cache_directory_path: Path = DATA_DIRECTORY_PATH / "cache"
    input_directory_path: Path = DATA_DIRECTORY_PATH / "input"
    model_config = SettingsConfigDict(
        env_file=(
            CONFIG_DIRECTORY_PATH / ".env.local",
            CONFIG_DIRECTORY_PATH / ".env.secret",
        ),
        extra="ignore",
        env_file_encoding="utf-8",
        validate_default=False,
    )
    openai_api_key: SecretStr | None = None
    output_directory_path: Path = DATA_DIRECTORY_PATH / "output"
    shacl_shapes_graph_path: Path = (
        Path(__file__).parent.absolute() / "towndex.etl.shapes.ttl"
    )
    meeting_minutes_start_index: Annotated[int, Field(default=0)]
    
    @property
    def meeting_minutes_path(self) -> Path:
        """The Path of the directory that contains Brunswick Town Board's meeting minutes."""

        return self.input_directory_path / "meeting_minutes_path"

    @property
    def openai_prompts_path(self) -> Path:
        """The Path of the directory that contains an OpenAI model's prompts."""

        return self.input_directory_path / "openai_prompts"

    @property
    def towndex_kg_builder_cache_directory_path(self) -> Path:
        """The Path of the directory that contains cached schema.org JSON-LD responses."""

        return self.cache_directory_path / "towndex_kg_builder"

    @property
    def shacl_validator_cache_directory_path(self) -> Path:
        """The Path of the directory that contains the validation report of an RDF graph."""

        return self.cache_directory_path / "shacl_validator"
