import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
      title: titlePartsToString(["Towndex", serverConfiguration.siteTitle]),
    };
  }

  get organizations(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("Organizations"),
      ]),
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
