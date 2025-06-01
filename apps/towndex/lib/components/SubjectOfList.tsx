import { Anchor, Group, List, ListItem, Text } from "@mantine/core";
import {
  url,
  CreativeWorkStub,
  EventStub,
  Identifier,
  ModelSet,
  TextObject,
  displayLabel,
} from "@sdapps/models";
import { IconExternalLink } from "@tabler/icons-react";
import { ReactElement } from "react";

export async function SubjectOfList({
  modelSet,
  thing,
}: {
  modelSet: ModelSet;
  thing: { subjectOf: readonly (CreativeWorkStub | EventStub)[] };
}) {
  const items: ReactElement[] = [];
  for (const subjectOf of thing.subjectOf) {
    if (subjectOf.type !== "TextObjectStub") {
      continue;
    }
    const textObject = (
      await modelSet.model<TextObject>({
        identifier: subjectOf.identifier,
        type: "TextObject",
      })
    )
      .toMaybe()
      .extract();
    if (!textObject) {
      continue;
    }

    items.push(
      <ListItem key={Identifier.toString(subjectOf.identifier)}>
        {url(textObject)
          .map((url) => (
            <Anchor href={url.value} key={url.value}>
              <Group gap={2}>
                <IconExternalLink />
                <Text>{displayLabel(textObject)}</Text>
              </Group>
            </Anchor>
          ))
          .orDefaultLazy(() => (
            <Text>{displayLabel(textObject)}</Text>
          ))}
      </ListItem>,
    );
  }

  return <List listStyleType="none">{items}</List>;
}
