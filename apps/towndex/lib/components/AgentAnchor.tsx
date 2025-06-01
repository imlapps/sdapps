import { Hrefs } from "@/lib/Hrefs";
import { Anchor, Group, Text } from "@mantine/core";
import { AgentStub, displayLabel } from "@sdapps/models";
import { IconBuilding, IconUser } from "@tabler/icons-react";

export function AgentAnchor({
  agent,
  hrefs,
}: { agent: AgentStub; hrefs: Hrefs }) {
  return (
    <Anchor
      href={
        agent.type === "OrganizationStub"
          ? hrefs.organization(agent)
          : hrefs.person(agent)
      }
    >
      <Group gap={2}>
        {agent.type === "OrganizationStub" ? <IconBuilding /> : <IconUser />}
        <Text>{displayLabel(agent)}</Text>
      </Group>
    </Anchor>
  );
}
