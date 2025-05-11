import { Either, Left, Maybe } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document";
import { DocumentTextExtractor } from "./DocumentTextExtractor.js";

export class PdfDocument extends Document {
  private readonly _buffer: Buffer;
  private readonly documentTextExtractor: Maybe<DocumentTextExtractor>;

  constructor({
    buffer,
    documentTextExtractor,
    ...superParameters
  }: {
    buffer: Buffer;
    documentTextExtractor: Maybe<DocumentTextExtractor>;
  } & Omit<ConstructorParameters<typeof Document>[0], "mimeType">) {
    super({ ...superParameters, mimeType: "application/pdf" });
    this._buffer = buffer;
    this.documentTextExtractor = documentTextExtractor;
  }

  @Memoize()
  override async buffer(): Promise<Either<Error, Buffer>> {
    return Either.of(this._buffer);
  }

  @Memoize()
  override async html(): Promise<Either<Error, string>> {
    return (await this.extractDocumentText()).map((result) => result.html);
  }

  @Memoize()
  override async text(): Promise<Either<Error, string>> {
    return (await this.extractDocumentText()).map((result) => result.text);
  }

  @Memoize()
  private async extractDocumentText(): Promise<
    Either<Error, DocumentTextExtractor.Result>
  > {
    if (!this.documentTextExtractor.isJust()) {
      return Left(new Error("no document text extractor configured"));
    }
  }
}
