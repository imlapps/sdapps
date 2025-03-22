from pathlib import Path

import pytest
from pypdf import PdfReader

from towndex_etl.models import MeetingMinutes
from towndex_etl.models.types import NonBlankString as ModelPrompt


@pytest.fixture(scope="session")
def meeting_minutes(meeting_minutes_directory_path: Path) -> MeetingMinutes:
    """Return a MeetingMinutes."""

    meeting_minutes_file_path = next(iter(meeting_minutes_directory_path.glob("*.pdf")))

    return MeetingMinutes(
        id=meeting_minutes_file_path.stem,
        minutes="".join(
            [
                page.extract_text().strip()
                for page in PdfReader(meeting_minutes_file_path).pages
            ]
        ),
    )


@pytest.fixture(scope="session")
def meeting_minutes_directory_path(test_directory_path: Path) -> Path:
    """Return the directory path for test meeting minutes."""

    meeting_minutes_directory_path = test_directory_path / "meeting_minutes"

    if meeting_minutes_directory_path.exists():
        return meeting_minutes_directory_path

    pytest.skip(reason="directory path for test minutes files does not exist.")


@pytest.fixture(scope="session")
def openai_model_prompt(openai_model_prompt_file_path: Path) -> ModelPrompt:
    """Return an OpenAI's model's prompt."""

    return openai_model_prompt_file_path.read_text().strip()


@pytest.fixture(scope="session")
def openai_model_prompt_file_path(test_directory_path: Path) -> Path:
    """Return the path for an OpenAI model's prompt."""

    openai_model_prompt_file_path = (
        test_directory_path / "openai_meeting_minutes_jsonld_prompt.txt"
    )

    if openai_model_prompt_file_path.exists():
        return openai_model_prompt_file_path

    pytest.skip(reason="the path containing the OpenAI model's prompt does not exist.")


@pytest.fixture(scope="session")
def test_directory_path() -> Path:
    """Return the directory path for test datasets."""

    return Path(__file__).parent.parent.absolute() / "data" / "test"
