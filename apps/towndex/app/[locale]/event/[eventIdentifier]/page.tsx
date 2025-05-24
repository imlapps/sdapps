import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { EventsTimeline } from "@/lib/components/EventsTimeline";
import { MessagesTable } from "@/lib/components/MessagesTable";
import { ReportsTable } from "@/lib/components/ReportsTable";
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
  Message,
  PersonStub,
  Report,
  TextObject,
  VoteAction,
  displayLabel,
} from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Maybe } from "purify-ts";
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
  for (const subjectOf of event.subjectOf) {
    if (subjectOf.type === "TextObjectStub") {
      (
        await modelSet.model<TextObject>({
          identifier: subjectOf.identifier,
          type: "TextObject",
        })
      ).ifRight((textObject) => {
        textObject.url
          .altLazy(() =>
            textObject.identifier.termType === "NamedNode" &&
            (textObject.identifier.value.startsWith("http://") ||
              textObject.identifier.value.startsWith("https://"))
              ? Maybe.of(textObject.identifier)
              : Maybe.empty(),
          )
          .ifJust((url) => {
            properties.push({
              label: translations("Minutes"),
              value: (
                <Anchor href={url.value}>
                  {textObject.name.orDefault(url.value)}
                </Anchor>
              ),
            });
          });
      });
    }
  }

  const participants = event.performers.concat();
  const messages: Message[] = [];
  const reports: Report[] = [];
  const voteActions: VoteAction[] = [];
  for (const about of event.about) {
    switch (about.type) {
      case "MessageStub":
        (
          await modelSet.model<Message>({
            identifier: about.identifier,
            type: "Message",
          })
        ).ifRight((message) => messages.push(message));
        break;
      case "PersonStub":
        participants.push(about as PersonStub);
        break;
      case "ReportStub":
        (
          await modelSet.model<Report>({
            identifier: about.identifier,
            type: "Report",
          })
        ).ifRight((report) => reports.push(report));
        break;
      case "VoteActionStub":
        (
          await modelSet.model<VoteAction>({
            identifier: about.identifier,
            type: "VoteAction",
          })
        ).ifRight((voteAction) => voteActions.push(voteAction));
        break;
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
          {event.organizers.length > 0 || participants.length > 0 ? (
            <Group>
              {event.organizers.length > 0 ? (
                <Fieldset legend={translations("Organizers")}>
                  <AgentList agents={event.organizers} hrefs={hrefs} />
                </Fieldset>
              ) : null}
              {participants.length > 0 ? (
                <Fieldset legend={translations("Participants")}>
                  <AgentList agents={participants} hrefs={hrefs} />
                </Fieldset>
              ) : null}
            </Group>
          ) : null}
          {event.superEvent
            .map((superEvent) => (
              <Fieldset key="superEvent" legend={translations("Parent event")}>
                <Anchor href={hrefs.event(superEvent)}>
                  {displayLabel(superEvent)}
                </Anchor>
              </Fieldset>
            ))
            .extractNullable()}
          {event.subEvents.length > 0 ? (
            <Fieldset legend={translations("Sub-events")}>
              <EventsTimeline
                events={event.subEvents.map((event) => event.toJson())}
              />
            </Fieldset>
          ) : null}
          {messages.length > 0 ? (
            <Fieldset legend={translations("Messages")}>
              <MessagesTable
                messages={messages.map((message) => message.toJson())}
              />
            </Fieldset>
          ) : null}
          {reports.length > 0 ? (
            <Fieldset legend={translations("Reports")}>
              <ReportsTable
                reports={reports.map((report) => report.toJson())}
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
