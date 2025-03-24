import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  return {
    locale: locale ?? "en",
    messages: (await import(`./lib/translations/${locale}.json`)).default,
    timeZone: "America/New_York",
  };
});
