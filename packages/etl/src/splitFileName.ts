/**
 * Split a file name into its stem and .-prefixed extension.
 */
export function splitFileName(fileName: string): readonly string[] {
  const split = fileName.split(".");
  if (split.length === 1) {
    return [fileName, ""];
  }
  return [
    split.slice(0, split.length - 1).join("."),
    `.${split[split.length - 1]}`,
  ];
}
