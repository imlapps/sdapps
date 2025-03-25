import { PageMetadata } from "@/lib/PageMetadata";
import { dataset } from "@/lib/dataset";
import { getHrefs } from "@/lib/getHrefs";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Table, TableTbody, TableTd, TableTr, Title } from "@mantine/core";
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
    <>
      <Title size="lg" style={{ textAlign: "center" }}>
        Towndex: {serverConfiguration.siteTitle}
      </Title>
      <Table>
        <TableTbody>
          <TableTr>
            <TableTd>
              <a href={hrefs.organizations}>{translations("Organizations")}</a>
            </TableTd>
            <TableTd>
              {(await modelSet.organizationsCount()).unsafeCoerce()}
            </TableTd>
          </TableTr>
          <TableTr>
            <TableTd>
              <a href={hrefs.people}>{translations("People")}</a>
            </TableTd>
            <TableTd>{(await modelSet.peopleCount()).unsafeCoerce()}</TableTd>
          </TableTr>
          <TableTr>
            <TableTd>{translations("Dataset")}</TableTd>
            <TableTd>
              {dataset.size} {translations("quads")}
            </TableTd>
          </TableTr>
        </TableTbody>
      </Table>
    </>
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
