import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Identifier, displayLabel } from "@sdapps/models";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Maybe } from "purify-ts";

export class PageMetadata {
  private readonly translations: Awaited<
    ReturnType<typeof getTranslations<"PageMetadata">>
  >;

  private constructor({
    translations,
  }: {
    translations: PageMetadata["translations"];
  }) {
    this.translations = translations;
  }

  static async get({ locale }: { locale: Locale }) {
    return new PageMetadata({
      translations: await getTranslations({
        locale,
        namespace: "PageMetadata",
      }),
    });
  }

  get locale(): Metadata {
    return {
      title: titlePartsToString([serverConfiguration.siteTitle]),
    };
  }

  radioBroadcastService(radioBroadcastService: {
    identifier: Identifier;
    name: Maybe<string>;
  }): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        displayLabel(radioBroadcastService),
      ]),
    };
  }
}

function titlePartsToString(titleParts: readonly string[]): string {
  return titleParts.join(": ");
}
