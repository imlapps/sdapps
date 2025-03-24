import { Locale } from "@/lib/models/Locale";
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

  get locale(): Metadata {
    return {
      title: "Towndex",
    };
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
}

// function titlePartsToString(titleParts: readonly string[]): string {
//   return titleParts.join(": ");
// }
