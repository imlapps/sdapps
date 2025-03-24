import { ClientProviders } from "@/lib/components/ClientProviders";
import { ClientConfiguration } from "@/lib/models/ClientConfiguration";
import { serverConfiguration } from "@/lib/serverConfiguration";
import { Locale } from "@sdapps/models";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";
import React from "react";

/**
 * Server component that passes server data to a ClientProviders component and its children.
 */
export async function ClientProvidersServer({
  children,
}: React.PropsWithChildren) {
  const clientConfiguration: ClientConfiguration = {
    basePath: serverConfiguration.nextBasePath,
  };

  return (
    <ClientProviders
      configuration={clientConfiguration}
      locale={(await getLocale()) as Locale}
      messages={(await getMessages()) as IntlMessages}
      timeZone={await getTimeZone()}
    >
      {children}
    </ClientProviders>
  );
}
