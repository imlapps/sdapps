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
        await this.createDocument({
          buffer,
          mimeType,
        }),
      );
    });
  }

  async createDocumentFromText({
    mimeType: mimeTypeParameter,
    text,
  }: { mimeType?: string; text: string }): Promise<Either<Error, Document>> {
    let mimeType: string;
    if (mimeTypeParameter != null) {
      mimeType = mimeTypeParameter;
    } else if (convertHtmlToText(text) !== text) {
      mimeType = "text/html";
    } else {
      mimeType = "text/plain";
    }

    return this.createDocument({
      buffer: Buffer.from(text),
      mimeType,
    });
  }

  private async createDocument({
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
            documentTextExtractor: (
              await this.documentTextExtractor()
            ).toMaybe(),
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
            documentFormatConverter: (
              await this.documentFormatConverter()
            ).toMaybe(),
            documentTextExtractor: (
              await this.documentTextExtractor()
            ).toMaybe(),
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

  private documentFormatConverter(): Promise<
    Either<Error, DocumentFormatConverter>
  > {
    return DocumentFormatConverter.create({
      cacheDirectoryPath: path.resolve(
        this.cachesDirectoryPath,
        "document-format-conversions",
      ),
    });
  }

  private documentTextExtractor(): Promise<
    Either<Error, DocumentTextExtractor>
  > {
    return DocumentTextExtractor.create({
      cacheDirectoryPath: path.resolve(this.cachesDirectoryPath, "textract"),
    });
  }
}
