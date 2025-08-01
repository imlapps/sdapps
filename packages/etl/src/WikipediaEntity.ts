import path from "node:path";
import { Logger } from "pino";
import { Either, EitherAsync, Maybe } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { z } from "zod";
import { JsonFileCache } from "./JsonFileCache.js";
import { WikidataEntity } from "./WikidataEntity.js";

// {
//   "batchcomplete": "",
//   "query": {
//     "normalized": [
//       {
//         "from": "Romero_Lubambo",
//         "to": "Romero Lubambo"
//       }
//     ],
//     "pages": {
//       "8031610": {
//         "pageid": 8031610,
//         "ns": 0,
//         "title": "Romero Lubambo",
//         "pageprops": {
//           "defaultsort": "Lubambo, Romero",
//           "page_image_free": "Romero_Lubambo.jpg",
//           "wikibase-shortdesc": "Brazilian jazz guitarist",
//           "wikibase_item": "Q4516533"
//         }
//       }
//     }
//   }
// }
const pagepropsQueryResponseSchema = z.object({
  query: z.object({
    pages: z.map(
      z.string(),
      z.object({
        pageprops: z.object({
          wikibase_item: z.string().optional(),
        }),
      }),
    ),
  }),
});

export class WikipediaEntity {
  private readonly cachesDirectoryPath: string;
  private readonly pagepropsQueryResponseCache: JsonFileCache<
    z.infer<typeof pagepropsQueryResponseSchema>
  >;
  private logger?: Logger;
  readonly url: URL;

  constructor({
    cachesDirectoryPath,
    logger,
    url,
  }: {
    cachesDirectoryPath: string;
    logger?: Logger;
    url: URL;
  }) {
    this.cachesDirectoryPath = cachesDirectoryPath;
    this.logger = logger;
    this.pagepropsQueryResponseCache = new JsonFileCache({
      directoryPath: path.join(cachesDirectoryPath, "wikipedia", "pageprops"),
      logger,
      parseJson: async (json: unknown) =>
        EitherAsync(() => pagepropsQueryResponseSchema.parseAsync(json)),
    });
    this.url = url;
  }

  async wikidataEntity(): Promise<Either<Error, Maybe<WikidataEntity>>> {
    return EitherAsync(async ({ liftEither }) => {
      let pagepropsQueryResponse = (
        await liftEither(
          await this.pagepropsQueryResponseCache.get(this.url.toString()),
        )
      ).extract();
      if (!pagepropsQueryResponse) {
        pagepropsQueryResponse = await pagepropsQueryResponseSchema.parseAsync(
          await (
            await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${this.urlTitle}&format=json`,
            )
          ).json(),
        );
        await this.pagepropsQueryResponseCache.set(
          this.url.toString(),
          pagepropsQueryResponse,
        );
      }

      const pages = Object.values(pagepropsQueryResponse.query.pages);
      if (pages.length !== 1) {
        throw new Error(
          `MediaWiki query for page ${this.urlTitle} returned more than one page`,
        );
      }

      const page = pages[0];
      if (!page.pageprops.wikibase_item) {
        return Maybe.empty();
      }
      return Maybe.of(
        new WikidataEntity({
          cachesDirectoryPath: this.cachesDirectoryPath,
          id: page.pageprops.wikibase_item,
          logger: this.logger,
        }),
      );
    });
  }

  toString(): string {
    return this.urlTitle;
  }

  @Memoize()
  get urlTitle(): string {
    return this.url.pathname.split("/").at(-1)!;
  }
}
