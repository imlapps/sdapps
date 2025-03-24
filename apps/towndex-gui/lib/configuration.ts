import { ServerConfiguration } from "@/lib/models/ServerConfiguration";
import { GlobalRef } from "@kos-kit/next-utils/server";
import { existingPathsValidator } from "@kos-kit/next-utils/server/envalidValidators";
import * as envalid from "envalid";

const configurationGlobalRef = new GlobalRef<ServerConfiguration>(
  "configuration",
);
if (!configurationGlobalRef.value) {
  const env = envalid.cleanEnv(process.env, {
    INPUT_DATA_PATHS: existingPathsValidator({ default: [] }),
    INPUT_NEXT_BASE_PATH: envalid.str({ default: "" }),
    INPUT_NEXT_OUTPUT: envalid.str({ default: "" }),
  });

  configurationGlobalRef.value = {
    dataPaths: env.INPUT_DATA_PATHS,
    dynamic: env.INPUT_NEXT_OUTPUT.toLowerCase() === "standalone",
    nextBasePath: env.INPUT_NEXT_BASE_PATH,
  } satisfies ServerConfiguration;
}
export const configuration: ServerConfiguration = configurationGlobalRef.value;
