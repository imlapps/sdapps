import { Either } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document";

export class TextDocument implements Document {
  readonly mimeType = "text/plain";
  private readonly _text: string;

  constructor({ text }: { text: string }) {
    this._text = text;
  }

  @Memoize()
  async buffer(): Promise<Either<Error, Buffer>> {
    return Either.of(Buffer.from(this._text));
  }

  @Memoize()
  async html(): Promise<Either<Error, string>> {
    return Either.of(this._text);
  }

  @Memoize()
  async text(): Promise<Either<Error, string>> {
    return Either.of(this._text);
  }
}
