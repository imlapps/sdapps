import { PageMetadata } from "@/lib/PageMetadata";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Locale } from "@/lib/models/Locale";
import { broadcastTimeZone } from "@/lib/models/broadcastTimeZone";
import { objectSet } from "@/lib/objectSet";
import { lastBroadcastEvent } from "@/lib/queries/lastBroadcastEvent";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { nativeJs } from "@js-joda/core";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Identifier } from "@sdapps/models";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

interface StationPageParams {
  locale: Locale;
  stationIdentifier: string;
}

export default async function StationPage({
  params,
}: {
  params: Promise<StationPageParams>;
}) {
  const { locale, stationIdentifier } = await params;
  setRequestLocale(locale);

  const radioBroadcastService = (
    await objectSet.radioBroadcastServiceStub(
      Identifier.fromString(decodeFileName(stationIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!radioBroadcastService) {
    notFound();
  }

  const lastBroadcastDate = (
    await lastBroadcastEvent({
      broadcastService: radioBroadcastService,
    })
  )
    .unsafeCoerce()
    .chain((event) => event.startDate)
    .map(nativeJs)
    .map((_) => _.withZoneSameLocal(broadcastTimeZone(radioBroadcastService)))
    .map((_) => _.toLocalDate());
  if (lastBroadcastDate.isNothing()) {
    logger.warn(
      `radio broadcast service ${Identifier.toString(radioBroadcastService.$identifier)} has no last broadcast event`,
    );
    notFound();
  }

  redirect(
    (await getHrefs()).playlist({
      date: lastBroadcastDate.unsafeCoerce(),
      radioBroadcastService,
    }),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<StationPageParams>;
}): Promise<Metadata> {
  const { locale, stationIdentifier } = await params;

  const pageMetadata = await PageMetadata.get({ locale });

  return (
    await objectSet.radioBroadcastServiceStub(
      Identifier.fromString(decodeFileName(stationIdentifier)),
    )
  )
    .map((radioBroadcastService) =>
      pageMetadata.radioBroadcastService(radioBroadcastService),
    )
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<StationPageParams[]> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: StationPageParams[] = [];

  for (const locale of routing.locales) {
    for (const stationIdentifier of (
      await objectSet.radioBroadcastServiceIdentifiers()
    ).orDefault([])) {
      staticParams.push({
        stationIdentifier: encodeFileName(
          Identifier.toString(stationIdentifier),
        ),
        locale,
      });
    }
  }

  return staticParams;
}
