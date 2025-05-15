import { Either } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document.js";
import { DocumentTextExtractor } from "./DocumentTextExtractor.js";

export class PdfDocument implements Document {
  private readonly _buffer: Buffer;
  private readonly documentTextExtractor: Either<Error, DocumentTextExtractor>;
  readonly mimeType = "application/pdf";

  constructor({
    buffer,
    documentTextExtractor,
  }: {
    buffer: Buffer;
    documentTextExtractor: Either<Error, DocumentTextExtractor>;
  }) {
    this._buffer = buffer;
    this.documentTextExtractor = documentTextExtractor;
  }

  @Memoize()
  async buffer(): Promise<Either<Error, Buffer>> {
    return Either.of(this._buffer);
  }

  @Memoize()
  async html(): Promise<Either<Error, string>> {
    return (await this.extractDocumentText()).map((result) => result.html);
  }

  @Memoize()
  async text(): Promise<Either<Error, string>> {
    return (await this.extractDocumentText()).map((result) => result.text);
  }

  @Memoize()
  private async extractDocumentText(): Promise<
    Either<Error, DocumentTextExtractor.Result>
  > {
    return this.documentTextExtractor
      .unsafeCoerce()
      .extractDocumentText(this._buffer);
  }
}
