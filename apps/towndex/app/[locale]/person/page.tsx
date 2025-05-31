import { PageMetadata } from "@/lib/PageMetadata";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { PeopleTable } from "@/lib/components/PeopleTable";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { PersonStub } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface PeoplePageParams {
  locale: Locale;
}

export default async function PeoplePage({
  params,
}: { params: Promise<PeoplePageParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const people = (await modelSet.models<PersonStub>("PersonStub")).orDefault(
    [],
  );
  const translations = await getTranslations("PeoplePage");

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={translations("People")}
      >
        <PeopleTable people={people.map((person) => person.toJson())} />
      </AppShell>
    </ClientProvidersServer>
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<PeoplePageParams> }): Promise<Metadata> {
  const { locale } = await params;
  return (await PageMetadata.get({ locale })).people;
}

export function generateStaticParams(): PeoplePageParams[] {
  if (serverConfiguration.dynamic) {
    return [];
  }

  return serverConfiguration.locales.map((locale) => ({
    locale,
  }));
}
