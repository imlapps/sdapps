import fs from "node:fs";
import path from "node:path";
import mime from "mime";
import { Either, EitherAsync, Left, Maybe } from "purify-ts";
import * as tmp from "tmp-promise";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document.js";
import { DocumentFormatConverter } from "./DocumentFormatConverter.js";
import { DocumentTextExtractor } from "./DocumentTextExtractor.js";
import { PdfDocument } from "./PdfDocument.js";

export class RichDocument implements Document {
  private readonly _buffer: Buffer;
  private readonly documentFormatConverter: Maybe<DocumentFormatConverter>;
  private readonly documentTextExtractor: Maybe<DocumentTextExtractor>;
  readonly mimeType: string;

  constructor({
    buffer,
    documentFormatConverter,
    documentTextExtractor,
    mimeType,
  }: {
    buffer: Buffer;
    documentFormatConverter: Maybe<DocumentFormatConverter>;
    documentTextExtractor: Maybe<DocumentTextExtractor>;
    mimeType: string;
  }) {
    this._buffer = buffer;
    this.documentFormatConverter = documentFormatConverter;
    this.documentTextExtractor = documentTextExtractor;
    this.mimeType = mimeType;
  }

  @Memoize()
  async buffer(): Promise<Either<Error, Buffer>> {
    return Either.of(this._buffer);
  }

  @Memoize()
  async html(): Promise<Either<Error, string>> {
    return EitherAsync(async ({ liftEither }) => {
      const pdfDocument = await liftEither(await this.pdfDocument());
      return liftEither(await pdfDocument.html());
    });
  }

  @Memoize()
  private async pdfDocument(): Promise<Either<Error, PdfDocument>> {
    if (!this.documentFormatConverter.isJust()) {
      return Left(new Error("no document format converter configured"));
    }

    return await tmp.withDir(
      async ({ path: tempDirectoryPath }) => {
        const tempInputFilePath = path.resolve(
          tempDirectoryPath,
          `temp.${mime.getExtension(this.mimeType)}`,
        );
        await fs.promises.writeFile(tempInputFilePath, this._buffer);

        const tempPdfFilePath = path.resolve(tempDirectoryPath, "temp.pdf");

        const conversionResult = await this.documentFormatConverter
          .unsafeCoerce()
          .convert({
            inputFilePath: tempInputFilePath,
            outputFilePath: tempPdfFilePath,
          });
        if (conversionResult.isLeft()) {
          return conversionResult;
        }

        const pdfBuffer = await fs.promises.readFile(tempPdfFilePath);

        return Either.of(
          new PdfDocument({
            buffer: pdfBuffer,
            documentTextExtractor: this.documentTextExtractor,
          }),
        );
      },
      {
        unsafeCleanup: true,
      },
    );
  }

  @Memoize()
  async text(): Promise<Either<Error, string>> {
    return EitherAsync(async ({ liftEither }) => {
      const pdfDocument = await liftEither(await this.pdfDocument());
      return liftEither(await pdfDocument.text());
    });
  }
}
