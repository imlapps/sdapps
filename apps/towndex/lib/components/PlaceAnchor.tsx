import { Hrefs } from "@/lib/Hrefs";
import { Anchor, Group, Text } from "@mantine/core";
import { PlaceStub, displayLabel } from "@sdapps/models";
import { IconMap } from "@tabler/icons-react";

export function PlaceAnchor({
  place,
  hrefs,
}: { place: PlaceStub; hrefs: Hrefs }) {
  return (
    <Anchor href={hrefs.place(place)}>
      <Group gap={2}>
        <IconMap />
        <Text>{displayLabel(place)}</Text>
      </Group>
    </Anchor>
  );
}
