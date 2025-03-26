import { PageMetadata } from "@/lib/PageMetadata";
import { MainSectionShell } from "@/lib/components/MainSectionShell";
import { getHrefs } from "@/lib/getHrefs";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Anchor, Fieldset, List, ListItem, Stack } from "@mantine/core";
import { Identifier, Organization, OrganizationStub } from "@sdapps/models";
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
    <MainSectionShell
      title={`${translations("Organization")}: ${organization.name.orDefault(organizationIdentifier)}`}
    >
      <Stack>
        {organization.members.length > 0 ? (
          <Fieldset legend={translations("Members")}>
            <List listStyleType="none">
              {organization.members.map((agent) => (
                <ListItem key={Identifier.toString(agent.identifier)}>
                  <Anchor
                    href={
                      agent.type === "OrganizationStub"
                        ? hrefs.organization(agent)
                        : hrefs.person(agent)
                    }
                  >
                    {agent.name.orDefault(
                      Identifier.toString(agent.identifier),
                    )}
                  </Anchor>
                </ListItem>
              ))}
            </List>
          </Fieldset>
        ) : null}
      </Stack>
    </MainSectionShell>
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
