import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "vitest";
import { DocumentTextExtractor } from "../src/DocumentTextExtractor";
import { testData } from "./testData";

const cachesDirectoryPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "caches",
);

describe.skipIf(process.env["CI"])("DocumentTextExtractor", async () => {
  [testData.testDocumentFilePaths.pdf].forEach((testDocumentFilePath) => {
    it(`should extract text from ${testDocumentFilePath} `, async ({
      expect,
    }) => {
      const result = await (
        (
          await DocumentTextExtractor.create({
            cacheDirectoryPath: path.resolve(cachesDirectoryPath, "textract"),
          })
        )
          .ifLeft((error) => {
            throw error;
          })
          .extract() as DocumentTextExtractor
      ).extractDocumentText(testDocumentFilePath);
      expect(result.html).not.toHaveLength(0);
      expect(result.text).not.toHaveLength(0);
    });
  });
});
