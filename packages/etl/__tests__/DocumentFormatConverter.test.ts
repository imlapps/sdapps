import * as fs from "node:fs/promises";
import path from "node:path";
import * as tmp from "tmp-promise";
import { describe, it } from "vitest";
import { DocumentFormatConverter } from "../src/DocumentFormatConverter";
import { testData } from "./testData";

describe.skipIf(process.env["CI"])("DocumentFormatConverter", async () => {
  [testData.testDocumentFilePaths.pdf].forEach((testDocumentFilePath) => {
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
  });
});
