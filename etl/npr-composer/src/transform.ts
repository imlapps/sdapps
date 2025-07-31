import { DatasetCore } from "@rdfjs/types";
import {} from "@sdapps/etl";
import {
  BroadcastEvent,
  ItemList,
  ListItem,
  MusicAlbum,
  MusicComposition,
  MusicGroup,
  MusicPlaylist,
  MusicRecording,
  RadioBroadcastService,
  RadioEpisode,
  RadioSeries,
  Thing,
  stubify,
} from "@sdapps/models";
import * as dates from "date-fns";

import { Stats } from "node:fs";
import fs from "node:fs/promises";
import { generateObject } from "ai";
import N3, { NamedNode } from "n3";
import { MutableResourceSet } from "rdfjs-resource";
import sanitizeFilename from "sanitize-filename";
import { z } from "zod";

import path from "node:path";
import { openai } from "@ai-sdk/openai";
import { Either, EitherAsync } from "purify-ts";
import { invariant } from "ts-invariant";
import { ExtractResult } from "./ExtractResult";
import { Iris } from "./Iris";
import { logger } from "./logger";

type PlaylistJson = z.infer<typeof playlistJsonSchema>;

function durationSecondsToDuration(durationSeconds: number): dates.Duration {
  const duration: dates.Duration = {};
  let durationSecondsLeft = durationSeconds;
  duration.hours =
    durationSecondsLeft >= 3600
      ? Math.floor(durationSecondsLeft / 3600)
      : undefined;
  durationSecondsLeft %= 3600;
  duration.minutes =
    durationSecondsLeft >= 60
      ? Math.floor(durationSecondsLeft / 60)
      : undefined;
  durationSecondsLeft %= 60;
  duration.seconds = durationSecondsLeft > 0 ? durationSecondsLeft : undefined;
  return duration;
}

