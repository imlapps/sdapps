import { Hrefs } from "@/lib/Hrefs";
import { Locale } from "@/lib/models/Locale";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { getLocale } from "next-intl/server";

/**
 * Get an Hrefs instance on the server.
 */
export async function getHrefs(kwds?: { locale?: Locale }): Promise<Hrefs> {
  return new Hrefs({
    basePath: serverConfiguration.nextBasePath,
    locale: kwds?.locale ?? ((await getLocale()) as Locale),
  });
}
