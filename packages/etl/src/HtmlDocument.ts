import { compile } from "html-to-text";
import { Either } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { Document } from "./Document";

const convert = compile();

export class HtmlDocument implements Document {
  private readonly _html: string;
  readonly mimeType = "text/html";

  constructor({ html }: { html: string }) {
    this._html = html;
  }

  @Memoize()
  async buffer(): Promise<Either<Error, Buffer>> {
    return Either.of(Buffer.from(this._html));
  }

  @Memoize()
  async html(): Promise<Either<Error, string>> {
    return Either.of(this._html);
  }

  @Memoize()
  async text(): Promise<Either<Error, string>> {
    return Either.of(convert(this._html));
  }
}
