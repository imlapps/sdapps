import { Either } from "purify-ts";

export interface Document {
  readonly mimeType: string;

  buffer(): Promise<Either<Error, Buffer>>;
  html(): Promise<Either<Error, string>>;
  text(): Promise<Either<Error, string>>;
}
