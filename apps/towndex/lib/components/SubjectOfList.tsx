import { Anchor, Group, List, ListItem, Text } from "@mantine/core";
import {
  url,
  $ObjectSet,
  CreativeWorkStub,
  EventStub,
  Identifier,
  displayLabel,
} from "@sdapps/models";
import { IconExternalLink } from "@tabler/icons-react";
import { ReactElement } from "react";

export async function SubjectOfList({
  objectSet,
  thing,
}: {
  objectSet: $ObjectSet;
  thing: { subjectOf: readonly (CreativeWorkStub | EventStub)[] };
}) {
  const items: ReactElement[] = [];
  for (const subjectOf of thing.subjectOf) {
    if (subjectOf.type !== "TextObjectStub") {
      continue;
    }
    const textObject = (await objectSet.textObject(subjectOf.identifier))
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
