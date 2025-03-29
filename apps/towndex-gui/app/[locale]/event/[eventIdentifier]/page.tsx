import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { EventsTimeline } from "@/lib/components/EventsTimeline";
import { VoteActionsTable } from "@/lib/components/VoteActionsTable";
import { getHrefs } from "@/lib/getHrefs";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import {
  Anchor,
  Fieldset,
  Group,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTr,
} from "@mantine/core";
import {
  Event,
  EventStub,
  Identifier,
  VoteAction,
  displayLabel,
} from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

interface EventPageParams {
  eventIdentifier: string;
  locale: Locale;
}

export default async function EventPage({
  params,
}: {
  params: Promise<EventPageParams>;
}) {
  const { eventIdentifier, locale } = await params;
  setRequestLocale(locale);

  const event = (
    await modelSet.model<Event>({
      identifier: Identifier.fromString(decodeFileName(eventIdentifier)),
      type: "Event",
    })
  )
    .toMaybe()
    .extractNullable();
  if (!event) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("EventPage");

  const properties: { label: string; value: ReactNode }[] = [];
  event.name.ifJust((name) => {
    properties.push({ label: translations("Name"), value: name });
  });
  event.description.ifJust((description) => {
    properties.push({ label: translations("Description"), value: description });
  });
  event.location.ifJust((location) => {
    properties.push({
      label: translations("Location"),
      value: (
        <Anchor href={hrefs.place(location)}>{displayLabel(location)}</Anchor>
      ),
    });
  });
  event.startDate.ifJust((startDate) => {
    properties.push({
      label: translations("Start date"),
      value: startDate.toLocaleString(),
    });
  });
  const voteActions: VoteAction[] = [];
  for (const about of event.about) {
    if (about.type === "VoteActionStub") {
      (
        await modelSet.model<VoteAction>({
          identifier: about.identifier,
          type: "VoteAction",
        })
      ).ifRight((voteAction) => voteActions.push(voteAction));
    }
  }

  return (
    <ClientProvidersServer>
      <AppShell title={`${translations("Event")}: ${displayLabel(event)}`}>
        <Stack>
          <Table withColumnBorders withRowBorders withTableBorder>
            <TableTbody>
              {properties.map((property) => (
                <TableTr key={property.label}>
                  <TableTd>{property.label}</TableTd>
                  <TableTd>{property.value}</TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
          {event.organizers.length > 0 || event.performers.length > 0 ? (
            <Group>
              {event.organizers.length > 0 ? (
                <Fieldset legend={translations("Organizers")}>
                  <AgentList agents={event.organizers} hrefs={hrefs} />
                </Fieldset>
              ) : null}
              {event.performers.length > 0 ? (
                <Fieldset legend={translations("Participants")}>
                  <AgentList agents={event.performers} hrefs={hrefs} />
                </Fieldset>
              ) : null}
            </Group>
          ) : null}
          {event.subEvents.length > 0 ? (
            <Fieldset legend={translations("Sub-events")}>
              <EventsTimeline
                events={event.subEvents.map((event) => event.toJson())}
              />
            </Fieldset>
          ) : null}
          {voteActions.length > 0 ? (
            <Fieldset legend={translations("Votes")}>
              <VoteActionsTable
                voteActions={voteActions.map((voteAction) =>
                  voteAction.toJson(),
                )}
              />
            </Fieldset>
          ) : null}
        </Stack>
      </AppShell>
    </ClientProvidersServer>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<EventPageParams>;
}): Promise<Metadata> {
  const { locale, eventIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await modelSet.model<EventStub>({
      identifier: Identifier.fromString(decodeFileName(eventIdentifier)),
      type: "EventStub",
    })
  )
    .map((event) => pageMetadata.event(event))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<EventPageParams[]> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: EventPageParams[] = [];

  for (const locale of routing.locales) {
    for (const event of (
      await modelSet.models<EventStub>("EventStub")
    ).unsafeCoerce()) {
      staticParams.push({
        eventIdentifier: encodeFileName(Identifier.toString(event.identifier)),
        locale,
      });
    }
  }

  return staticParams;
}
