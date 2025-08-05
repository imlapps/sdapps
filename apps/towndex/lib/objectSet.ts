import { dataset } from "@/lib/dataset";
import { GlobalRef } from "@kos-kit/next-utils/server";
import { $ObjectSet, $RdfjsDatasetObjectSet } from "@sdapps/models";

const modelSetGlobalRef = new GlobalRef<$ObjectSet>("objectSet");

if (!modelSetGlobalRef.value) {
  modelSetGlobalRef.value = new $RdfjsDatasetObjectSet({ dataset });
}
export const objectSet: $ObjectSet = modelSetGlobalRef.value;
