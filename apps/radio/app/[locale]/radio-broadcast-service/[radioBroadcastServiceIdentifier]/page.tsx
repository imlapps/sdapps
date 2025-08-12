import { PageMetadata } from "@/lib/PageMetadata";
import { getHrefs } from "@/lib/getHrefs";
import { logger } from "@/lib/logger";
import { Locale } from "@/lib/models/Locale";
import { objectSet } from "@/lib/objectSet";
import { lastBroadcastDay } from "@/lib/queries/lastBroadcastDay";
import { routing } from "@/lib/routing";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Identifier } from "@sdapps/models";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

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
    await objectSet.radioBroadcastServiceStub(
      Identifier.fromString(decodeFileName(radioBroadcastServiceIdentifier)),
    )
  )
    .toMaybe()
    .extractNullable();
  if (!radioBroadcastService) {
    notFound();
  }

  const lastBroadcastDay_ = (
    await lastBroadcastDay({
      broadcastService: radioBroadcastService,
    })
  ).unsafeCoerce();
  if (lastBroadcastDay_.isNothing()) {
    logger.warn(
      `radio broadcast service ${Identifier.toString(radioBroadcastService.identifier)} has no last broadcast day`,
    );
    notFound();
  }

  redirect(
    (await getHrefs()).playlist({
      broadcastDay: lastBroadcastDay_.unsafeCoerce(),
      radioBroadcastService,
    }),
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
