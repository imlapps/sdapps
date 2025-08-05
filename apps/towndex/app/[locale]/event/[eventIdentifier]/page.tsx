import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { EventAnchor } from "@/lib/components/EventAnchor";
import { EventsTimeline } from "@/lib/components/EventsTimeline";
import { InvoiceTable } from "@/lib/components/InvoiceTable";
import { MessagesTable } from "@/lib/components/MessagesTable";
import { PlaceAnchor } from "@/lib/components/PlaceAnchor";
import { PropertiesTable } from "@/lib/components/PropertiesTable";
import { ReportsTable } from "@/lib/components/ReportsTable";
import { SubjectOfList } from "@/lib/components/SubjectOfList";
import { VoteActionsTable } from "@/lib/components/VoteActionsTable";
import { getHrefs } from "@/lib/getHrefs";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Fieldset, Group, Stack } from "@mantine/core";
import {
  Identifier,
  Invoice,
  Message,
  PersonStub,
  Report,
  VoteAction,
  displayLabel,
} from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Either } from "purify-ts";
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
    await objectSet.event(
      Identifier.fromString(decodeFileName(eventIdentifier)),
    )
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
      value: <PlaceAnchor hrefs={hrefs} place={location} />,
    });
  });
  event.startDate.ifJust((startDate) => {
    properties.push({
      label: translations("Start date"),
      value: startDate.toLocaleString(),
    });
  });

  const invoices: Invoice[] = [];
  const participants = event.performers.concat();
  const messages: Message[] = [];
  const reports: Report[] = [];
  const voteActions: VoteAction[] = [];
  for (const about of event.about) {
    switch (about.type) {
      case "InvoiceStub":
        (await objectSet.invoice(about.identifier)).ifRight((invoice) =>
          invoices.push(invoice),
        );
        break;
      case "MessageStub":
        (await objectSet.message(about.identifier)).ifRight((message) =>
          messages.push(message),
        );
        break;
      case "PersonStub":
        participants.push(about as PersonStub);
        break;
      case "ReportStub":
        (await objectSet.report(about.identifier)).ifRight((report) =>
          reports.push(report),
        );
        break;
      case "VoteActionStub":
        (await objectSet.voteAction(about.identifier)).ifRight((voteAction) =>
          voteActions.push(voteAction),
        );
        break;
    }
  }

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={`${translations("Event")}: ${displayLabel(event)}`}
      >
        <Stack>
          <PropertiesTable properties={properties} />
          {event.subjectOf.length > 0 ? (
            <Fieldset legend={translations("Subject of")}>
              <SubjectOfList objectSet={objectSet} thing={event} />
            </Fieldset>
          ) : null}
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
                <EventAnchor event={superEvent} hrefs={hrefs} />
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
          {invoices.map((invoice) => (
            <Fieldset
              key={Identifier.toString(invoice.identifier)}
              legend={displayLabel(invoice)}
            >
              <InvoiceTable invoice={invoice} objectSet={objectSet} />
            </Fieldset>
          ))}
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
    await objectSet.eventStub(
      Identifier.fromString(decodeFileName(eventIdentifier)),
    )
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
    for (const event of Either.rights(await objectSet.eventStubs())) {
      staticParams.push({
        eventIdentifier: encodeFileName(Identifier.toString(event.identifier)),
        locale,
      });
    }
  }

  return staticParams;
}
