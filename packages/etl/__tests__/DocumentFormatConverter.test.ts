import * as fs from "node:fs/promises";
import path from "node:path";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";
import { DocumentFormatConverter } from "../src/DocumentFormatConverter";
import { testDocumentFilePaths } from "./paths";

describe.skipIf(process.env["CI"])("DocumentFormatConverter", async () => {
  for (const testDocumentFilePath of [testDocumentFilePaths.pdf]) {
    it(`should convert ${testDocumentFilePath} to PDF`, async () => {
      await tmp.withDir(
        async ({ path: tempDirPath }) => {
          const outputFilePath = path.resolve(tempDirPath, "output.pdf");
          await (
            (await DocumentFormatConverter.create())
              .ifLeft((error) => {
                throw error;
              })
              .extract() as DocumentFormatConverter
          ).convert({
            inputFilePath: testDocumentFilePath,
            outputFilePath,
          });
          (await fs.stat(outputFilePath)).isFile();
        },
        { unsafeCleanup: true },
      );
    });
  }
});
