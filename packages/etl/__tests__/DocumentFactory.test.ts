import fs from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";
import { DocumentFactory } from "../src/DocumentFactory";
import { cachesDirectoryPath, testDocumentFilePaths } from "./paths";

describe("DocumentFactory", async () => {
  const sut = new DocumentFactory({
    cachesDirectoryPath,
  });
  const testDocumentHtml = (
    await fs.promises.readFile(testDocumentFilePaths.html)
  )
    .toString()
    .trim();
  const testDocumentText = (
    await fs.promises.readFile(testDocumentFilePaths.txt)
  )
    .toString()
    .trim();

  for (const testDocumentFilePath of Object.values(testDocumentFilePaths)) {
    it(`should create a document from a local file ${testDocumentFilePath}`, async ({
      expect,
    }) => {
      switch (path.extname(testDocumentFilePath)) {
        case ".html":
        case ".txt":
          break;
        default:
          if (process.env["CI"]) {
            return;
          }
          break;
      }

      const document = (
        await sut.createDocumentFromLocalFile({
          filePath: testDocumentFilePath,
        })
      ).unsafeCoerce();

      switch (path.extname(testDocumentFilePath)) {
        case ".html":
          expect((await document.html()).unsafeCoerce()).toStrictEqual(
            testDocumentHtml,
          );
          break;
        case ".txt":
          expect((await document.text()).unsafeCoerce().trim()).toStrictEqual(
            testDocumentText,
          );
          break;
        default:
          expect((await document.html()).unsafeCoerce()).to.include(
            "Test document",
          );
          expect((await document.text()).unsafeCoerce()).to.include(
            "Test document",
          );
          break;
      }
    });
  }

  it("should create a document from HTML string (no MIME type)", async ({
    expect,
  }) => {
    const document = (
      await sut.createDocumentFromString({
        string: testDocumentHtml,
      })
    ).unsafeCoerce();
    expect((await document.html()).unsafeCoerce()).toStrictEqual(
      testDocumentHtml,
    );
    expect((await document.text()).unsafeCoerce()).toStrictEqual(
      testDocumentText,
    );
  });

  it("should create a document from plaintext string (no MIME type)", async ({
    expect,
  }) => {
    const document = (
      await sut.createDocumentFromString({
        string: testDocumentText,
      })
    ).unsafeCoerce();
    expect((await document.html()).unsafeCoerce()).toStrictEqual(
      testDocumentText,
    );
    expect((await document.text()).unsafeCoerce()).toStrictEqual(
      testDocumentText,
    );
  });

  it("should create a document from plaintext string (explicit text/html type)", async ({
    expect,
  }) => {
    const document = (
      await sut.createDocumentFromString({
        mimeType: "text/html",
        string: testDocumentText,
      })
    ).unsafeCoerce();
    expect((await document.html()).unsafeCoerce()).toStrictEqual(
      testDocumentText,
    );
    expect((await document.text()).unsafeCoerce()).toStrictEqual(
      testDocumentText,
    );
  });
});
