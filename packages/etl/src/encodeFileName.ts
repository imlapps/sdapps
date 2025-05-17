import { fileNameCodec } from "./fileNameCodec.js";
import { isSafeFileName } from "./isSafeFileName.js";
import { splitFileName } from "./splitFileName.js";

/**
 * Encode a file name to file name-safe characters, preserving its extension.
 */
export const encodeFileName = (fileName: string): string => {
  const [fileStem, fileExtension] = splitFileName(fileName);
  if (fileExtension.length <= 1 || isSafeFileName(fileExtension.substring(1))) {
    return fileNameCodec.encode(Buffer.from(fileStem, "utf-8")) + fileExtension;
  }
  // Unsafe file extension, encode the entire file name
  return fileNameCodec.encode(Buffer.from(fileName, "utf-8"));
};
