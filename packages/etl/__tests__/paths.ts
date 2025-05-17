import path from "node:path";
import { fileURLToPath } from "node:url";

const thisDirectoryPath = path.dirname(fileURLToPath(import.meta.url));

export const cachesDirectoryPath = path.join(thisDirectoryPath, "caches");

export const dataDirectoryPath = path.join(thisDirectoryPath, "data");

const testDocumentFilePath = (key: string) =>
  path.resolve(dataDirectoryPath, `test_document.${key}`);

export const testDocumentFilePaths = {
  doc: testDocumentFilePath("doc"),
  docx: testDocumentFilePath("docx"),
  html: testDocumentFilePath("html"),
  odt: testDocumentFilePath("odt"),
  pdf: testDocumentFilePath("pdf"),
  rtf: testDocumentFilePath("rtf"),
  txt: testDocumentFilePath("txt"),
};
