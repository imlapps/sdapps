import { ClientConfiguration } from "@/lib/models/ClientConfiguration";
import { createContext } from "react";

export const ClientConfigurationContext = createContext<ClientConfiguration>({
  basePath: "",
  siteTitle: "",
});
