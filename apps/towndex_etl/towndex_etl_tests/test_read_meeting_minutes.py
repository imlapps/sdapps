from pathlib import Path

from towndex_etl.models.meeting_minutes import MeetingMinutes
from towndex_etl.read_meeting_minutes import read_meeting_minutes


def test_read(
    meeting_minutes: MeetingMinutes, meeting_minutes_directory_path: Path
) -> None:
    """Test that MeetingMinutesReader.read return a valid MeetingMinutes."""

    assert (
        next(
            iter(
                read_meeting_minutes(
                    meeting_minutes_directory_path=meeting_minutes_directory_path
                )
            )
        ).minutes
        == meeting_minutes.minutes
    )
