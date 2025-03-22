from collections.abc import Iterable
from pathlib import Path
from pypdf import PdfReader
from towndex_etl.models import MeetingMinutes


class MeetingMinutesReader:
    def __init__(self, *, meeting_minutes_directory_path: Path) -> None:
        self.__meeting_minutes_directory_path = meeting_minutes_directory_path

    def read(self) -> Iterable[MeetingMinutes]:
        """Read and yield meeting minutes from storage."""

        if not self.__meeting_minutes_directory_path.exists():
            return

        for meeting_minutes_file_path in self.__meeting_minutes_directory_path.glob(
            "*.pdf"
        ):
            yield MeetingMinutes(
                id=meeting_minutes_file_path.stem,
                minutes="".join(
                    [
                        page.extract_text().strip()
                        for page in PdfReader(meeting_minutes_file_path).pages
                    ]
                ),
            )
