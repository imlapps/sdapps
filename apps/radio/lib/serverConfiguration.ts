import { ServerConfiguration } from "@/lib/models/ServerConfiguration";
import { routing } from "@/lib/routing";
import { GlobalRef } from "@kos-kit/next-utils/server";
import { existingPathsValidator } from "@kos-kit/next-utils/server/envalidValidators";
import * as envalid from "envalid";
const serverConfigurationGlobalRef = new GlobalRef<ServerConfiguration>(
  "configuration",
);
if (!serverConfigurationGlobalRef.value) {
  const env = envalid.cleanEnv(process.env, {
    INPUT_CACHES_DIRECTORY_PATH: envalid.str({ default: ".caches" }),
    INPUT_DATA_PATHS: existingPathsValidator({ default: [] }),
    INPUT_NEXT_BASE_PATH: envalid.str({ default: "" }),
    INPUT_NEXT_OUTPUT: envalid.str({ default: "" }),
    INPUT_SITE_TITLE: envalid.str({ default: "Untitled" }),
  });

  serverConfigurationGlobalRef.value = {
    cachesDirectoryPath: env.INPUT_CACHES_DIRECTORY_PATH,
    dataPaths: env.INPUT_DATA_PATHS,
    defaultLocale: routing.defaultLocale,
    dynamic: env.INPUT_NEXT_OUTPUT.toLowerCase() === "standalone",
    locales: routing.locales,
    nextBasePath: env.INPUT_NEXT_BASE_PATH,
    siteTitle: env.INPUT_SITE_TITLE,
  } satisfies ServerConfiguration;
}
export const serverConfiguration: ServerConfiguration =
  serverConfigurationGlobalRef.value;
