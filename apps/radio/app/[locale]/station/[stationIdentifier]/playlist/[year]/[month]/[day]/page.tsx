import { PageMetadata } from "@/lib/PageMetadata";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { firstBroadcastDay } from "@/lib/queries/firstBroadcastEvent";
import { lastBroadcastEvent } from "@/lib/queries/lastBroadcastEvent";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { TZDateMini } from "@date-fns/tz";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Identifier } from "@sdapps/models";
import { addDays } from "date-fns";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Either } from "purify-ts";

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

  const day = Number.parseInt(dayString);
  const month = Number.parseInt(monthString);
  const year = Number.parseInt(yearString);

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

  const date = new TZDateMini(
    year,
    month - 1,
    day,
    radioBroadcastService.broadcastTimezone.orDefault("UTC"),
  );
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
      const firstBroadcastDay_ = (
        await firstBroadcastDay({
          broadcastService: radioBroadcastService,
        })
      )
        .unsafeCoerce()
        .extract();
      const lastBroadcastDay_ = (
        await lastBroadcastEvent({
          broadcastService: radioBroadcastService,
        })
      )
        .unsafeCoerce()
        .extract();

      if (!firstBroadcastDay_ || !lastBroadcastDay_) {
        continue;
      }

      const timeZone = radioBroadcastService.broadcastTimezone.orDefault("UTC");

      let broadcastDay = firstBroadcastDay_;
      while (broadcastDay.getTime() !== lastBroadcastDay_.getTime()) {
        staticParams.push({
          day: (timeZone === "UTC"
            ? broadcastDay.getUTCDate()
            : broadcastDay.getDate()
          )
            .toString()
            .padStart(2, "0"),
          locale,
          month: (
            (timeZone === "UTC"
              ? broadcastDay.getUTCMonth()
              : broadcastDay.getMonth()) + 1
          )
            .toString()
            .padStart(2, "0"),
          stationIdentifier: encodeFileName(
            Identifier.toString(radioBroadcastService.identifier),
          ),
          year: (timeZone === "UTC"
            ? broadcastDay.getUTCFullYear()
            : broadcastDay.getFullYear()
          ).toString(),
        });

        broadcastDay = addDays(broadcastDay, 1);
      }
    }
  }

  return staticParams;
}
