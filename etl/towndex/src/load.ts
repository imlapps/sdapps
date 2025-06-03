import { DatasetCore } from "@rdfjs/types";
import { RdfFileLoader } from "@sdapps/etl";

export async function load(
  datasets: AsyncIterable<DatasetCore>,
): Promise<void> {
  return RdfFileLoader.create({
    fd: process.stdout,
    format: "application/trig",
  }).load(datasets);
}
