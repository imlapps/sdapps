import fs from "node:fs";
import path from "node:path";
import mime from "mime";
import { describe, it } from "vitest";
import { DocumentTextExtractor } from "../src/DocumentTextExtractor";
import { cachesDirectoryPath, testDocumentFilePaths } from "./paths";

describe.skipIf(process.env["CI"])("DocumentTextExtractor", async () => {
  for (const testDocumentFilePath of [testDocumentFilePaths.pdf]) {
    it(`should extract text from ${testDocumentFilePath} `, async ({
      expect,
    }) => {
      const mimeType = mime.getType(testDocumentFilePath);
      expect(mimeType).not.toBeNull();

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
        ).extractDocumentText({
          bytes: await fs.promises.readFile(testDocumentFilePath),
          mimeType: mimeType!,
        })
      ).unsafeCoerce();
      expect(result.html).not.toHaveLength(0);
      expect(result.text).not.toHaveLength(0);
    });
  }
});
