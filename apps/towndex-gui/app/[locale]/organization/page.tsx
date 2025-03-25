import { PageMetadata } from "@/lib/PageMetadata";
import { MainSectionShell } from "@/lib/components/MainSectionShell";
import { OrganizationsTable } from "@/lib/components/OrganizationsTable";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { OrganizationStub } from "@sdapps/models";
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

  const organizations = (
    await modelSet.models<OrganizationStub>("OrganizationStub")
  ).orDefault([]);
  const translations = await getTranslations("OrganizationsPage");

  return (
    <MainSectionShell title={translations("Organizations")}>
      <OrganizationsTable
        organizations={organizations.map((organization) =>
          organization.toJson(),
        )}
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
