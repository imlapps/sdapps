import { fileNameCodec } from "./fileNameCodec.js";
import { splitFileName } from "./splitFileName.js";

/**
 * Decode a file name from file name-safe characters, preserving its extension.
 */
export const decodeFileName = (value: string): string => {
  const [encodedFileStem, fileExtension] = splitFileName(value);
  return (
    fileNameCodec.decode(encodedFileStem).toString("utf-8") + fileExtension
  );
};
