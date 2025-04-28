import { Locale } from "@/lib/models/Locale";
import { defineRouting } from "next-intl/routing";

const defaultLocale: Locale = "en";
const locales: Locale[] = ["en"];

export const routing = defineRouting({
  defaultLocale,
  // localePrefix: "as-needed",
  locales,
});
