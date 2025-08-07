import { loadDataset } from "./loadDataset.js";

export const radioData = {
  dataset: await loadDataset("radioData.ttl"),
};
