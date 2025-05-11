import { Either } from "purify-ts";

export abstract class Document {
  readonly mimeType: string;

  constructor({ mimeType }: { mimeType: string }) {
    this.mimeType = mimeType;
  }

  abstract buffer(): Promise<Either<Error, Buffer>>;
  abstract html(): Promise<Either<Error, string>>;
  abstract text(): Promise<Either<Error, string>>;
}
