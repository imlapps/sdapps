import { PageMetadata } from "@/lib/PageMetadata";
import { AppShell } from "@/lib/components/AppShell";
import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { getSearchEngineJson } from "@/lib/getSearchEngineJson";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Identifier, displayLabel } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Either } from "purify-ts";

interface PlacePageParams {
  locale: Locale;
  placeIdentifier: string;
}

export default async function PlacePage({
  params,
}: {
  params: Promise<PlacePageParams>;
}) {
  const { placeIdentifier, locale } = await params;
  setRequestLocale(locale);

  const place = (
    await objectSet.place(
      Identifier.fromString(decodeFileName(placeIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!place) {
    notFound();
  }

  const translations = await getTranslations("PlacePage");

  return (
    <ClientProvidersServer>
      <AppShell
        searchEngineJson={await getSearchEngineJson()}
        title={`${translations("Place")}: ${displayLabel(place)}`}
      />
    </ClientProvidersServer>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PlacePageParams>;
}): Promise<Metadata> {
  const { locale, placeIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await objectSet.placeStub(
      Identifier.fromString(decodeFileName(placeIdentifier)),
    )
  )
    .map((place) => pageMetadata.place(place))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<PlacePageParams[]> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: PlacePageParams[] = [];

  for (const locale of routing.locales) {
    for (const place of Either.rights(await objectSet.placeStubs())) {
      staticParams.push({
        placeIdentifier: encodeFileName(Identifier.toString(place.identifier)),
        locale,
      });
    }
  }

  return staticParams;
}
