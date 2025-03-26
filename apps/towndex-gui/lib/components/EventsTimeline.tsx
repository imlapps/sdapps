"use client";

import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor, Text, Timeline, TimelineItem } from "@mantine/core";
import { Event, Identifier } from "@sdapps/models";
import { useMemo } from "react";

export function EventsTimeline(json: {
  events: readonly ReturnType<Event["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const events = useMemo(
    () =>
      json.events.flatMap((json) =>
        Event.fromJson(json)
          .toMaybe()
          .filter(
            (event) =>
              event.name.isJust() &&
              event.startDate.isJust() &&
              event.superEvent.isNothing(),
          )
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
              {event.name.unsafeCoerce()}
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
