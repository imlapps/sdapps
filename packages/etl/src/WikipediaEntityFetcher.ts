import path from "node:path";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
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
  private readonly jsonFileCache: JsonFileCache<string>;
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
    this.jsonFileCache = new JsonFileCache({
      filePath: path.join(
        cachesDirectoryPath,
        "wikipedia",
        "wikidataEntityIds.json",
      ),
      logger,
      valueSchema: z.string(),
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

        let wikidataEntityId = (
          await liftEither(await this.jsonFileCache.get(urlString))
        ).extract();

        if (!wikidataEntityId) {
          const pagepropsQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${urlTitle}&format=json`;
          this.logger?.trace(`fetching ${pagepropsQueryUrl}`);
          const pagepropsQueryResponse =
            await pagepropsQueryResponseSchema.parseAsync(
              await (await fetch(pagepropsQueryUrl)).json(),
            );
          this.logger?.trace(
            `fetched ${pagepropsQueryUrl}:\n${JSON.stringify(pagepropsQueryResponse)}`,
          );

          const pageEntries = Object.entries(
            pagepropsQueryResponse.query.pages,
          );
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
          wikidataEntityId = page.pageprops.wikibase_item;

          await this.jsonFileCache.set(urlString, wikidataEntityId);
        }

        return new WikipediaEntity({
          url,
          urlTitle,
          wikidataEntityId,
        });
      },
    );

    result.ifLeft((error) => {
      this.logger?.error(error.message);
    });

    this.memoryCache[urlString] = result;
    return result;
  }
}
