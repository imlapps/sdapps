import { ClientConfigurationContext } from "@/lib/contexts/ClientConfigurationContext";
import { useContext } from "react";

export function useClientConfiguration() {
  return useContext(ClientConfigurationContext);
}
