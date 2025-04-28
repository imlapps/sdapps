import { Hrefs } from "@/lib/Hrefs";
import { AgentAnchor } from "@/lib/components/AgentAnchor";
import { List, ListItem } from "@mantine/core";
import { AgentStub, Identifier } from "@sdapps/models";

export function AgentList({
  agents,
  hrefs,
}: { agents: readonly AgentStub[]; hrefs: Hrefs }) {
  return (
    <List listStyleType="none">
      {agents.map((agent) => (
        <ListItem key={Identifier.toString(agent.identifier)}>
          <AgentAnchor agent={agent} hrefs={hrefs} />
        </ListItem>
      ))}
    </List>
  );
}
