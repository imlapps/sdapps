from collections.abc import Iterable
from pathlib import Path

from pypdf import PdfReader

from models import MeetingMinutes


def read_meeting_minutes(
    *, meeting_minutes_directory_path: Path
) -> Iterable[MeetingMinutes]:
    """Read and yield meeting minutes from storage."""

    if not meeting_minutes_directory_path.exists():
        return

    for meeting_minutes_file_path in meeting_minutes_directory_path.glob("*.pdf"):
        yield MeetingMinutes(
            id=meeting_minutes_file_path.stem,
            minutes="".join(
                [
                    page.extract_text().strip()
                    for page in PdfReader(meeting_minutes_file_path).pages
                ]
            ),
        )
