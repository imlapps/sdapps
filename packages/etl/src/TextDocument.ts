import { Either } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document";

export class TextDocument extends Document {
  private readonly _text: string;

  constructor({
    text,
    ...superParameters
  }: { text: string } & ConstructorParameters<typeof Document>[0]) {
    super(superParameters);
    this._text = text;
  }

  @Memoize()
  override async buffer(): Promise<Either<Error, Buffer>> {
    return Either.of(Buffer.from(this._text));
  }

  override async html(): Promise<Either<Error, string>> {
    return Either.of(this._text);
  }

  override async text(): Promise<Either<Error, string>> {
    return Either.of(this._text);
  }
}
