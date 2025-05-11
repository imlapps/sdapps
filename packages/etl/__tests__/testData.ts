import path from "node:path";
import { fileURLToPath } from "node:url";

const testDataDirectoryPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "data",
);

const testDocumentFilePath = (key: string) =>
  path.resolve(testDataDirectoryPath, `test_document.${key}`);

export const testData = {
  testDocumentFilePaths: {
    doc: testDocumentFilePath("doc"),
    docx: testDocumentFilePath("docx"),
    html: testDocumentFilePath("html"),
    odt: testDocumentFilePath("odt"),
    pdf: testDocumentFilePath("pdf"),
    rtf: testDocumentFilePath("rtf"),
    txt: testDocumentFilePath("txt"),
  },
};
