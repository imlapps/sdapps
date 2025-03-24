export interface ServerConfiguration {
  readonly dataPaths: readonly string[];
  readonly dynamic: boolean;
  readonly nextBasePath: string;
}
