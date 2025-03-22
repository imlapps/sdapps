from pathlib import Path
from towndex_etl.models.types import NonBlankString as ModelPrompt


def read_openai_model_prompt(*, openai_model_prompt_file_path: Path) -> ModelPrompt:
    return openai_model_prompt_file_path.read_text().strip()
