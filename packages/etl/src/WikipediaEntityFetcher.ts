import path from "node:path";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { z } from "zod";
import { JsonFileCache } from "./JsonFileCache.js";
import { WikipediaEntity } from "./WikipediaEntity.js";

// pageprops query response examples
// With wikibase_item:
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
//
// Without wikibase_item
// {
//   "batchcomplete": "",
//   "query": {
//     "normalized": [
//       {
//         "from": "Jan_Křtitel_Vaňhal",
//         "to": "Jan Křtitel Vaňhal"
//       }
//     ],
//     "pages": {
//       "5320913": {
//         "pageid": 5320913,
//         "ns": 0,
//         "title": "Jan Křtitel Vaňhal"
//       }
//     }
//   }
// }

const pagepropsQueryResponseSchema = z.object({
  query: z.object({
    pages: z.record(
      z.string(),
      z.object({
        pageprops: z
          .object({
            wikibase_item: z.string().optional(),
          })
          .optional(),
      }),
    ),
  }),
});

export class WikipediaEntityFetcher {
  private readonly jsonFileCache: JsonFileCache<string | null>;
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
      valueSchema: z.string().nullable(),
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
          const pagepropsQueryResponse = await fetch(pagepropsQueryUrl);
          if (!pagepropsQueryResponse.ok) {
            throw new Error(
              `pageprops query response is ${pagepropsQueryResponse.status} ${pagepropsQueryResponse.statusText}`,
            );
          }
          const pagepropsQueryResponseJson =
            await pagepropsQueryResponse.json();
          if (typeof pagepropsQueryResponseJson === "undefined") {
            throw new Error("pageprops query response JSON is undefined");
          }
          this.logger?.trace(
            `fetched ${pagepropsQueryUrl}:\n${JSON.stringify(pagepropsQueryResponseJson)}`,
          );
          let pagepropsQueryResponseParsed:
            | z.infer<typeof pagepropsQueryResponseSchema>
            | undefined;
          try {
            pagepropsQueryResponseParsed =
              await pagepropsQueryResponseSchema.parseAsync(
                pagepropsQueryResponseJson,
              );
          } catch (e) {
            throw new Error(
              `error parsing pageprops query (${pagepropsQueryUrl}) response JSON:\nError:\n${(e as Error).message}\nJSON:\n${JSON.stringify(pagepropsQueryResponseJson)}`,
            );
          }

          const pages = Object.values(pagepropsQueryResponseParsed.query.pages);
          if (pages.length !== 1) {
            throw new Error(
              `MediaWiki query for page ${urlTitle} returned more than one page`,
            );
          }
          const page = pages[0];
          if (page.pageprops?.wikibase_item) {
            wikidataEntityId = page.pageprops.wikibase_item;
          } else {
            wikidataEntityId = null;
          }

          await this.jsonFileCache.set(urlString, wikidataEntityId);
        }

        if (wikidataEntityId === null) {
          throw new Error(
            `page ${urlTitle} does not exist or has no Wikidata entity id`,
          );
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
