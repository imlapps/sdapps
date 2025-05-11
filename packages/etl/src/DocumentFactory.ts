import path from "node:path";
import { Logger } from "pino";
import { } from "purify-ts";
import { DocumentFormatConverter } from "./DocumentFormatConverter.js";
import { DocumentTextExtractor } from "./DocumentTextExtractor.js";

export class DocumentFactory {
  private readonly cachesDirectoryPath: string;
  private readonly logger: Logger | undefined;

  constructor({
    cachesDirectoryPath,
    logger,
  }: { cachesDirectoryPath: string; logger?: Logger }) {
    this.cachesDirectoryPath = cachesDirectoryPath;
    this.logger = logger;
  }

//   private async createDocumentFromFile({
//     contents,
//     mimeType,
//     name,
//     toTempFile,
//   }: {
//     contents: Buffer;
//     mimeType: string;
//     name: string;
//     toTempFile: <T>(
//       useTempFile: (tempFilePath: string) => Promise<T>,
//     ) => Promise<T>;
//   }): Promise<Either<Error, Document>> {
//     switch (mimeType) {
//       case "application/msword":
//       case "application/pdf":
//       case "application/rtf":
//       case "application/vnd.oasis.opendocument.text":
//       case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
//       case "text/rtf":
//         return await toTempFile(
//           async (tempDocumentFilePath): Promise<Either<Error, Document>> => {
//             this.logger?.trace(
//               "using temporary document file path %s",
//               tempDocumentFilePath,
//             );

//             const extractDocument = async (
//               documentFilePath: string,
//             ): Promise<Either<Error, Document>> => {
//               this.logger?.trace(
//                 "extracting text/HTML from %s",
//                 documentFilePath,
//               );

//               const documentTextExtractor = await this.documentTextExtractor();
//               if (documentTextExtractor.isLeft()) {
//                 return documentTextExtractor;
//               }

//               let documentTextExtractorResult: DocumentTextExtractor.Result;
//               try {
//                 documentTextExtractorResult = await documentTextExtractor
//                   .unsafeCoerce()
//                   .extractDocumentText(documentFilePath);
//               } catch (e) {
//                 invariant(e instanceof Error);
//                 return Left(e);
//               }

//               return Right(
//                 new Document({
//                   textualEntities: [
//                     new TextualEntity({
//                       encodingType:
//                         "http://purl.org/knextract/cbox#_EncodingType_TextHtml",
//                       literalForm: documentTextExtractorResult.html,
//                     }),
//                     new TextualEntity({
//                       encodingType:
//                         "http://purl.org/knextract/cbox#_EncodingType_TextPlain",
//                       literalForm: documentTextExtractorResult.text,
//                     }),
//                   ],
//                   title: new DocumentTitle({
//                     encodingType:
//                       "http://purl.org/knextract/cbox#_EncodingType_TextPlain",
//                     literalForm: title ?? name,
//                   }),
//                   ...passThroughParameters,
//                 }),
//               );
//             };

//             if (mimeType === "application/pdf") {
//               return extractDocument(tempDocumentFilePath);
//             }

//             const documentFormatConverter =
//               await this.documentFormatConverter();
//             if (documentFormatConverter.isLeft()) {
//               return documentFormatConverter;
//             }
//             return await tmp.withDir(
//               async ({ path: tempDirectoryPath }) => {
//                 const tempPdfFilePath = path.resolve(
//                   tempDirectoryPath,
//                   "temp.pdf",
//                 );
//                 try {
//                   await documentFormatConverter.unsafeCoerce().convert({
//                     inputFilePath: tempDocumentFilePath,
//                     outputFilePath: tempPdfFilePath,
//                   });
//                 } catch (e) {
//                   invariant(e instanceof Error);
//                   return Left(e);
//                 }

//                 return await extractDocument(tempPdfFilePath);
//               },
//               {
//                 unsafeCleanup: true,
//               },
//             );
//           },
//         );
//       case "text/html":
//         this.logger?.trace("document is HTML");
//         return Right(
//           new Document({
//             textualEntities: [
//               new TextualEntity({
//                 encodingType:
//                   "http://purl.org/knextract/cbox#_EncodingType_TextHtml",
//                 literalForm: contents.toString(),
//               }),
//             ],
//             title: new DocumentTitle({
//               encodingType:
//                 "http://purl.org/knextract/cbox#_EncodingType_TextPlain",
//               literalForm: title ?? name,
//             }),
//             ...passThroughParameters,
//           }),
//         );
//       case "text/plain":
//         this.logger?.trace("document is plaintext");
//         return Right(
//           new Document({
//             textualEntities: [
//               new TextualEntity({
//                 encodingType:
//                   "http://purl.org/knextract/cbox#_EncodingType_TextPlain",
//                 literalForm: contents.toString(),
//               }),
//             ],
//             title: new DocumentTitle({
//               encodingType:
//                 "http://purl.org/knextract/cbox#_EncodingType_TextPlain",
//               literalForm: title ?? name,
//             }),
//             ...passThroughParameters,
//           }),
//         );
//       default: {
//         const errorMessage = `unrecognized document type: ${mimeType}`;
//         this.logger?.warn(errorMessage);
//         return Left(new Error(errorMessage));
//       }
//     }
  }

  private documentFormatConverter(): Promise<
    Either<Error, DocumentFormatConverter>
  > {
    return DocumentFormatConverter.create({
      cacheDirectoryPath: path.resolve(
        this.cachesDirectoryPath,
        "document-format-conversions",
      ),
    });
  }

  private documentTextExtractor(): Promise<
    Either<Error, DocumentTextExtractor>
  > {
    return DocumentTextExtractor.create({
      cacheDirectoryPath: path.resolve(this.cachesDirectoryPath, "textract"),
    });
  }
}
