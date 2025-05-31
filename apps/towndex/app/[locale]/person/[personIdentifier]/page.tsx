import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { EventsTimeline } from "@/lib/components/EventsTimeline";
import { PropertiesTable } from "@/lib/components/PropertiesTable";
import { SubjectOfList } from "@/lib/components/SubjectOfList";
import { getHrefs } from "@/lib/getHrefs";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Fieldset, Stack } from "@mantine/core";
import {
  Identifier,
  Person,
  PersonStub,
  compare,
  displayLabel,
} from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
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
    await modelSet.model<Person>({
      identifier: Identifier.fromString(decodeFileName(personIdentifier)),
      type: "Person",
    })
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
  const events = person.performerIn
    .concat(person.subjectOf.filter((_) => _.type === "EventStub"))
    .toSorted(compare);

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
              <SubjectOfList modelSet={modelSet} thing={person} />
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
    await modelSet.model<PersonStub>({
      identifier: Identifier.fromString(decodeFileName(personIdentifier)),
      type: "PersonStub",
    })
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
    for (const person of (
      await modelSet.models<PersonStub>("PersonStub")
    ).unsafeCoerce()) {
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
