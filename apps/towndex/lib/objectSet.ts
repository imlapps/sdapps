import { dataset } from "@/lib/dataset";
import { GlobalRef } from "@kos-kit/next-utils/server";
import { $ObjectSet, $RdfjsDatasetObjectSet } from "@sdapps/models";

const objectSetGlobalRef = new GlobalRef<$ObjectSet>("objectSet");

if (!objectSetGlobalRef.value) {
  objectSetGlobalRef.value = new $RdfjsDatasetObjectSet({ dataset });
}
export const objectSet: $ObjectSet = objectSetGlobalRef.value;
