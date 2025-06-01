import { Hrefs } from "@/lib/Hrefs";
import { PlaceIcon } from "@/lib/components/PlaceIcon";
import { Anchor, Group, Text } from "@mantine/core";
import { PlaceStub, displayLabel } from "@sdapps/models";

export function PlaceAnchor({
  place,
  hrefs,
}: { place: PlaceStub; hrefs: Hrefs }) {
  return (
    <Anchor href={hrefs.place(place)}>
      <Group gap={2}>
        <PlaceIcon />
        <Text>{displayLabel(place)}</Text>
      </Group>
    </Anchor>
  );
}
