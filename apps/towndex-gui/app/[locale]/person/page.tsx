import { PageMetadata } from "@/lib/PageMetadata";
import { PersonTable } from "@/lib/components/PersonTable";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Group, Stack, Title } from "@mantine/core";
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

  const people = (await modelSet.people()).orDefault([]);
  const translations = await getTranslations("PeoplePage");

  return (
    <Stack>
      <Title size="lg" style={{ textAlign: "center" }}>
        {translations("People")}
      </Title>
      <Group mx="auto">
        <PersonTable people={people.map((person) => person.toJson())} />
      </Group>
    </Stack>
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<PeoplePageParams> }): Promise<Metadata> {
  const { locale } = await params;
  return (await PageMetadata.get({ locale })).locale;
}

export function generateStaticParams(): PeoplePageParams[] {
  if (serverConfiguration.dynamic) {
    return [];
  }

  return serverConfiguration.locales.map((locale) => ({
    locale,
  }));
}
