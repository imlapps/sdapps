import ast
import json
from pathlib import Path

from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough, RunnableSerializable
from langchain_openai import ChatOpenAI

from models.meeting_minutes import MeetingMinutes
from models.types import NonBlankString as ModelPrompt
from models.types import NonBlankString as ModelResponse
from read_openai_model_prompt import read_openai_model_prompt


class TowndexKgBuilder:
    def __init__(
        self,
        *,
        towndex_kg_builder_output_directory_path: Path,
        openai_model_prompt_file_path: Path,
    ) -> None:
        self.__openai_model_prompt = read_openai_model_prompt(
            openai_model_prompt_file_path=openai_model_prompt_file_path
        )
        self.__template = """\
                Question: {question}
                """
        self.__towndex_kg_builder_output_directory_path = (
            towndex_kg_builder_output_directory_path
        )

    def __add_meeting_minutes_to_prompt(
        self, *, meeting_minutes: MeetingMinutes
    ) -> ModelPrompt:
        """Add meeting minutes to OpenAI prompt."""

        return self.__openai_model_prompt + meeting_minutes.minutes

    def __create_chat_model(self) -> ChatOpenAI:
        """Return an OpenAI chat model."""

        return ChatOpenAI(model="gpt-4o")

    def __build_chain(self) -> RunnableSerializable:
        """Build a chain that consists of an OpenAI prompt, large language model and an output parser."""

        return (
            {"question": RunnablePassthrough()}
            | PromptTemplate.from_template(self.__template)
            | self.__create_chat_model()
            | StrOutputParser()
        )

    def __generate_response(self, *, meeting_minutes: MeetingMinutes) -> ModelResponse:
        """Invoke the OpenAI large language model and generate a response."""

        return str(
            self.__build_chain().invoke(
                self.__add_meeting_minutes_to_prompt(meeting_minutes=meeting_minutes)
            )
        )

    def build_graph(self, *, meeting_minutes: MeetingMinutes) -> Path:
        """
        Return a Schema.org JSON-LD graph's file Path.

        The graph was obtained from an OpenAI model.
        """

        model_response = self.__generate_response(meeting_minutes=meeting_minutes)

        sanitized_model_response = ast.literal_eval(
            model_response[model_response.find("{") : model_response.rfind("}") + 1]
        )

        self.__towndex_kg_builder_output_directory_path.mkdir(
            parents=True, exist_ok=True
        )

        meeting_minutes_json_ld_file_path = (
            self.__towndex_kg_builder_output_directory_path
            / Path(meeting_minutes.id + ".json")
        )

        with meeting_minutes_json_ld_file_path.open(
            mode="w"
        ) as meeting_minutes_json_ld_file:
            meeting_minutes_json_ld_file.write(
                json.dumps(sanitized_model_response, indent=2)
            )

        return meeting_minutes_json_ld_file_path
