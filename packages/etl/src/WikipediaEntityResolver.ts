import path from "node:path";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { Logger } from "pino";
import { Either, EitherAsync } from "purify-ts";
import { z } from "zod";
import { JsonFileCache } from "./JsonFileCache.js";
import { WikipediaEntity } from "./WikipediaEntity.js";

const schema = z.object({
  wikipedia: z.array(z.string().url()),
});

const examples: Record<string, readonly string[]> = {
  "Jean Philippe Rameau (composer)": [
    "https://en.wikipedia.org/wiki/Jean-Philippe_Rameau",
  ],
  "Leonard Bernstein (conductor)": [
    "https://en.wikipedia.org/wiki/Leonard_Bernstein",
  ],
  "Philadelphia Orchestra (ensemble)": [
    "https://en.wikipedia.org/wiki/Philadelphia_Orchestra",
  ],
  "Vienna Phil Orch,Levine, James (artist)": [
    "https://en.wikipedia.org/wiki/Vienna_Philharmonic",
    "https://en.wikipedia.org/wiki/James_Levine",
  ],
  "Lonesome Poppycock (composer)": [],
  "Vienna Philharmonic Orchestra,Lonesome Poppycock (artist)": [
    "https://en.wikipedia.org/wiki/Vienna_Philharmonic",
  ],
};

export class WikipediaEntityResolver {
  private readonly cache: JsonFileCache<z.infer<typeof schema>>;
  private readonly cachesDirectoryPath: string;
  private readonly logger?: Logger;

  constructor({
    cachesDirectoryPath,
    logger,
  }: {
    cachesDirectoryPath: string;
    logger?: Logger;
  }) {
    this.cache = new JsonFileCache({
      directoryPath: path.join(cachesDirectoryPath, "wikipedia", "entity"),
      logger,
      parseJson: async (json: unknown) =>
        EitherAsync(() => schema.parseAsync(json)),
    });
    this.cachesDirectoryPath = cachesDirectoryPath;
    this.logger = logger;
  }

  async resolve({
    name,
    role,
  }: { name: string; role?: string }): Promise<
    Either<Error, readonly WikipediaEntity[]>
  > {
    return EitherAsync(async ({ liftEither }) => {
      const qualifiedName = role ? `${name} (${role})` : name;

      let generatedObject = (
        await liftEither(await this.cache.get(qualifiedName))
      ).extract();
      if (!generatedObject) {
        const result = await generateObject({
          messages: [
            {
              content: `\
You will be given the name(s) of one or more people or organizations as well as their role in a music recording, then asked to (1) parse out the names and (2) resolve each name to an English Wikipedia URL.

Please return the response as JSON with this structure: { "wikipedia": [{ "title": "Entity name", "url": "http://example.com" }] }
If you can't match the name(s) with high confidence, do not return an entry for that name.

Here are some examples of inputs and expected outputs:
${Object.entries(examples).map(
  ([input, output]) =>
    `${input} --> ${JSON.stringify({
      ner: output,
    })}`,
)}`,
              role: "system",
            },
            {
              content: `${name} (${role})`,
              role: "user",
            },
          ],
          model: openai("gpt-4o"),
          schema,
        });
        generatedObject = result.object;
        await this.cache.set(qualifiedName, generatedObject);
      }

      return generatedObject.wikipedia.map(
        (url) =>
          new WikipediaEntity({
            cachesDirectoryPath: this.cachesDirectoryPath,
            logger: this.logger,
            url: new URL(url),
          }),
      );
    });
  }
}
