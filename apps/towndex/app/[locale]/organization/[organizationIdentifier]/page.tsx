import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { SubjectOfList } from "@/lib/components/SubjectOfList";
import { getHrefs } from "@/lib/getHrefs";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Fieldset, Stack } from "@mantine/core";
import { Identifier, displayLabel } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Either } from "purify-ts";

interface OrganizationPageParams {
  locale: Locale;
  organizationIdentifier: string;
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<OrganizationPageParams>;
}) {
  const { locale, organizationIdentifier } = await params;
  setRequestLocale(locale);

  const organization = (
    await objectSet.organization(
      Identifier.fromString(decodeFileName(organizationIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!organization) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("OrganizationPage");

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={`${translations("Organization")}: ${displayLabel(organization)}`}
      >
        <Stack>
          {organization.subjectOf.length > 0 ? (
            <Fieldset legend={translations("Subject of")}>
              <SubjectOfList objectSet={objectSet} thing={organization} />
            </Fieldset>
          ) : null}
          {organization.members.length > 0 ? (
            <Fieldset legend={translations("Members")}>
              <AgentList agents={organization.members} hrefs={hrefs} />
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
  params: Promise<OrganizationPageParams>;
}): Promise<Metadata> {
  const { locale, organizationIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await objectSet.organizationStub(
      Identifier.fromString(decodeFileName(organizationIdentifier)),
    )
  )
    .map((organization) => pageMetadata.organization(organization))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<
  OrganizationPageParams[]
> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: OrganizationPageParams[] = [];

  for (const locale of routing.locales) {
    for (const organization of Either.rights(
      await objectSet.organizationStubs(),
    )) {
      staticParams.push({
        organizationIdentifier: encodeFileName(
          Identifier.toString(organization.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
