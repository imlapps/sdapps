import { PageMetadata } from "@/lib/PageMetadata";
import { logger } from "@/lib/logger";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { firstBroadcastEvent } from "@/lib/queries/firstBroadcastEvent";
import { lastBroadcastEvent } from "@/lib/queries/lastBroadcastEvent";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { LocalDate, nativeJs } from "@js-joda/core";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Identifier } from "@sdapps/models";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Either } from "purify-ts";
import "@js-joda/timezone";
import { broadcastTimeZone } from "@/lib/models/broadcastTimeZone";

interface PlaylistPageParams {
  locale: Locale;
  day: string;
  month: string;
  stationIdentifier: string;
  year: string;
}

export default async function PlaylistPage({
  params,
}: {
  params: Promise<PlaylistPageParams>;
}) {
  const {
    locale,
    stationIdentifier,
    day: dayString,
    month: monthString,
    year: yearString,
  } = await params;
  setRequestLocale(locale);

  const date = LocalDate.of(
    Number.parseInt(yearString),
    Number.parseInt(monthString),
    Number.parseInt(dayString),
  );

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

  const broadcastTimeZone_ = broadcastTimeZone(radioBroadcastService);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PlaylistPageParams>;
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

export async function generateStaticParams(): Promise<PlaylistPageParams[]> {
  if (serverConfiguration.dynamic) {
    return [];
  }

  const staticParams: PlaylistPageParams[] = [];

  for (const locale of routing.locales) {
    for (const radioBroadcastService of Either.rights(
      await objectSet.radioBroadcastServiceStubs(),
    )) {
      const broadcastTimeZone_ = broadcastTimeZone(radioBroadcastService);

      const firstBroadcastEventStartDate = (
        await firstBroadcastEvent({
          broadcastService: radioBroadcastService,
        })
      )
        .unsafeCoerce()
        .chain((event) => event.startDate)
        .map((date) => nativeJs(date, broadcastTimeZone_).toLocalDate())
        .extract();
      if (!firstBroadcastEventStartDate) {
        logger.warn(
          "radio broadcast service %s has no first broadcast event",
          Identifier.toString(radioBroadcastService.identifier),
        );
        continue;
      }

      const lastBroadcastEventStartDate = (
        await lastBroadcastEvent({
          broadcastService: radioBroadcastService,
        })
      )
        .unsafeCoerce()
        .chain((event) => event.startDate)
        .map((date) => nativeJs(date, broadcastTimeZone_).toLocalDate())
        .unsafeCoerce();

      if (firstBroadcastEventStartDate.equals(lastBroadcastEventStartDate)) {
        logger.warn(
          "radio broadcast service %s only has a single broadcast event",
          Identifier.toString(radioBroadcastService.identifier),
        );
        continue;
      }

      let date: LocalDate = firstBroadcastEventStartDate;
      while (
        date.isBefore(lastBroadcastEventStartDate) ||
        date.equals(lastBroadcastEventStartDate)
      ) {
        staticParams.push({
          day: date.dayOfMonth().toString().padStart(2, "0"),
          locale,
          month: date.monthValue().toString().padStart(2, "0"),
          stationIdentifier: encodeFileName(
            Identifier.toString(radioBroadcastService.identifier),
          ),
          year: date.year().toString(),
        });

        date = date.plusDays(1);
      }
    }
  }

  return staticParams;
}
