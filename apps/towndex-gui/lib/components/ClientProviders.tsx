"use client";

import { MantineProvider } from "@mantine/core";

import { ClientConfigurationContext } from "@/lib/contexts/ClientConfigurationContext";
import { ClientConfiguration } from "@/lib/models/ClientConfiguration";
import { theme } from "@/lib/theme";
import { Locale } from "@sdapps/models";
import { NextIntlClientProvider } from "next-intl";
import { NuqsAdapter } from "nuqs/adapters/next";
import React from "react";
// @ts-ignore
import TimeZone from "use-intl/dist/types/src/core/TimeZone";

/**
 * Client component that provides context to other client components.
 */
export function ClientProviders({
  children,
  configuration,
  locale,
  messages,
  timeZone,
}: React.PropsWithChildren<{
  configuration: ClientConfiguration;
  locale: Locale;
  messages: IntlMessages;
  timeZone: TimeZone;
}>) {
  return (
    <ClientConfigurationContext.Provider value={configuration}>
      <MantineProvider theme={theme}>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={timeZone}
        >
          <NuqsAdapter>{children}</NuqsAdapter>
        </NextIntlClientProvider>
      </MantineProvider>
    </ClientConfigurationContext.Provider>
  );
}
