from towndex_etl.models.meeting_minutes import MeetingMinutes
from towndex_etl.meeting_minutes_reader import MeetingMinutesReader


def test_read(
    meeting_minutes: MeetingMinutes, meeting_minutes_reader: MeetingMinutesReader
) -> None:
    """Test that MeetingMinutesReader.read return a valid MeetingMinutes."""

    assert next(iter(meeting_minutes_reader.read())).minutes == meeting_minutes.minutes
