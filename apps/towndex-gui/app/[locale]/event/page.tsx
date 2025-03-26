import { PageMetadata } from "@/lib/PageMetadata";
import { EventsTimeline } from "@/lib/components/EventsTimeline";
import { MainSectionShell } from "@/lib/components/MainSectionShell";
import { modelSet } from "@/lib/modelSet";
import { Locale } from "@/lib/models/Locale";
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

  const events = (await modelSet.models<EventStub>("EventStub")).orDefault([]);
  const translations = await getTranslations("EventsPage");

  return (
    <MainSectionShell title={translations("Events")}>
      <EventsTimeline
        events={events.flatMap((event) =>
          event.superEvent.isJust() ? [event.toJson()] : [],
        )}
      />
    </MainSectionShell>
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
