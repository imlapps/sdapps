from pathlib import Path
from towndex_etl.models.types import NonBlankString as ModelResponse
from towndex_etl.read_openai_model_prompt import read_openai_model_prompt


def test_read_openai_model_prompt(
    openai_model_prompt_file_path: Path, openai_model_prompt: ModelResponse
) -> None:
    """Test that read_openai_model_prompt successfully reads an OpenAI model's prompt from storage."""

    assert (
        read_openai_model_prompt(
            openai_model_prompt_file_path=openai_model_prompt_file_path
        )
        == openai_model_prompt
    )
