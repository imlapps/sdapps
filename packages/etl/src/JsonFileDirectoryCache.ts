import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { TextFileDirectoryCache } from "./TextFileDirectoryCache.js";

export class JsonFileDirectoryCache<JsonT> {
  private readonly parseJson: (json: unknown) => Promise<Either<Error, JsonT>>;
  private readonly delegate: TextFileDirectoryCache;

  constructor({
    directoryPath,
    logger,
    parseJson,
  }: {
    directoryPath: string;
    logger?: Logger;
    parseJson: (json: unknown) => Promise<Either<Error, JsonT>>;
  }) {
    this.delegate = new TextFileDirectoryCache({
      directoryPath,
      fileExtension: ".json",
      logger,
    });
    this.parseJson = parseJson;
  }

  async get(key: string): Promise<Either<Error, Maybe<JsonT>>> {
    return EitherAsync(async ({ liftEither }) => {
      const textEither = await this.delegate.get(key);
      if (textEither.isLeft()) {
        return await liftEither(textEither);
      }

      const textMaybe = textEither.unsafeCoerce();
      if (textMaybe.isNothing()) {
        return textMaybe;
      }

      const parseResult = await this.parseJson(
        JSON.parse(textMaybe.unsafeCoerce()),
      );
      if (parseResult.isRight()) {
        // this.logger?.trace(
        //   `successfully parsed cache file ${filePath}:\n${JSON.stringify(parseResult.unsafeCoerce())}`,
        // );
        return parseResult.toMaybe();
      }

      return Maybe.empty();
    });
  }

  async set(key: string, value: JsonT): Promise<Either<Error, void>> {
    return this.delegate.set(key, JSON.stringify(value));
  }
}
