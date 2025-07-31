import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { EventsTimeline } from "@/lib/components/EventsTimeline";
import { PropertiesTable } from "@/lib/components/PropertiesTable";
import { SubjectOfList } from "@/lib/components/SubjectOfList";
import { getHrefs } from "@/lib/getHrefs";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Fieldset, Stack } from "@mantine/core";
import {
  CreativeWorkStub,
  EventStub,
  Identifier,
  compare,
  displayLabel,
} from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Either } from "purify-ts";
import { ReactNode } from "react";

interface PersonPageParams {
  locale: Locale;
  personIdentifier: string;
}

export default async function PersonPage({
  params,
}: {
  params: Promise<PersonPageParams>;
}) {
  const { locale, personIdentifier } = await params;
  setRequestLocale(locale);

  const person = (
    await objectSet.person(
      Identifier.fromString(decodeFileName(personIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!person) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("PersonPage");

  const properties: { label: string; value: ReactNode }[] = [];
  person.name.ifJust((name) => {
    properties.push({ label: translations("Name"), value: name });
  });
  person.jobTitle.ifJust((jobTitle) => {
    properties.push({ label: translations("Job title"), value: jobTitle });
  });
  const events = (
    person.performerIn as readonly (CreativeWorkStub | EventStub)[]
  )
    .concat(person.subjectOf.filter((_) => _.type === "EventStub"))
    .toSorted(compare) as readonly EventStub[];

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={`${translations("Person")}: ${displayLabel(person)}`}
      >
        <Stack>
          <PropertiesTable properties={properties} />
          {person.memberOf.length > 0 ? (
            <Fieldset legend={translations("Member of organizations")}>
              <AgentList agents={person.memberOf} hrefs={hrefs} />
            </Fieldset>
          ) : null}
          {events.length > 0 ? (
            <Fieldset legend={translations("Participant in events")}>
              <EventsTimeline events={events.map((event) => event.toJson())} />
            </Fieldset>
          ) : null}
          {person.subjectOf.length > 0 ? (
            <Fieldset legend={translations("Subject of")}>
              <SubjectOfList objectSet={objectSet} thing={person} />
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
  params: Promise<PersonPageParams>;
}): Promise<Metadata> {
  const { locale, personIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await objectSet.personStub(
      Identifier.fromString(decodeFileName(personIdentifier)),
    )
  )
    .map((person) => pageMetadata.person(person))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<PersonPageParams[]> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: PersonPageParams[] = [];

  for (const locale of routing.locales) {
    for (const person of Either.rights(await objectSet.personStubs())) {
      staticParams.push({
        personIdentifier: encodeFileName(
          Identifier.toString(person.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
