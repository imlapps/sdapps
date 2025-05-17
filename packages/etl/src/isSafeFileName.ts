import { splitFileName } from "./splitFileName.js";

const regexp = /^[0-9A-Za-z_]+$/;

export function isSafeFileName(fileName: string): boolean {
  const [fileStem, fileExtension] = splitFileName(fileName);
  return (
    fileStem.match(regexp) !== null &&
    (fileExtension.length <= 1 ||
      fileExtension.substring(1).match(regexp) !== null)
  );
}
