import { PageMetadata } from "@/lib/PageMetadata";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { dataset } from "@/lib/dataset";
import { getHrefs } from "@/lib/getHrefs";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import {
  Anchor,
  Group,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTr,
  Title,
} from "@mantine/core";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface LocalePageParams {
  locale: Locale;
}

export default async function LocalePage({
  params,
}: { params: Promise<LocalePageParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hrefs = await getHrefs();
  const translations = await getTranslations("LocalePage");

  return (
    <ClientProvidersServer>
      <AppShell>
        <Stack>
          <Title size="lg" style={{ textAlign: "center" }}>
            Towndex: {serverConfiguration.siteTitle}
          </Title>
          <Group mx="auto">
            <Table striped withColumnBorders>
              <TableTbody>
                <TableTr>
                  <TableTd>
                    <Anchor href={hrefs.events}>
                      {translations("Events")}
                    </Anchor>
                  </TableTd>
                  <TableTd>
                    {(await modelSet.modelCount("EventStub")).unsafeCoerce()}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>
                    <Anchor href={hrefs.organizations}>
                      {translations("Organizations")}
                    </Anchor>
                  </TableTd>
                  <TableTd>
                    {(
                      await modelSet.modelCount("OrganizationStub")
                    ).unsafeCoerce()}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>
                    <Anchor href={hrefs.people}>
                      {translations("People")}
                    </Anchor>
                  </TableTd>
                  <TableTd>
                    {(await modelSet.modelCount("PersonStub")).unsafeCoerce()}
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>{translations("Dataset")}</TableTd>
                  <TableTd>
                    {dataset.size} {translations("quads")}
                  </TableTd>
                </TableTr>
              </TableTbody>
            </Table>
          </Group>
        </Stack>
      </AppShell>
    </ClientProvidersServer>
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<LocalePageParams> }): Promise<Metadata> {
  const { locale } = await params;
  return (await PageMetadata.get({ locale })).locale;
}

export function generateStaticParams(): LocalePageParams[] {
  if (serverConfiguration.dynamic) {
    return [];
  }

  return serverConfiguration.locales.map((locale) => ({
    locale,
  }));
}
