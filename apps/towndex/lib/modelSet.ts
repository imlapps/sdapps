import { dataset } from "@/lib/dataset";
import { GlobalRef } from "@kos-kit/next-utils/server";
import { ModelSet, RdfjsDatasetModelSet } from "@sdapps/models";

const modelSetGlobalRef = new GlobalRef<ModelSet>("modelSet");

if (!modelSetGlobalRef.value) {
  modelSetGlobalRef.value = new RdfjsDatasetModelSet({ dataset });
}
export const modelSet: ModelSet = modelSetGlobalRef.value;
