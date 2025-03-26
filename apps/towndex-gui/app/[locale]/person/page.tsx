import { PageMetadata } from "@/lib/PageMetadata";
import { MainSectionShell } from "@/lib/components/MainSectionShell";
import { PeopleTable } from "@/lib/components/PeopleTable";
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
    <MainSectionShell title={translations("People")}>
      <PeopleTable people={people.map((person) => person.toJson())} />
    </MainSectionShell>
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
