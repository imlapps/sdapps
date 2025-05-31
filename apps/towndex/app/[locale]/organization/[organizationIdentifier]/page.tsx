import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { SubjectOfList } from "@/lib/components/SubjectOfList";
import { getHrefs } from "@/lib/getHrefs";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Fieldset, Stack } from "@mantine/core";
import {
  Identifier,
  Organization,
  OrganizationStub,
  displayLabel,
} from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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
    await modelSet.model<Organization>({
      identifier: Identifier.fromString(decodeFileName(organizationIdentifier)),
      type: "Organization",
    })
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
        title={`${translations("Organization")}: ${displayLabel(organization)}`}
      >
        <Stack>
          {organization.subjectOf.length > 0 ? (
            <Fieldset legend={translations("Subject of")}>
              <SubjectOfList modelSet={modelSet} thing={organization} />
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
    await modelSet.model<OrganizationStub>({
      identifier: Identifier.fromString(decodeFileName(organizationIdentifier)),
      type: "OrganizationStub",
    })
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
    for (const organization of (
      await modelSet.models<OrganizationStub>("OrganizationStub")
    ).unsafeCoerce()) {
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
