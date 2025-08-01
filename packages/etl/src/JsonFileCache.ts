import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { TextFileCache } from "./TextFileCache.js";

export class JsonFileCache<JsonT> {
  private readonly parseJson: (json: unknown) => Promise<Either<Error, JsonT>>;
  private readonly textFileCache: TextFileCache;

  constructor({
    directoryPath,
    logger,
    parseJson,
  }: {
    directoryPath: string;
    logger?: Logger;
    parseJson: (json: unknown) => Promise<Either<Error, JsonT>>;
  }) {
    this.parseJson = parseJson;
    this.textFileCache = new TextFileCache({
      directoryPath,
      fileExtension: ".json",
      logger,
    });
  }

  async get(key: string): Promise<Either<Error, Maybe<JsonT>>> {
    return EitherAsync(async ({ liftEither }) => {
      const textEither = await this.textFileCache.get(key);
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
    return this.textFileCache.set(key, JSON.stringify(value));
  }
}
