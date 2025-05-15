import { S3Client } from "@aws-sdk/client-s3";
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
import { Either, Left } from "purify-ts";
import invariant from "ts-invariant";
import { Memoize } from "typescript-memoize";

export class DocumentTextExtractor {
  private readonly cacheDirectoryPath: string;
  private readonly textractFeatures: readonly FeatureType[];
  private readonly logger: Logger | undefined;
  private readonly s3BucketName: string;
  private readonly s3Client: S3Client;
  private readonly textractClient: TextractClient;

  private constructor({
    cacheDirectoryPath,
    logger,
    s3BucketName,
    s3Client,
    textractClient,
    textractFeatures,
  }: {
    cacheDirectoryPath: string;
    logger: Logger | undefined;
    s3BucketName: string;
    s3Client: S3Client;
    textractClient: TextractClient;
    textractFeatures: readonly FeatureType[];
  }) {
    this.cacheDirectoryPath = cacheDirectoryPath;
    this.logger = logger;
    this.s3BucketName = s3BucketName;
    this.s3Client = s3Client;
    this.textractClient = textractClient;
    this.textractFeatures = textractFeatures;
  }

  static async create({
    cacheDirectoryPath,
    logger,
  }: {
    cacheDirectoryPath: string;
    logger?: Logger;
  }): Promise<Either<Error, DocumentTextExtractor>> {
    let s3Client: S3Client;
    let textractClient: TextractClient;
    try {
      s3Client = new S3Client();
      await s3Client.config.credentials();
      await s3Client.config.region();
      textractClient = new TextractClient();
      await textractClient.config.credentials();
      await textractClient.config.region();
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }

    return Either.encase(() => {
      const env = envalid.cleanEnv(
        process.env,
        {
          AWS_TEXTRACT_S3_BUCKET_NAME: envalid.str(),
          AWS_TEXTRACT_FEATURES: envalid.makeExactValidator<
            readonly FeatureType[]
          >((value: string) => {
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
                    throw new Error(
                      `invalid Textract feature: ${featureString}`,
                    );
                }
              });
          })({ default: ["LAYOUT"] }),
        },
        {
          reporter: ({ errors }) => {
            for (const [envVar, error] of Object.entries(errors)) {
              if (error instanceof envalid.EnvMissingError) {
                throw new Error(`missing environment variable ${envVar}`);
              }
              throw error;
            }
          },
        },
      );

      return new DocumentTextExtractor({
        cacheDirectoryPath,
        logger,
        s3BucketName: env.AWS_TEXTRACT_S3_BUCKET_NAME,
        s3Client,
        textractClient,
        textractFeatures: env.AWS_TEXTRACT_FEATURES,
      });
    });
  }

  async extractDocumentText(
    documentBuffer: Buffer,
  ): Promise<Either<Error, DocumentTextExtractor.Result>> {
    const documentSha256HashHexDigest = sha256(documentBuffer);

    const documentCacheDirectoryPath = path.resolve(
      this.cacheDirectoryPath,
      documentSha256HashHexDigest,
      this.textractFeatures.concat().sort().join("-"),
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
        this.logger?.debug(
          `analyzing ${documentBuffer.length}-byte document with Textract`,
        );
        // Multipage document processing must be asynchronous. Always use the asynchronous API.

        const response = await this.textractClient.send(
          new AnalyzeDocumentCommand({
            Document: {
              Bytes: documentBuffer,
            },
            FeatureTypes: this.textractFeatures.concat(),
          }),
        );
        this.logger?.debug(
          `analyzed ${documentBuffer.length}-byte document with Textract`,
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

    return Either.of(
      new DocumentTextExtractor.Result({
        htmlFilePath: resultHtmlFilePath,
        jsonFilePath: resultJsonFilePath,
        textFilePath: resultTextFilePath,
      }),
    );
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
