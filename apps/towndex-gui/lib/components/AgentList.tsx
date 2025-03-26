import { Hrefs } from "@/lib/Hrefs";
import { Anchor, List, ListItem } from "@mantine/core";
import { AgentStub, Identifier, displayLabel } from "@sdapps/models";

export function AgentList({
  agents,
  hrefs,
}: { agents: readonly AgentStub[]; hrefs: Hrefs }) {
  return (
    <List listStyleType="none">
      {agents.map((agent) => (
        <ListItem key={Identifier.toString(agent.identifier)}>
          <Anchor
            href={
              agent.type === "OrganizationStub"
                ? hrefs.organization(agent)
                : hrefs.person(agent)
            }
          >
            {displayLabel(agent)}
          </Anchor>
        </ListItem>
      ))}
    </List>
  );
}
