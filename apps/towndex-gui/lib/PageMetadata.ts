import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export class PageMetadata {
  private readonly _locale: Locale;
  private readonly translations: Awaited<
    ReturnType<typeof getTranslations<"PageMetadata">>
  >;

  private constructor({
    locale,
    translations,
  }: {
    locale: Locale;
    translations: PageMetadata["translations"];
  }) {
    this._locale = locale;
    this.translations = translations;
  }

  static async get({ locale }: { locale: Locale }) {
    return new PageMetadata({
      locale,
      translations: await getTranslations({
        locale,
        namespace: "PageMetadata",
      }),
    });
  }

  get locale(): Metadata {
    return {
      title: titlePartsToString(["Towndex", serverConfiguration.siteTitle]),
    };
  }

  get people(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("People"),
      ]),
    };
  }
}

function titlePartsToString(titleParts: readonly string[]): string {
  return titleParts.join(": ");
}
