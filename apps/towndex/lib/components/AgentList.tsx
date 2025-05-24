import { Hrefs } from "@/lib/Hrefs";
import { AgentAnchor } from "@/lib/components/AgentAnchor";
import { List, ListItem } from "@mantine/core";
import { AgentStub, Identifier, compare } from "@sdapps/models";
import { useMemo } from "react";

export function AgentList({
  agents,
  hrefs,
}: { agents: readonly AgentStub[]; hrefs: Hrefs }) {
  const sortedAgents = useMemo(() => agents.toSorted(compare), [agents]);

  return (
    <List listStyleType="none">
      {sortedAgents.map((agent) => (
        <ListItem key={Identifier.toString(agent.identifier)}>
          <AgentAnchor agent={agent} hrefs={hrefs} />
        </ListItem>
      ))}
    </List>
  );
}
