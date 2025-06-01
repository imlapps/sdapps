import { Hrefs } from "@/lib/Hrefs";
import { Anchor, Group, Text } from "@mantine/core";
import { EventStub, displayLabel } from "@sdapps/models";
import { IconCalendar } from "@tabler/icons-react";

export function EventAnchor({
  event,
  hrefs,
}: { event: EventStub; hrefs: Hrefs }) {
  return (
    <Anchor href={hrefs.event(event)}>
      <Group gap={2}>
        <IconCalendar />
        <Text>{displayLabel(event)}</Text>
      </Group>
    </Anchor>
  );
}
