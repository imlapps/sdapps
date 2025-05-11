import { compile } from "html-to-text";
import { Either } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document";

const convert = compile();

export class HtmlDocument extends Document {
  private readonly _html: string;

  constructor({
    html,
    ...superParameters
  }: { html: string } & ConstructorParameters<typeof Document>[0]) {
    super(superParameters);
    this._html = html;
  }

  @Memoize()
  override async buffer(): Promise<Either<Error, Buffer>> {
    return Either.of(Buffer.from(this._html));
  }

  @Memoize()
  override async html(): Promise<Either<Error, string>> {
    return Either.of(this._html);
  }

  @Memoize()
  override async text(): Promise<Either<Error, string>> {
    return Either.of(convert(this._html));
  }
}
