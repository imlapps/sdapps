import { Hrefs } from "@/lib/Hrefs";
import { PageMetadata } from "@/lib/PageMetadata";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

interface LocalePageParams {
  locale: Locale;
}

export default async function LocalePage({
  params,
}: { params: Promise<LocalePageParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const radioBroadcastServiceIdentifiers = (
    await objectSet.radioBroadcastServiceIdentifiers()
  ).orDefault([]);
  if (radioBroadcastServiceIdentifiers.length === 1) {
    redirect(
      new Hrefs({ basePath: "", locale }).radioBroadcastService({
        identifier: radioBroadcastServiceIdentifiers[0],
      }),
    );
  }

  throw new Error("handle zero or multiple radio broadcast services");
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
