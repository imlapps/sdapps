"use client";

import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor, Text, Timeline, TimelineItem } from "@mantine/core";
import { EventStub, Identifier } from "@sdapps/models";
import { useMemo } from "react";

export function EventsTimeline(json: {
  events: readonly ReturnType<EventStub["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const events = useMemo(
    () =>
      json.events.flatMap((json) =>
        EventStub.fromJson(json)
          .toMaybe()
          .filter((event) => event.startDate.isJust())
          .toList(),
      ),
    [json],
  );

  return (
    <Timeline active={0} bulletSize={24} lineWidth={2}>
      {events.map((event) => (
        <TimelineItem
          key={Identifier.toString(event.identifier)}
          title={
            <Anchor href={hrefs.event(event)}>
              {event.name.orDefault(Identifier.toString(event.identifier))}
            </Anchor>
          }
        >
          <Text size="sm" mt={4}>
            {event.startDate.unsafeCoerce().toLocaleString()}
          </Text>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
