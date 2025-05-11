import fs from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";
import { DocumentTextExtractor } from "../src/DocumentTextExtractor";
import { cachesDirectoryPath, testDocumentFilePaths } from "./paths";

describe.skipIf(process.env["CI"])("DocumentTextExtractor", async () => {
  [testDocumentFilePaths.pdf].forEach((testDocumentFilePath) => {
    it(`should extract text from ${testDocumentFilePath} `, async ({
      expect,
    }) => {
      const result = (
        await (
          (
            await DocumentTextExtractor.create({
              cacheDirectoryPath: path.resolve(cachesDirectoryPath, "textract"),
            })
          )
            .ifLeft((error) => {
              throw error;
            })
            .extract() as DocumentTextExtractor
        ).extractDocumentText(await fs.promises.readFile(testDocumentFilePath))
      ).unsafeCoerce();
      expect(result.html).not.toHaveLength(0);
      expect(result.text).not.toHaveLength(0);
    });
  });
});