async function* transformPlaylistJson({
  cachesDirectoryPath,
  playlistJson,
  radioBroadcastService,
  ucsId,
}: {
  cachesDirectoryPath: string;
  playlistJson: PlaylistJson;
  radioBroadcastService: RadioBroadcastService;
  ucsId: string;
}): AsyncIterable<Thing> {
  const radioEpisodeBroadcastEvent = new BroadcastEvent({
    endDate: new Date(playlistJson.end_utc),
    identifier: Iris.episodeBroadcastEvent({
      episodeId: playlistJson.episode_id,
    }),
    publishedOn: stubify(radioBroadcastService),
    startDate: new Date(playlistJson.start_utc),
  });
  const radioEpisodeBroadcastEventStub = stubify(radioEpisodeBroadcastEvent);

  const radioSeries = new RadioSeries({
    identifier: Iris.program(playlistJson.program_id),
    name: playlistJson.name,
  });

  const radioEpisode = new RadioEpisode({
    identifier: Iris.episode(playlistJson.episode_id),
    partOfSeries: stubify(radioSeries),
    publication: [radioEpisodeBroadcastEventStub],
  });
  const radioEpisodeStub = stubify(radioEpisode);
  radioSeries.episodes.push(radioEpisodeStub);

  const ucsUtcOffsetMs =
    Date.parse(`${playlistJson.date}T${playlistJson.start_time}:00.000Z`) -
    radioEpisodeBroadcastEvent.startDate.unsafeCoerce().getTime();
  invariant(ucsUtcOffsetMs % (1000 * 60 * 60) === 0);
  const utcOffsetHours = ucsUtcOffsetMs / (1000 * 60 * 60);
  // logger.debug(`UCS UTC offset hours: ${utcOffsetHours}`);

  const musicPlaylist = new MusicPlaylist({
    identifier: Iris.episodePlaylist({ episodeId: playlistJson.episode_id }),
    isPartOf: [radioEpisodeStub],
  });
  const musicPlaylistStub = stubify(musicPlaylist);
  radioEpisode.hasParts.push(musicPlaylistStub);
  const musicPlaylistItemList = new ItemList({
    identifier: Iris.episodePlaylistItemList({
      episodeId: playlistJson.episode_id,
    }),
  });
  musicPlaylist.tracks.push(stubify(musicPlaylistItemList));

  for (const playlistItemJson of playlistJson.playlist) {
    // 05-05-2025 00:00:00
    const startDate = dates.parse(
      `${playlistItemJson._start_time} ${utcOffsetHours > 0 ? "+" : "-"}${Math.abs(utcOffsetHours).toString().padStart(2, "0").padEnd(4, "0")}`,
      "MM-dd-yyyy HH:mm:ss XX",
      new Date(),
    );

    let composerMusicGroup: MusicGroup | undefined;
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
        sameAs:
          qualifier === "composer" &&
          unqualifiedName === "George Frideric Handel"
            ? (
                await wikidataEntityIris({
                  cachesDirectoryPath,
                  entityName: unqualifiedName,
                  entityType: qualifier,
                })
              ).orDefault([])
            : undefined,
      });
      yield musicGroup;
      musicGroups.push(musicGroup);
      if (qualifier === "composer") {
        composerMusicGroup = musicGroup;
      }
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

    const musicComposition = composerMusicGroup
      ? new MusicComposition({
          composer: composerMusicGroup
            ? stubify(composerMusicGroup)
            : undefined,
          identifier: Iris.musicComposition(playlistItemJson),
          name: playlistItemJson.trackName,
        })
      : undefined;

    const musicRecordingBroadcastEvent = new BroadcastEvent({
      endDate: new Date(startDate.getTime() + playlistItemJson._duration),
      identifier: Iris.episodePlaylistItemBroadcastEvent({
        episodeId: playlistJson.episode_id,
        playlistItemId: playlistItemJson.id,
      }),
      publishedOn: stubify(radioBroadcastService),
      startDate: startDate,
      superEvent: radioEpisodeBroadcastEventStub,
    });
    yield musicRecordingBroadcastEvent;
    const musicRecordingBroadcastEventStub = stubify(
      musicRecordingBroadcastEvent,
    );
    radioEpisodeBroadcastEvent.subEvents.push(musicRecordingBroadcastEventStub);

    const musicRecording = new MusicRecording({
      duration: dates.formatISODuration(
        durationSecondsToDuration(playlistItemJson._duration / 1000),
      ),
      byArtists: musicGroupStubs,
      inAlbum: musicAlbum ? stubify(musicAlbum) : undefined,
      identifier: Iris.musicRecording(playlistItemJson),
      inPlaylists: [musicPlaylistStub],
      name: playlistItemJson.trackName,
      publication: [musicRecordingBroadcastEventStub],
      recordingOf: musicComposition ? stubify(musicComposition) : undefined,
    });
    yield musicRecording;
    const musicRecordingStub = stubify(musicRecording);

    if (musicComposition) {
      musicComposition.recordedAs.push(musicRecordingStub);
      yield musicComposition;
    }

    const musicPlaylistItem = new ListItem({
      identifier: Iris.episodePlaylistItem({
        episodeId: playlistJson.episode_id,
        playlistItemId: playlistItemJson.id,
      }),
      item: musicRecordingStub,
      position: playlistItemJson.id, // The id's monotonically increase, so this can be used for sorting
    });
    yield musicPlaylistItem;
    musicPlaylistItemList.itemListElements.push(stubify(musicPlaylistItem));
  }

  yield musicPlaylist;
  yield musicPlaylistItemList;
  yield radioEpisode;
  yield radioEpisodeBroadcastEvent;
  yield radioSeries;
}

