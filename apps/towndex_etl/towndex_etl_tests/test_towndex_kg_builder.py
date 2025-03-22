import json

from langchain.schema.runnable import RunnableSequence
from pytest_mock import MockFixture

from towndex_etl.models import MeetingMinutes
from towndex_etl.models.types import NonBlankString as ModelResponse
from towndex_etl.towndex_kg_builder import TowndexKgBuilder


def test_build_graph(
    meeting_minutes: MeetingMinutes,
    openai_model_response: ModelResponse,
    session_mocker: MockFixture,
    towndex_kg_builder: TowndexKgBuilder,
) -> None:
    """Test that TowndexKgBuilder.build_graph returns a Path to a JSON-LD graph."""

    session_mocker.patch.object(
        RunnableSequence, "invoke", return_value=openai_model_response
    )

    with towndex_kg_builder.build_graph(meeting_minutes=meeting_minutes).open(
        encoding="utf-8"
    ) as json_file:
        sanitized_response = openai_model_response.removeprefix(
            "```json\n"
        ).removesuffix("""\n```""")

        assert str(json.load(json_file)) == sanitized_response
