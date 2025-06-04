import { DatasetCore } from "@rdfjs/types";
import { Thing } from "@sdapps/models";
import N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { z } from "zod";
import { logger } from "./logger";

const playlistJsonSchema = z.object({
  date: z.string().date(),
  episode_id: z.string(),
  //   end_time: z.string().time(),
  end_utc: z.string().datetime(),
  name: z.string(),
  playlist: z.array(
    z.strictObject({
      artistName: z.string().optional(),
      buy: z.object({}),
      collectionName: z.string().optional(),
      composerName: z.string().optional(),
      conductor: z.string().optional(),
      ensembles: z.string().optional(),
      _duration: z.number(),
      id: z.string(),
      soloists: z.string().optional(),
      _start_time: z.string(),
      trackName: z.string(),
    }),
  ),
  program_id: z.string(),
  program_format: z.string(),
  //   start_time: z.string().time(),
  start_utc: z.string().datetime(),
});

type PlaylistJson = z.infer<typeof playlistJsonSchema>;

const playlistResponseJsonSchema = z.object({
  dateFilterUsed: z.string(),
  playlist: z.array(playlistJsonSchema),
  ucsNow: z.string(),
});

export async function* transform(
  playlistResponsesJson: AsyncIterable<any>,
): AsyncIterable<DatasetCore> {
  for await (const playlistJson of transformPlaylistResponsesJson(
    playlistResponsesJson,
  )) {
    for await (const model of transformPlaylistJson(playlistJson)) {
      yield model.toRdf({
        mutateGraph: N3.DataFactory.defaultGraph(),
        resourceSet: new MutableResourceSet({
          dataFactory: N3.DataFactory,
          dataset: new N3.Store(),
        }),
      }).dataset;
    }
  }
}

async function* transformPlaylistResponsesJson(
  playlistResponsesJson: AsyncIterable<any>,
): AsyncIterable<PlaylistJson> {
  for await (const playlistResponseJson of playlistResponsesJson) {
    const parseResult =
      await playlistResponseJsonSchema.safeParseAsync(playlistResponseJson);
    if (!parseResult.success) {
      logger.warn(
        `error parsing playlist response: ${parseResult.error.message}`,
      );
      continue;
    }
    yield* playlistResponseJson.playlist;
  }
}

async function* transformPlaylistJson(
  playlistJson: PlaylistJson,
): AsyncIterable<Thing> {}
