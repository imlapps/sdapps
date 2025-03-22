from pydantic import Field
from typing import Annotated

NonBlankString = Annotated[
    str, Field(min_length=1, json_schema_extra={"strip_whitespaces": True})
]
