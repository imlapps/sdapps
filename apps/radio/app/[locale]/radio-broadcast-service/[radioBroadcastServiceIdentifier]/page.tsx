import { PageMetadata } from "@/lib/PageMetadata";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Stack } from "@mantine/core";
import { Identifier, displayLabel } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface RadioBroadcastServicePageParams {
  locale: Locale;
  radioBroadcastServiceIdentifier: string;
}

export default async function RadioBroadcastServicePage({
  params,
}: {
  params: Promise<RadioBroadcastServicePageParams>;
}) {
  const { locale, radioBroadcastServiceIdentifier } = await params;
  setRequestLocale(locale);

  const radioBroadcastService = (
    await objectSet.radioBroadcastService(
      Identifier.fromString(decodeFileName(radioBroadcastServiceIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!radioBroadcastService) {
    notFound();
  }

  // Get the latest broadcast event date and redirect to that
  // const broadcastEvents

  //   const hrefs = await getHrefs();
  const translations = await getTranslations("RadioBroadcastServicePage");

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={`${translations("RadioBroadcastService")}: ${displayLabel(radioBroadcastService)}`}
      >
        <Stack>
          {/* {radioBroadcastService.subjectOf.length > 0 ? (
            <Fieldset legend={translations("Subject of")}>
              <SubjectOfList
                objectSet={objectSet}
                thing={radioBroadcastService}
              />
            </Fieldset>
          ) : null} */}
          {/* {radioBroadcastService.members.length > 0 ? (
            <Fieldset legend={translations("Members")}>
              <AgentList agents={radioBroadcastService.members} hrefs={hrefs} />
            </Fieldset>
          ) : null} */}
        </Stack>
      </AppShell>
    </ClientProvidersServer>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RadioBroadcastServicePageParams>;
}): Promise<Metadata> {
  const { locale, radioBroadcastServiceIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await objectSet.radioBroadcastServiceStub(
      Identifier.fromString(decodeFileName(radioBroadcastServiceIdentifier)),
    )
  )
    .map((radioBroadcastService) =>
      pageMetadata.radioBroadcastService(radioBroadcastService),
    )
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<
  RadioBroadcastServicePageParams[]
> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: RadioBroadcastServicePageParams[] = [];

  for (const locale of routing.locales) {
    for (const radioBroadcastServiceIdentifier of (
      await objectSet.radioBroadcastServiceIdentifiers()
    ).orDefault([])) {
      staticParams.push({
        radioBroadcastServiceIdentifier: encodeFileName(
          Identifier.toString(radioBroadcastServiceIdentifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
