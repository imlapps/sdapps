import path from "node:path";
import { Logger } from "pino";
import { Either, Left } from "purify-ts";
import { DocumentFormatConverter } from "./DocumentFormatConverter.js";
import { DocumentTextExtractor } from "./DocumentTextExtractor.js";
import { HtmlDocument } from "./HtmlDocument.js";
import { PdfDocument } from "./PdfDocument.js";
import { RichDocument } from "./RichDocument.js";
import { TextDocument } from "./TextDocument.js";

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

  async createDocument({
    buffer,
    mimeType,
  }: {
    buffer: Buffer;
    mimeType: string;
  }): Promise<Document> {
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
