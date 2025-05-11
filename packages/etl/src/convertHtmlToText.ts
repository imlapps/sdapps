import { compile } from "html-to-text";

const convert = compile();

export function convertHtmlToText(html: string): string {
  return convert(html);
}
