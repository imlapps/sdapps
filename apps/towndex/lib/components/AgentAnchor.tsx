import { Hrefs } from "@/lib/Hrefs";
import { OrganizationIcon } from "@/lib/components/OrganizationIcon";
import { PersonIcon } from "@/lib/components/PersonIcon";
import { Anchor, Group, Text } from "@mantine/core";
import { AgentStub, displayLabel } from "@sdapps/models";

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
        {agent.type === "OrganizationStub" ? (
          <OrganizationIcon />
        ) : (
          <PersonIcon />
        )}
        <Text>{displayLabel(agent)}</Text>
      </Group>
    </Anchor>
  );
}
