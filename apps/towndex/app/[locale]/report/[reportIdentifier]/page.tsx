import { PageMetadata } from "@/lib/PageMetadata";
import { AgentList } from "@/lib/components/AgentList";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { PropertiesTable } from "@/lib/components/PropertiesTable";
import { SubjectOfList } from "@/lib/components/SubjectOfList";
import { getHrefs } from "@/lib/getHrefs";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Fieldset, Stack } from "@mantine/core";
import { Identifier, Report, ReportStub, displayLabel } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

interface ReportPageParams {
  reportIdentifier: string;
  locale: Locale;
}

export default async function ReportPage({
  params,
}: {
  params: Promise<ReportPageParams>;
}) {
  const { reportIdentifier, locale } = await params;
  setRequestLocale(locale);

  const report = (
    await modelSet.model<Report>({
      identifier: Identifier.fromString(decodeFileName(reportIdentifier)),
      type: "Report",
    })
  )
    .toMaybe()
    .extractNullable();
  if (!report) {
    notFound();
  }

  const hrefs = await getHrefs();
  const translations = await getTranslations("ReportPage");

  const properties: { label: string; value: ReactNode }[] = [];
  report.name.ifJust((name) => {
    properties.push({ label: translations("Name"), value: name });
  });
  report.description.ifJust((description) => {
    properties.push({ label: translations("Description"), value: description });
  });

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={`${translations("Report")}: ${displayLabel(report)}`}
      >
        <Stack>
          <PropertiesTable properties={properties} />
          {report.subjectOf.length > 0 ? (
            <Fieldset legend={translations("Subject of")}>
              <SubjectOfList modelSet={modelSet} thing={report} />
            </Fieldset>
          ) : null}
          {report.authors.length > 0 ? (
            <Fieldset legend={translations("Authors")}>
              <AgentList agents={report.authors} hrefs={hrefs} />
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
  params: Promise<ReportPageParams>;
}): Promise<Metadata> {
  const { locale, reportIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await modelSet.model<ReportStub>({
      identifier: Identifier.fromString(decodeFileName(reportIdentifier)),
      type: "ReportStub",
    })
  )
    .map((report) => pageMetadata.report(report))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<ReportPageParams[]> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: ReportPageParams[] = [];

  for (const locale of routing.locales) {
    for (const report of (
      await modelSet.models<ReportStub>("ReportStub")
    ).unsafeCoerce()) {
      staticParams.push({
        reportIdentifier: encodeFileName(
          Identifier.toString(report.identifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