export async function* transform({
  cachesDirectoryPath,
  extractResults,
  inputDataset,
}: {
  cachesDirectoryPath: string;
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
        cachesDirectoryPath,
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

const wikidataEntityObjectSchema = z.object({
  ids: z.array(z.string()),
});

async function wikidataEntityIris({
  cachesDirectoryPath,
  entityName,
  entityType,
}: {
  cachesDirectoryPath: string;
  entityName: string;
  entityType: "composer" | "conductor";
}): Promise<Either<Error, readonly NamedNode[]>> {
  return EitherAsync(async () => {
    const entityCacheDirectoryPath = path.join(
      cachesDirectoryPath,
      "wikidata",
      "entity-id",
      entityType,
    );
    await fs.mkdir(entityCacheDirectoryPath, { recursive: true });

    // Do minimal encoding of the entity name
    // sanitize-filename can produce the same output for different inputs, like "file?" and "file*" both producing "file"
    // It's not reversible.
    // That's probably acceptable in this case. Legibility of the file names is more important.
    const entityCacheFilePath = path.join(
      entityCacheDirectoryPath,
      `${sanitizeFilename(entityName)}.json`,
    );

    let entityCacheFileStats: Stats | undefined;
    try {
      entityCacheFileStats = await fs.stat(entityCacheFilePath);
      logger.debug(`Wikidata entity cache file ${entityCacheFilePath} exists`);
    } catch {
      logger.debug(
        `Wikidata entity cache file ${entityCacheFilePath} does not exist`,
      );
    }

    let generatedObject: z.infer<typeof wikidataEntityObjectSchema> | undefined;
    if (entityCacheFileStats) {
      const parseResult = await wikidataEntityObjectSchema.safeParseAsync(
        JSON.parse((await fs.readFile(entityCacheFilePath)).toString("utf-8")),
      );
      if (parseResult.data) {
        logger.debug(
          `successfully parsed Wikidata entity cache file ${entityCacheFilePath}:\n${JSON.stringify(parseResult.data)}`,
        );
        generatedObject = parseResult.data;
      } else {
        logger.debug(
          `unable to parse Wikidata entity cache file ${entityCacheFilePath}:\n${parseResult.error}`,
        );
      }
    }

    if (!generatedObject) {
      const result = await generateObject({
        messages: [
          {
            content: `\
You will be given the names of one or more people or organizations as well as their role in a music recording, then asked to resolve the appropriate Wikidata entity ID(s).

Please return the response as JSON with this structure: { "ids": [unqualified entity ID's] }
If you can't match the name(s) with high confidence, do not return an unqualified Wikidata entity ID for that name(s).

Here are some examples of inputs and expected outputs:
"Jean Philippe Rameau (composer)" --> { "ids": ["Q1145"] }
"Leonard Bernstein (conductor)" --> { "ids": ["Q152505"] }
"Philadelphia Orchestra (ensemble)" --> { "ids": ["Q659181"] }
"Vienna Phil Orch,Levine, James (artist)" --> { "ids": ["Q154685", "Q336388"] }
"Lonesome Poppycock (composer)" --> { "ids": [] }
"Vienna Philharmonic Orchestra,Lonesome Poppycock (artist)" --> { "ids": ["Q154685"] }
`,
            role: "system",
          },
          {
            content: `${entityName} (${entityType})`,
            role: "user",
          },
        ],
        model: openai("gpt-4o"),
        schema: wikidataEntityObjectSchema,
      });
      generatedObject = result.object;

      await fs.writeFile(
        entityCacheFilePath,
        JSON.stringify(generatedObject, undefined, 2),
        { encoding: "utf-8" },
      );
      logger.debug(`wrote Wikidata entity cache file ${entityCacheFilePath}`);
    }

    const result: NamedNode[] = [];
    for (const id of generatedObject.ids) {
      if (id.startsWith("http://") || id.startsWith("https://")) {
        result.push(N3.DataFactory.namedNode(id));
      } else if (id.startsWith("Q")) {
        result.push(
          N3.DataFactory.namedNode(`http://www.wikidata.org/entity/${id}`),
        );
      } else {
        logger.warn(`invalid Wikidata entity ID: ${id}`);
      }
    }
    return result;
  });
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
