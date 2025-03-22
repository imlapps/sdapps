from pypdf import PdfReader
import pytest
from pathlib import Path
from towndex_etl.meeting_minutes_reader import MeetingMinutesReader
from towndex_etl.models import MeetingMinutes


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
def meeting_minutes_reader(
    meeting_minutes_directory_path: Path,
) -> MeetingMinutesReader:
    """Return a MeetingMinutesReader."""

    return MeetingMinutesReader(
        meeting_minutes_directory_path=meeting_minutes_directory_path
    )


@pytest.fixture(scope="session")
def test_directory_path() -> Path:
    """Return the directory path for test datasets."""

    return Path(__file__).parent.parent.absolute() / "data" / "test"
