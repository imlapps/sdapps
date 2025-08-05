"use client";

import { EventIcon } from "@/lib/components/EventIcon";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor, Text, Timeline, TimelineItem } from "@mantine/core";
import {
  EventStubStatic,
  Identifier,
  compare,
  displayLabel,
} from "@sdapps/models";
import { useMemo } from "react";

export function EventsTimeline(json: {
  events: readonly EventStubStatic.Json[];
}) {
  const hrefs = useHrefs();

  const events = useMemo(
    () =>
      json.events
        .flatMap((json) => EventStubStatic.fromJson(json).toMaybe().toList())
        .toSorted(compare),
    [json],
  );

  return (
    <Timeline active={0} bulletSize={24} lineWidth={2}>
      {events.map((event) => (
        <TimelineItem
          key={Identifier.toString(event.identifier)}
          bullet={<EventIcon />}
          title={
            <Anchor href={hrefs.event(event)}>{displayLabel(event)}</Anchor>
          }
        >
          {event.startDate.isJust() ? (
            <Text size="sm" mt={4}>
              {event.startDate.unsafeCoerce().toLocaleString()}
            </Text>
          ) : null}
        </TimelineItem>
      ))}
    </Timeline>
  );
}
