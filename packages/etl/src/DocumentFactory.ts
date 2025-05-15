import fs from "node:fs";
import path from "node:path";
import mime from "mime";
import { Logger } from "pino";
import { Either, EitherAsync, Left } from "purify-ts";
import { Document } from "./Document.js";
import { DocumentFormatConverter } from "./DocumentFormatConverter.js";
import { DocumentTextExtractor } from "./DocumentTextExtractor.js";
import { HtmlDocument } from "./HtmlDocument.js";
import { PdfDocument } from "./PdfDocument.js";
import { RichDocument } from "./RichDocument.js";
import { TextDocument } from "./TextDocument.js";
import { convertHtmlToText } from "./convertHtmlToText.js";

export class DocumentFactory {
  private readonly cachesDirectoryPath: string;
  private readonly logger: Logger | undefined;

  constructor({
    cachesDirectoryPath,
    logger,
  }: { cachesDirectoryPath: string; logger?: Logger }) {
    this.cachesDirectoryPath = cachesDirectoryPath;
    this.logger = logger;
  }

  async createDocumentFromBlob({
    blob,
  }: {
    blob: Blob;
  }): Promise<Either<Error, Document>> {
    return this.createDocumentFromBuffer({
      buffer: Buffer.from(await blob.arrayBuffer()),
      mimeType: blob.type,
    });
  }

  async createDocumentFromBuffer({
    buffer,
    mimeType,
  }: {
    buffer: Buffer;
    mimeType: string;
  }): Promise<Either<Error, Document>> {
    switch (mimeType) {
      case "application/pdf":
        return Either.of(
          new PdfDocument({
            buffer,
            documentTextExtractor: await this.documentTextExtractor(),
          }),
        );

      case "text/html":
        return Either.of(
          new HtmlDocument({
            html: buffer.toString("utf-8"),
          }),
        );

      case "text/plain":
        return Either.of(
          new TextDocument({
            text: buffer.toString("utf-8"),
          }),
        );

      case "application/msword":
      case "application/rtf":
      case "application/vnd.oasis.opendocument.text":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "text/rtf":
        return Either.of(
          new RichDocument({
            buffer,
            documentFormatConverter: await this.documentFormatConverter(),
            documentTextExtractor: await this.documentTextExtractor(),
            mimeType,
          }),
        );
      default: {
        const errorMessage = `unrecognized document type: ${mimeType}`;
        this.logger?.warn(errorMessage);
        return Left(new Error(errorMessage));
      }
    }
  }

  async createDocumentFromLocalFile({
    filePath,
  }: { filePath: string }): Promise<Either<Error, Document>> {
    return await EitherAsync(async ({ liftEither }) => {
      const mimeType = mime.getType(filePath);
      if (mimeType === null) {
        const errorMessage = `unable to guess MIME type from file path: ${filePath}`;
        this.logger?.warn(errorMessage);
        throw new Error(errorMessage);
      }

      const buffer = await fs.promises.readFile(filePath);

      return await liftEither(
        await this.createDocumentFromBuffer({
          buffer,
          mimeType,
        }),
      );
    });
  }

  async createDocumentFromString({
    mimeType: mimeTypeParameter,
    string,
  }: { mimeType?: string; string: string }): Promise<Either<Error, Document>> {
    let mimeType: string;
    if (mimeTypeParameter != null) {
      mimeType = mimeTypeParameter;
    } else if (convertHtmlToText(string) !== string) {
      mimeType = "text/html";
    } else {
      mimeType = "text/plain";
    }

    return this.createDocumentFromBuffer({
      buffer: Buffer.from(string),
      mimeType,
    });
  }

  private documentFormatConverter(): Promise<
    Either<Error, DocumentFormatConverter>
  > {
    return DocumentFormatConverter.create({
      cacheDirectoryPath: path.resolve(
        this.cachesDirectoryPath,
        "document-format-conversions",
      ),
      logger: this.logger,
    });
  }

  private documentTextExtractor(): Promise<
    Either<Error, DocumentTextExtractor>
  > {
    return DocumentTextExtractor.create({
      cacheDirectoryPath: path.resolve(this.cachesDirectoryPath, "textract"),
      logger: this.logger,
    });
  }
}
