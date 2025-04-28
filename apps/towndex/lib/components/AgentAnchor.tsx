import { Hrefs } from "@/lib/Hrefs";
import { Anchor } from "@mantine/core";
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
      {displayLabel(agent)}
    </Anchor>
  );
}
