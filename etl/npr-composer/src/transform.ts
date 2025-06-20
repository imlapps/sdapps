import { DatasetCore } from "@rdfjs/types";
import {
  BroadcastEvent,
  RadioBroadcastService,
  RadioEpisode,
  RadioSeries,
  Thing,
  stubify,
} from "@sdapps/models";

import N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { z } from "zod";

import { ExtractResult } from "./ExtractResult";
import { Iris } from "./Iris";
import { logger } from "./logger";

type PlaylistJson = z.infer<typeof playlistJsonSchema>;

async function* transformPlaylistJson({
  playlistJson,
  radioBroadcastService,
  ucsId,
}: {
  playlistJson: PlaylistJson;
  radioBroadcastService: RadioBroadcastService;
  ucsId: string;
}): AsyncIterable<Thing> {
  const radioEpisodeBroadcastEvent = new BroadcastEvent({
    endDate: new Date(playlistJson.end_utc),
    identifier: Iris.broadcastEvent({
      episodeId: playlistJson.episode_id,
    }),
    publishedOn: stubify(radioBroadcastService),
    startDate: new Date(playlistJson.start_utc),
  });
  yield radioEpisodeBroadcastEvent;

  const radioSeries = new RadioSeries({
    identifier: Iris.program(playlistJson.program_id),
    name: playlistJson.name,
  });

  const radioEpisode = new RadioEpisode({
    identifier: Iris.episode(playlistJson.episode_id),
    partOfSeries: stubify(radioSeries),
    publication: [stubify(radioEpisodeBroadcastEvent)],
  });
  yield radioEpisode;

  radioSeries.episodes.push(stubify(radioEpisode));
  yield radioSeries;
}

export async function* transform({
  extractResults,
  inputDataset,
}: {
  extractResults: AsyncIterable<ExtractResult>;
  inputDataset: DatasetCore;
}): AsyncIterable<DatasetCore> {
  yield inputDataset;

  for await (const extractResult of extractResults) {
    const parseResult = await playlistResponseJsonSchema.safeParseAsync(
      extractResult.playlistResponseJson,
    );
    if (!parseResult.success) {
      logger.warn(
        `error parsing playlist response: ${parseResult.error.message}`,
      );
      continue;
    }

    for (const playlistJson of parseResult.data.playlist) {
      for await (const model of transformPlaylistJson({
        playlistJson,
        radioBroadcastService: extractResult.radioBroadcastService,
        ucsId: extractResult.ucsIdentifier,
      })) {
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
}

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
const playlistResponseJsonSchema = z.object({
  dateFilterUsed: z.string(),
  playlist: z.array(playlistJsonSchema),
  ucsNow: z.string(),
});
