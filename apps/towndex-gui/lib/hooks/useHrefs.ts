import { Hrefs } from "@/lib/Hrefs";
import { useClientConfiguration } from "@/lib/hooks/useClientConfiguration";
import { Locale } from "@/lib/models/Locale";
import { useLocale } from "next-intl";
import { useMemo } from "react";

export function useHrefs(): Hrefs {
  const clientConfiguration = useClientConfiguration();
  const locale = useLocale() as Locale;
  const hrefs = useMemo(
    () =>
      new Hrefs({
        basePath: clientConfiguration.basePath,
        locale,
      }),
    [clientConfiguration, locale],
  );
  return hrefs;
}
