import { Locale } from "@/lib/models/Locale";

export interface ServerConfiguration {
  readonly dataPaths: readonly string[];
  readonly defaultLocale: Locale;
  readonly dynamic: boolean;
  readonly locales: readonly Locale[];
  readonly nextBasePath: string;
  readonly siteTitle: string;
}
