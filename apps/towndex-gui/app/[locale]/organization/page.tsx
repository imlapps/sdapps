import { PageMetadata } from "@/lib/PageMetadata";
import { MainSectionShell } from "@/lib/components/MainSectionShell";
import { OrganizationsTable } from "@/lib/components/OrganizationsTable";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface OrganizationsPageParams {
  locale: Locale;
}

export default async function OrganizationsPage({
  params,
}: { params: Promise<OrganizationsPageParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const organizations = (await modelSet.organizations()).orDefault([]);
  const translations = await getTranslations("OrganizationsPage");

  return (
    <MainSectionShell title={translations("Organizations")}>
      <OrganizationsTable
        organizations={organizations.map((person) => person.toJson())}
      />
    </MainSectionShell>
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
