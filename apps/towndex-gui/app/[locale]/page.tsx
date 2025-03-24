import { PageMetadata } from "@/lib/PageMetadata";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

interface LocalePageParams {
  locale: Locale;
}

export default async function LocalePage({
  params: { locale },
}: {
  params: LocalePageParams;
}) {
  setRequestLocale(locale);

  const kos = await kosFactory({
    locale,
  });
  const conceptSchemeIdentifiers = await kos.conceptSchemeIdentifiers({
    limit: null,
    offset: 0,
    query: { type: "All" },
  });
  if (conceptSchemeIdentifiers.length === 1) {
    const conceptScheme = (
      await kos.conceptScheme(conceptSchemeIdentifiers[0])
    ).unsafeCoerce();
    return <ConceptSchemePage conceptScheme={conceptScheme} kos={kos} />;
  }
  throw new RangeError(
    `TODO: generate concept scheme links for ${conceptSchemeIdentifiers.length} concept schemes`,
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: LocalePageParams;
}): Promise<Metadata> {
  return (await PageMetadata.get({ locale })).locale;
}

export function generateStaticParams(): LocalePageParams[] {
  if (serverConfiguration.dynamic) {
    return [];
  }

  return serverConfiguration.locales.map((locale) => ({
    locale,
  }));
}
