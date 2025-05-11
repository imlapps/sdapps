import { Either, Left, Maybe } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document.js";
import { DocumentTextExtractor } from "./DocumentTextExtractor.js";

export class PdfDocument implements Document {
  private readonly _buffer: Buffer;
  private readonly documentTextExtractor: Maybe<DocumentTextExtractor>;
  readonly mimeType = "application/pdf";

  constructor({
    buffer,
    documentTextExtractor,
  }: {
    buffer: Buffer;
    documentTextExtractor: Maybe<DocumentTextExtractor>;
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
    if (!this.documentTextExtractor.isJust()) {
      return Left(new Error("no document text extractor configured"));
    }

    return this.documentTextExtractor
      .unsafeCoerce()
      .extractDocumentText(this._buffer);
  }
}
