import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  FeatureType,
  GetDocumentAnalysisCommand,
  StartDocumentAnalysisCommand,
  TextractClient,
} from "@aws-sdk/client-textract";
import {
  ApiAnalyzeDocumentResponse,
  TextractDocument,
} from "amazon-textract-response-parser";

import * as fs from "node:fs";
import * as path from "node:path";
import { setTimeout } from "node:timers/promises";
import { fsEither } from "@kos-kit/next-utils/server";
import * as envalid from "envalid";
import { sha256 } from "js-sha256";
import { Logger } from "pino";
import { Either, Left } from "purify-ts";
import { invariant } from "ts-invariant";
import { Memoize } from "typescript-memoize";

interface Document {
  bytes: Buffer;
  mimeType: string;
}

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
    document: Document,
  ): Promise<Either<Error, DocumentTextExtractor.Result>> {
    return this.extractDocumentTextCached(document);
  }

  private async extractDocumentTextCached(
    document: Document,
  ): Promise<Either<Error, DocumentTextExtractor.Result>> {
    const documentSha256HashHexDigest = sha256(document.bytes);

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
      let apiResponsePages: ApiAnalyzeDocumentResponse[];
      if (resultJsonFileExists) {
        apiResponsePages = JSON.parse(
          (await fs.promises.readFile(resultJsonFilePath)).toString("utf-8"),
        );
      } else {
        const resultEither = await this.extractDocumentTextUncached({
          document,
          documentSha256HashHexDigest,
        });
        if (resultEither.isLeft()) {
          return resultEither;
        }
        apiResponsePages = resultEither.unsafeCoerce();
        await fs.promises.writeFile(
          resultJsonFilePath,
          JSON.stringify(apiResponsePages),
        );
      }

      const parsedResponse = new TextractDocument(apiResponsePages);

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

  private async extractDocumentTextUncached({
    document,
    documentSha256HashHexDigest,
  }: {
    document: Document;
    documentSha256HashHexDigest: string;
  }): Promise<Either<Error, ApiAnalyzeDocumentResponse[]>> {
    this.logger?.debug(
      `analyzing ${document.bytes.length}-byte document with Textract`,
    );

    // Multipage document processing must be asynchronous. Always use the asynchronous API.

    const s3Key = documentSha256HashHexDigest;
    try {
      this.logger?.debug(
        `putting document to s3://${this.s3BucketName}/${s3Key}`,
      );
      await this.s3Client.send(
        new PutObjectCommand({
          Body: document.bytes,
          Bucket: this.s3BucketName,
          ContentType: document.mimeType,
          Key: s3Key,
        }),
      );
      this.logger?.debug(`put document to s3://${this.s3BucketName}/${s3Key}`);

      this.logger?.debug("starting document analysis");
      const documentAnalysisJobId = (
        await this.textractClient.send(
          new StartDocumentAnalysisCommand({
            DocumentLocation: {
              S3Object: {
                Bucket: this.s3BucketName,
                Name: s3Key,
              },
            },
            FeatureTypes: this.textractFeatures.concat(),
          }),
        )
      ).JobId!;
      this.logger?.debug(
        `started document analysis, job id=${documentAnalysisJobId}`,
      );

      const apiResponsePages: ApiAnalyzeDocumentResponse[] = [];
      for (let pollI = 0; pollI < 10; pollI++) {
        this.logger?.debug(
          `getting document analysis, jobId=${documentAnalysisJobId}, pollI=${pollI}`,
        );
        let getDocumentAnalysisCommandOutput = await this.textractClient.send(
          new GetDocumentAnalysisCommand({
            JobId: documentAnalysisJobId,
          }),
        );
        if (getDocumentAnalysisCommandOutput.JobStatus === "SUCCEEDED") {
          this.logger?.debug(
            `analyzed ${document.bytes.length}-byte document with Textract`,
          );
          apiResponsePages.push(
            getDocumentAnalysisCommandOutput as unknown as ApiAnalyzeDocumentResponse,
          );
          while (getDocumentAnalysisCommandOutput.NextToken) {
            this.logger?.debug("getting next page of results");
            getDocumentAnalysisCommandOutput = await this.textractClient.send(
              new GetDocumentAnalysisCommand({
                JobId: documentAnalysisJobId,
                NextToken: getDocumentAnalysisCommandOutput.NextToken,
              }),
            );
            apiResponsePages.push(
              getDocumentAnalysisCommandOutput as unknown as ApiAnalyzeDocumentResponse,
            );
          }

          return Either.of(apiResponsePages);
        }
        this.logger?.debug(
          `sleeping before next get document analysis poll, jobId=${documentAnalysisJobId}`,
        );
        await setTimeout(1000);
      }
      return Left(
        new Error(
          `document analysis (jobId=${documentAnalysisJobId}) failed to complete in time`,
        ),
      );
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }
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
