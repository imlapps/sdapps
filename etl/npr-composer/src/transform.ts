import { DatasetCore } from "@rdfjs/types";
import {
  BroadcastEvent,
  MusicAlbum,
  MusicGroup,
  MusicRecording,
  RadioBroadcastService,
  RadioEpisode,
  RadioSeries,
  Thing,
  stubify,
} from "@sdapps/models";
import * as dates from "date-fns";

import N3 from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import { z } from "zod";

import { invariant } from "ts-invariant";
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

  radioSeries.episodes.push(stubify(radioEpisode));
  yield radioSeries;

  const ucsUtcOffsetMs =
    Date.parse(`${playlistJson.date}T${playlistJson.start_time}:00.000Z`) -
    radioEpisodeBroadcastEvent.startDate.unsafeCoerce().getTime();
  invariant(ucsUtcOffsetMs % (1000 * 60 * 60) === 0);
  const utcOffsetHours = ucsUtcOffsetMs / (1000 * 60 * 60);
  // logger.debug(`UCS UTC offset hours: ${utcOffsetHours}`);

  for (const playlistItemJson of playlistJson.playlist) {
    // 05-05-2025 00:00:00
    const startDate = dates.parse(
      `${playlistItemJson._start_time} ${utcOffsetHours > 0 ? "+" : "-"}${Math.abs(utcOffsetHours).toString().padStart(2, "0").padEnd(4, "0")}`,
      "MM-dd-yyyy HH:mm:ss XX",
      new Date(),
    );

    const musicGroups: MusicGroup[] = [];
    const musicGroupUnqualifiedNames = new Set<string>();
    for (const [qualifier, unqualifiedName] of Object.entries({
      "": playlistItemJson.artistName,
      composer: playlistItemJson.composerName,
      conductor: playlistItemJson.conductor,
      ensembles: playlistItemJson.ensembles,
      soloists: playlistItemJson.soloists,
    })) {
      if (!unqualifiedName || musicGroupUnqualifiedNames.has(unqualifiedName)) {
        continue;
      }
      const qualifiedName =
        qualifier.length > 0
          ? `${unqualifiedName} (${qualifier})`
          : unqualifiedName;
      const musicGroup = new MusicGroup({
        identifier: Iris.musicGroup({ name: qualifiedName }),
        name: qualifiedName,
      });
      yield musicGroup;
      musicGroups.push(musicGroup);
    }

    if (musicGroups.length === 0) {
      logger.debug(
        `playlist item ${playlistItemJson.id} has no group names, skipping: ${JSON.stringify(playlistItemJson)}`,
      );
      continue;
    }
    const musicGroupStubs = musicGroups.map((musicGroup) =>
      stubify(musicGroup),
    );

    const musicAlbum = playlistItemJson.collectionName
      ? new MusicAlbum({
          byArtists: musicGroupStubs,
          identifier: Iris.musicAlbum(playlistItemJson),
          name: playlistItemJson.collectionName,
        })
      : undefined;
    if (musicAlbum) {
      yield musicAlbum;
    }

    const musicRecording = new MusicRecording({
      duration: dates.formatISODuration({
        seconds: playlistItemJson._duration,
      }),
      byArtists: musicGroupStubs,
      inAlbum: musicAlbum ? stubify(musicAlbum) : undefined,
      identifier: Iris.musicRecording(playlistItemJson),
      name: playlistItemJson.trackName,
    });
    yield musicRecording;
  }

  yield radioEpisode;
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
  end_time: z.string(),
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
  start_time: z.string(),
  start_utc: z.string().datetime(),
});
const playlistResponseJsonSchema = z.object({
  dateFilterUsed: z.string(),
  playlist: z.array(playlistJsonSchema),
  ucsNow: z.string(),
});
