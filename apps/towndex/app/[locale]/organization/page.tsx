import { PageMetadata } from "@/lib/PageMetadata";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { OrganizationsTable } from "@/lib/components/OrganizationsTable";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Either } from "purify-ts";

interface OrganizationsPageParams {
  locale: Locale;
}

export default async function OrganizationsPage({
  params,
}: { params: Promise<OrganizationsPageParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const organizations = Either.rights(await objectSet.organizationStubs());
  const translations = await getTranslations("OrganizationsPage");

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={translations("Organizations")}
      >
        <OrganizationsTable
          organizations={organizations.map((organization) =>
            organization.toJson(),
          )}
        />
      </AppShell>
    </ClientProvidersServer>
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<OrganizationsPageParams> }): Promise<Metadata> {
  const { locale } = await params;
  return (await PageMetadata.get({ locale })).organizations;
}

export function generateStaticParams(): OrganizationsPageParams[] {
  if (serverConfiguration.dynamic) {
    return [];
  }

  return serverConfiguration.locales.map((locale) => ({
    locale,
  }));
}
