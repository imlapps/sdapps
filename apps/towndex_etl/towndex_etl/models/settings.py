from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

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
    openai_model_prompt_file_name: Path = Path("towndex_etl_openai_model_prompt.txt")
    output_directory_path: Path = DATA_DIRECTORY_PATH / "output"
    shacl_shapes_graph_file_path: Path = (
        Path(__file__).parent.absolute() / "towndex.etl.shapes.ttl"
    )
    meeting_minutes_files_start_index: int = Field(default=0)

    @field_validator("openai_model_prompt_file_name", mode="before")
    @classmethod
    def convert_prompt_file_name_to_file_path(
        cls, openai_model_prompt_file_name: str
    ) -> Path:
        """Convert the file name of an OpenAI model prompt to a Path."""

        return Path(openai_model_prompt_file_name)

    @property
    def meeting_minutes_directory_path(self) -> Path:
        """The Path of the directory that contains Brunswick Town Board's meeting minutes."""

        return self.input_directory_path / "meeting_minutes_directory_path"

    @property
    def openai_model_prompt_file_path(self) -> Path:
        """The Path of an OpenAI model's prompt."""

        return (
            self.input_directory_path
            / "openai_prompts"
            / self.openai_model_prompt_file_name
        )

    @property
    def towndex_kg_builder_output_directory_path(self) -> Path:
        """The Path of the directory that contains Schema.org JSON-LD graphs from TowndexKgBuilder."""

        return self.output_directory_path / "towndex_kg_builder"

    @property
    def shacl_validator_cache_directory_path(self) -> Path:
        """The Path of the directory that contains the validation report of an RDF graph."""

        return self.cache_directory_path / "shacl_validator"
