import {
  AnalyzeDocumentCommand,
  FeatureType,
  TextractClient,
} from "@aws-sdk/client-textract";
import {
  ApiDetectDocumentTextResponse,
  TextractDocument,
} from "amazon-textract-response-parser";

import * as fs from "node:fs";
import * as path from "node:path";
import { fsEither } from "@kos-kit/next-utils/server";
import * as envalid from "envalid";
import { sha256 } from "js-sha256";
import { Logger } from "pino";
import { Either, Left, Right } from "purify-ts";
import invariant from "ts-invariant";
import { Memoize } from "typescript-memoize";

export class DocumentTextExtractor {
  private readonly cacheDirectoryPath: string;
  private readonly features: readonly FeatureType[];
  private readonly logger: Logger | undefined;
  private readonly textractClient: TextractClient;

  private constructor({
    cacheDirectoryPath,
    logger,
    features,
    textractClient,
  }: {
    cacheDirectoryPath: string;
    features: readonly FeatureType[];
    logger: Logger | undefined;
    textractClient: TextractClient;
  }) {
    this.cacheDirectoryPath = cacheDirectoryPath;
    this.features = features;
    this.logger = logger;
    this.textractClient = textractClient;
  }

  static async create({
    cacheDirectoryPath,
    logger,
  }: {
    cacheDirectoryPath: string;
    logger?: Logger;
  }): Promise<Either<Error, DocumentTextExtractor>> {
    let textractClient: TextractClient;
    try {
      textractClient = new TextractClient();
      await textractClient.config.credentials();
      await textractClient.config.region();
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }

    const features = envalid.cleanEnv(process.env, {
      AWS_TEXTRACT_FEATURES: envalid.makeExactValidator<readonly FeatureType[]>(
        (value: string) => {
          if (value.length === 0) {
            return ["LAYOUT"];
          }

          return value
            .toUpperCase()
            .split(",")
            .map((featureString) => {
              switch (featureString) {
                case "FORMS":
                case "LAYOUT":
                case "QUERIES":
                case "SIGNATURES":
                case "TABLES":
                  return featureString;
                default:
                  throw new Error(`invalid Textract feature: ${featureString}`);
              }
            });
        },
      )({ default: ["LAYOUT"] }),
    }).AWS_TEXTRACT_FEATURES;

    return Right(
      new DocumentTextExtractor({
        cacheDirectoryPath,
        features,
        logger,
        textractClient,
      }),
    );
  }

  async extractDocumentText(
    documentFilePath: string,
  ): Promise<DocumentTextExtractor.Result> {
    const documentBuffer = await fs.promises.readFile(documentFilePath);

    const documentSha256HashHexDigest = sha256(documentBuffer);

    const documentCacheDirectoryPath = path.resolve(
      this.cacheDirectoryPath,
      documentSha256HashHexDigest,
      this.features.concat().sort().join("-"),
    );
    this.logger?.debug(
      "creating document cache directory %s",
      documentCacheDirectoryPath,
    );
    await fs.promises.mkdir(documentCacheDirectoryPath, { recursive: true });
    this.logger?.debug(
      "created document cache directory %s",
      documentCacheDirectoryPath,
    );

    const resultHtmlFilePath = path.resolve(
      documentCacheDirectoryPath,
      `${documentSha256HashHexDigest}.html`,
    );
    const resultHtmlFileExists = (await fsEither.stat(resultHtmlFilePath))
      .map((stats) => stats.isFile())
      .orDefault(false);

    const resultJsonFilePath = path.resolve(
      documentCacheDirectoryPath,
      `${documentSha256HashHexDigest}.json`,
    );
    const resultJsonFileExists = (await fsEither.stat(resultJsonFilePath))
      .map((stats) => stats.isFile())
      .orDefault(false);

    const resultTextFilePath = path.resolve(
      documentCacheDirectoryPath,
      `${documentSha256HashHexDigest}.txt`,
    );
    const resultTextFileExists = (await fsEither.stat(resultTextFilePath))
      .map((stats) => stats.isFile())
      .orDefault(false);

    if (
      !resultHtmlFileExists ||
      !resultJsonFileExists ||
      !resultTextFileExists
    ) {
      let resultJson: any;
      if (resultJsonFileExists) {
        resultJson = (await fs.promises.readFile(resultJsonFilePath)).toString(
          "utf-8",
        );
      } else {
        const response = await this.textractClient.send(
          new AnalyzeDocumentCommand({
            Document: {
              Bytes: documentBuffer,
            },
            FeatureTypes: this.features.concat(),
          }),
        );
        resultJson = response;

        await fs.promises.writeFile(
          resultJsonFilePath,
          JSON.stringify(response),
        );
      }

      const parsedResponse = new TextractDocument(
        resultJson as unknown as ApiDetectDocumentTextResponse,
      );

      // Rewrite the HTML and text files even if they already exist.
      await Promise.all([
        fs.promises.writeFile(resultHtmlFilePath, parsedResponse.html()),
        fs.promises.writeFile(resultTextFilePath, parsedResponse.text),
      ]);
    }

    return new DocumentTextExtractor.Result({
      htmlFilePath: resultHtmlFilePath,
      jsonFilePath: resultJsonFilePath,
      textFilePath: resultTextFilePath,
    });
  }
}

export namespace DocumentTextExtractor {
  export class Result {
    private readonly htmlFilePath: string;
    private readonly textFilePath: string;

    constructor({
      htmlFilePath,
      textFilePath,
    }: {
      htmlFilePath: string;
      jsonFilePath: string;
      textFilePath: string;
    }) {
      this.htmlFilePath = htmlFilePath;
      this.textFilePath = textFilePath;
    }

    @Memoize()
    get html() {
      return fs.readFileSync(this.htmlFilePath).toString("utf-8");
    }

    @Memoize()
    get text() {
      return fs.readFileSync(this.textFilePath).toString("utf-8");
    }
  }
}
