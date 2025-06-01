import { Hrefs } from "@/lib/Hrefs";
import { EventIcon } from "@/lib/components/EventIcon";
import { Anchor, Group, Text } from "@mantine/core";
import { EventStub, displayLabel } from "@sdapps/models";

export function EventAnchor({
  event,
  hrefs,
}: { event: EventStub; hrefs: Hrefs }) {
  return (
    <Anchor href={hrefs.event(event)}>
      <Group gap={2}>
        <EventIcon />
        <Text>{displayLabel(event)}</Text>
      </Group>
    </Anchor>
  );
}
