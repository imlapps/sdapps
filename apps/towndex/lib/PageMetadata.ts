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

  event(event: {
    identifier: Identifier;
    name: Maybe<string>;
  }): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("Event"),
        displayLabel(event),
      ]),
    };
  }

  get events(): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("Events"),
      ]),
    };
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

  organization(organization: {
    identifier: Identifier;
    name: Maybe<string>;
  }): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("Organization"),
        organization.name.orDefault(
          Identifier.toString(organization.identifier),
        ),
      ]),
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

  person(person: {
    identifier: Identifier;
    name: Maybe<string>;
  }): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("Person"),
        displayLabel(person),
      ]),
    };
  }

  place(place: {
    identifier: Identifier;
    name: Maybe<string>;
  }): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("Place"),
        displayLabel(place),
      ]),
    };
  }

  report(report: {
    identifier: Identifier;
    name: Maybe<string>;
  }): Metadata {
    return {
      title: titlePartsToString([
        this.locale.title as string,
        this.translations("Report"),
        displayLabel(report),
      ]),
    };
  }
}

function titlePartsToString(titleParts: readonly string[]): string {
  return titleParts.join(": ");
}
