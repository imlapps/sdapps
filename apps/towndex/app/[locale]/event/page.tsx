import { PageMetadata } from "@/lib/PageMetadata";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { EventsTimeline } from "@/lib/components/EventsTimeline";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { EventStub } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface EventsPageParams {
  locale: Locale;
}

export default async function EventsPage({
  params,
}: { params: Promise<EventsPageParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const events = (await objectSet.models<EventStub>("EventStub")).orDefault([]);
  const translations = await getTranslations("EventsPage");

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={translations("Events")}
      >
        <EventsTimeline
          events={events.flatMap((event) =>
            event.superEvent.isNothing() ? [event.toJson()] : [],
          )}
        />
      </AppShell>
    </ClientProvidersServer>
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<EventsPageParams> }): Promise<Metadata> {
  const { locale } = await params;
  return (await PageMetadata.get({ locale })).events;
}

export function generateStaticParams(): EventsPageParams[] {
  if (serverConfiguration.dynamic) {
    return [];
  }

  return serverConfiguration.locales.map((locale) => ({
    locale,
  }));
}
