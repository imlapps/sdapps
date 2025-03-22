from pathlib import Path

from models.types import NonBlankString as ModelPrompt


def read_openai_model_prompt(*, openai_model_prompt_file_path: Path) -> ModelPrompt:
    """Return the prompt for an OpenAI model."""

    if not openai_model_prompt_file_path.exists():
        return
    
    return openai_model_prompt_file_path.read_text().strip()
