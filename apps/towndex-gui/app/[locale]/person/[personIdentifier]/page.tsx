import { PageMetadata } from "@/lib/PageMetadata";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { getHrefs } from "@/lib/getHrefs";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import {
  Anchor,
  Fieldset,
  List,
  ListItem,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTr,
} from "@mantine/core";
import { Identifier, Person, PersonStub, displayLabel } from "@sdapps/models";
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
  const performerInRootEvents = person.performerIn
    .filter(
      (event) =>
        event.name.isJust() &&
        event.startDate.isJust() &&
        event.superEvent.isNothing(),
    )
    .toSorted(
      (left, right) =>
        right.startDate.unsafeCoerce().getTime() -
        left.startDate.unsafeCoerce().getTime(),
    );

  return (
    <ClientProvidersServer>
      <AppShell title={`${translations("Person")}: ${displayLabel(person)}`}>
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
          {person.memberOf.length > 0 ? (
            <Fieldset legend={translations("Member of organizations")}>
              <List listStyleType="none">
                {person.memberOf.map((organization) => (
                  <ListItem key={Identifier.toString(organization.identifier)}>
                    <Anchor href={hrefs.organization(organization)}>
                      {organization.name.orDefault(
                        Identifier.toString(organization.identifier),
                      )}
                    </Anchor>
                  </ListItem>
                ))}
              </List>
            </Fieldset>
          ) : null}
          {performerInRootEvents.length > 0 ? (
            <Fieldset legend={translations("Participant in events")}>
              <Table>
                <TableTbody>
                  {performerInRootEvents.map((event) => (
                    <TableTr key={Identifier.toString(event.identifier)}>
                      <TableTd>
                        {event.startDate.unsafeCoerce().toLocaleDateString()}
                      </TableTd>
                      <TableTd>
                        <Anchor href={hrefs.event(event)}>
                          {event.name.orDefault(
                            Identifier.toString(event.identifier),
                          )}
                        </Anchor>
                      </TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
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
