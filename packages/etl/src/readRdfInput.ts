import { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { DatasetCore, Quad, Stream } from "@rdfjs/types";
import { TextObject, Thing } from "@sdapps/models";
import Excel from "exceljs";
import * as N3 from "n3";
import { Logger } from "pino";
import { Either, EitherAsync, Left, Maybe } from "purify-ts";
import { fromFile } from "rdf-utils-fs";
import { MutableResourceSet } from "rdfjs-resource";
import { ZodError, z } from "zod";
import { deepCopyRdfTerm } from "./deepCopyRdfTerm.js";

async function readExcelFile({
  filePath,
  logger,
}: { filePath: string; logger?: Logger }): Promise<Either<Error, DatasetCore>> {
  const hyperlinkSchema = z.object({
    hyperlink: z.string(),
    text: z.string(),
  });

  return await EitherAsync(async () => {
    const workbook = new Excel.Workbook();
    logger?.debug(`reading Excel file ${filePath}`);
    await workbook.xlsx.readFile(filePath);
    logger?.debug(`read Excel file ${filePath}`);

    const store = new N3.Store();
    workbook.eachSheet((worksheet) => {
      logger?.debug(`reading Excel worksheet ${worksheet.name}`);

      const headerRow: string[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, cellNumber) => {
            if (typeof cell.value === "string") {
              if (cell.value.length > 0) {
                headerRow.push(cell.value);
              } else {
                logger?.debug(
                  `${worksheet.name} header row contains empty cell @ ${cellNumber}`,
                );
              }
            } else {
              logger?.debug(
                `${worksheet.name} header row contains non-string cell @ ${cellNumber}: ${cell.value}`,
              );
            }
          });
          logger?.debug(
            `${worksheet.name} header row: ${JSON.stringify(headerRow)}`,
          );
          return;
        }

        const dataRowJson: Record<string, boolean | number | string> = {
          type: worksheet.name,
        };
        row.eachCell((cell, columnNumber) => {
          if (columnNumber > headerRow.length) {
            logger?.debug(`${worksheet.name} has long data row ${rowNumber}`);
            return;
          }
          const headerCell = headerRow[columnNumber - 1];

          switch (typeof cell.value) {
            case "boolean":
            case "number":
              dataRowJson[headerCell] = cell.value;
              break;
            case "object": {
              const hyperlink = hyperlinkSchema.safeParse(cell.value);
              if (hyperlink.success) {
                dataRowJson[headerCell] = hyperlink.data.hyperlink;
              } else {
                logger?.warn(
                  `${worksheet.name} data cell ${rowNumber}:${columnNumber} has unexpected object schema: ${JSON.stringify(cell.value)}`,
                );
              }
              break;
            }
            case "string":
              try {
                dataRowJson[headerCell] = JSON.parse(cell.value);
              } catch {
                dataRowJson[headerCell] = cell.value;
              }
              break;
            default:
              logger?.warn(
                `${worksheet.name} data cell ${rowNumber}:${columnNumber} has unexpected type ${typeof cell.value}: ${JSON.stringify(cell.value)}`,
              );
              break;
          }
        });

        logger?.debug(
          `${worksheet.name} data row ${rowNumber} JSON: ${JSON.stringify(dataRowJson)}`,
        );

        let modelFromJson: Either<ZodError, Thing>;
        switch (worksheet.name) {
          case "TextObject":
            modelFromJson = TextObject.fromJson(dataRowJson);
            break;
          default:
            logger?.warn(
              `unrecognized model type / worksheet name ${worksheet.name}`,
            );
            return;
        }

        if (modelFromJson.isLeft()) {
          logger?.warn(
            `unable to deserialize ${worksheet.name} row ${rowNumber}: ${(modelFromJson.extract() as Error).message}`,
          );
          return;
        }
        modelFromJson.unsafeCoerce().toRdf({
          mutateGraph: N3.DataFactory.defaultGraph(),
          resourceSet: new MutableResourceSet({
            dataFactory: N3.DataFactory,
            dataset: store,
          }),
        });
      });

      logger?.debug(`read Excel worksheet ${worksheet.name}`);
    });

    logger?.debug(`read ${store.size} quads from ${filePath}`);
    return store;
  });
}

async function readRdfFile({
  filePath,
  logger,
}: { filePath: string; logger?: Logger }): Promise<Either<Error, DatasetCore>> {
  logger?.debug(`reading input RDF from ${filePath}`);
  return new Promise((resolve) => {
    const store = new N3.Store();
    let fileStream: Stream<Quad>;
    try {
      fileStream = fromFile(filePath);
    } catch (e) {
      resolve(Left(e as Error));
      return;
    }

    fileStream
      .on("data", (quad) => store.add(deepCopyRdfTerm(quad)))
      .on("error", (error) => resolve(Left(error)))
      .on("end", () => {
        logger?.debug(`read ${store.size} quads from ${filePath}`);
        resolve(Either.of(store));
      });
  });
}

async function readRdfFromStdin({
  logger,
}: { logger?: Logger }): Promise<Either<Error, DatasetCore>> {
  logger?.debug("reading input RDF from stdin");
  return new Promise((resolve) => {
    const store = new N3.Store();
    const streamParser = new N3.StreamParser();
    process.stdin
      .pipe(streamParser)
      .on("data", (quad) => store.add(quad))
      .on("error", (error) => resolve(Left(error)))
      .on("end", () => {
        logger?.debug(`read ${store.size} quads from stdin`);
        resolve(Either.of(store));
      });
  });
}

export async function readRdfInput(
  input: Maybe<string>,
  options?: { logger?: Logger },
): Promise<Either<Error, DatasetCore>> {
  const logger = options?.logger;

  if (input.isNothing()) {
    return readRdfFromStdin({ logger });
  }

  let stat: Stats | undefined;
  try {
    stat = await fs.stat(input.unsafeCoerce());
  } catch (e) {
    logger?.debug(`${input.unsafeCoerce()} is not a file or is not accessible`);
  }

  if (stat) {
    if (stat.isFile()) {
      const filePath = input.unsafeCoerce();
      if (path.extname(filePath) === ".xlsx") {
        return readExcelFile({ filePath, logger });
      }

      return readRdfFile({ filePath, logger });
    }
  }

  return Left(new Error("unrecognized input"));
}
