import path from "node:path";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { Memoize } from "typescript-memoize";
import { z } from "zod";
import { JsonFileCache } from "./JsonFileCache.js";
import { WikipediaEntity } from "./WikipediaEntity.js";

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
    pages: z.record(
      z.string(),
      z.object({
        pageprops: z.object({
          wikibase_item: z.string().optional(),
        }),
      }),
    ),
  }),
});

type PagePropsQueryResponse = z.infer<typeof pagepropsQueryResponseSchema>;

export class WikipediaEntityFetcher {
  private readonly fileCache: JsonFileCache<PagePropsQueryResponse>;
  private readonly logger?: Logger;
  private readonly memoryCache: Record<string, Either<Error, WikipediaEntity>> =
    {};

  constructor({
    cachesDirectoryPath,
    logger,
  }: {
    cachesDirectoryPath: string;
    logger?: Logger;
  }) {
    this.logger = logger;
    this.fileCache = new JsonFileCache({
      directoryPath: path.join(cachesDirectoryPath, "wikipedia", "pageprops"),
      logger,
      parseJson: async (json: unknown) =>
        EitherAsync(() => pagepropsQueryResponseSchema.parseAsync(json)),
    });
  }

  async fetch(url: URL): Promise<Either<Error, WikipediaEntity>> {
    const urlString = url.toString();

    {
      const result = this.memoryCache[urlString];
      if (result) {
        return result;
      }
    }

    const result = await EitherAsync<Error, WikipediaEntity>(
      async ({ liftEither }) => {
        const urlPathnamePrefix = "/wiki/";
        if (
          !url.pathname.startsWith(urlPathnamePrefix) ||
          url.pathname.length === urlPathnamePrefix.length
        ) {
          throw new Error(`unexpected URL format: ${urlString}`);
        }
        const urlTitle = url.pathname.substring(urlPathnamePrefix.length);

        let pagepropsQueryResponse = (
          await liftEither(await this.fileCache.get(urlString))
        ).extract();

        if (!pagepropsQueryResponse) {
          const pagepropsQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${urlTitle}&format=json`;
          this.logger?.trace(`fetching ${pagepropsQueryUrl}`);
          pagepropsQueryResponse =
            await pagepropsQueryResponseSchema.parseAsync(
              await (await fetch(pagepropsQueryUrl)).json(),
            );
          this.logger?.trace(
            `fetched ${pagepropsQueryUrl}:\n${JSON.stringify(pagepropsQueryResponse)}`,
          );

          await this.fileCache.set(urlString, pagepropsQueryResponse);
        }

        const pageEntries = Object.entries(pagepropsQueryResponse.query.pages);
        if (pageEntries.length !== 1) {
          throw new Error(
            `MediaWiki query for page ${urlTitle} returned more than one page`,
          );
        }
        const [pageId, page] = pageEntries[0];
        if (pageId === "-1") {
          throw new Error(`page ${urlTitle} does not exist`);
        }
        if (!page.pageprops.wikibase_item) {
          throw new Error(`page ${urlTitle} has no wikibase_item`);
        }

        return new WikipediaEntity({
          url,
          urlTitle,
          wikidataEntityId: page.pageprops.wikibase_item,
        });
      },
    );

    this.memoryCache[urlString] = result;
    return result;
  }

  toString(): string {
    return this.urlTitle;
  }

  @Memoize()
  get urlTitle(): string {
    return this.url.pathname.split("/").at(-1)!;
  }
}
