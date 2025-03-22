from pydantic import BaseModel
from towndex_etl.models.types import NonBlankString


class MeetingMinutes(BaseModel):
    """A Pydantic Model for the Town of Brunswick's meeting minutes."""

    id: NonBlankString
    minutes: NonBlankString
