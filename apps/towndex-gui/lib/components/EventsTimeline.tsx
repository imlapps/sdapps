"use client";

import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor, Text, Timeline, TimelineItem } from "@mantine/core";
import { EventStub, Identifier, displayLabel } from "@sdapps/models";
import { useMemo } from "react";

export function EventsTimeline(json: {
  events: readonly ReturnType<EventStub["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const events = useMemo(
    () =>
      json.events
        .flatMap((json) =>
          EventStub.fromJson(json)
            .toMaybe()
            .filter((event) => event.startDate.isJust())
            .toList(),
        )
        .toSorted((left, right) => {
          const startDateDiff =
            right.startDate.unsafeCoerce().getTime() -
            left.startDate.unsafeCoerce().getTime();
          if (startDateDiff !== 0) {
            return startDateDiff;
          }
          return displayLabel(left).localeCompare(displayLabel(right));
        }),
    [json],
  );

  return (
    <Timeline active={0} bulletSize={24} lineWidth={2}>
      {events.map((event) => (
        <TimelineItem
          key={Identifier.toString(event.identifier)}
          title={
            <Anchor href={hrefs.event(event)}>{displayLabel(event)}</Anchor>
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
