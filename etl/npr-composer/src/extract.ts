import { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { DatasetCore } from "@rdfjs/types";
import { readRdfInput } from "@sdapps/etl";
import {
  Identifier,
  RadioBroadcastService,
  iso8601DateString,
} from "@sdapps/models";
import * as dates from "date-fns";
import { Maybe } from "purify-ts";
import { ResourceSet } from "rdfjs-resource";
import { invariant } from "ts-invariant";
import { logger } from "./logger";

function ensureDateWithoutTime(date: Date): void {
  invariant(date.getUTCHours() === 0);
  invariant(date.getUTCMinutes() === 0);
  invariant(date.getUTCSeconds() === 0);
  invariant(date.getUTCMilliseconds() === 0);
}

export async function extract({
  cachesDirectoryPath,
  endDate,
  input,
  startDate,
}: {
  cachesDirectoryPath: string;
  endDate: Date;
  input: Maybe<string>;
  startDate: Date;
}): Promise<{
  playlistResponsesJson: AsyncIterable<any>;
  inputDataset: DatasetCore;
}> {
  const inputDataset = (await readRdfInput(input, { logger })).unsafeCoerce();

  return {
    inputDataset,
    playlistResponsesJson: extractPlaylistResponsesJson({
      cachesDirectoryPath,
      endDate,
      startDate,
      ucsIdentifiers: extractUcsIdentifiers(inputDataset),
    }),
  };
}

async function* extractPlaylistResponsesJson({
  cachesDirectoryPath,
  endDate,
  startDate,
  ucsIdentifiers,
}: {
  cachesDirectoryPath: string;
  endDate: Date;
  startDate: Date;
  ucsIdentifiers: readonly string[];
}): AsyncIterable<any> {
  ensureDateWithoutTime(endDate);
  ensureDateWithoutTime(startDate);
  invariant(startDate.getTime() <= endDate.getTime());

  const playlistCacheDirectoryPath = path.join(cachesDirectoryPath, "playlist");

  for (const ucsIdentifier of ucsIdentifiers) {
    logger.debug(
      `extracting playlists for ${ucsIdentifier} from ${iso8601DateString(startDate)} to ${iso8601DateString(endDate)}`,
    );

    let date = endDate;
    while (date.getTime() > startDate.getTime()) {
      ensureDateWithoutTime(date);

      const dateStringParts = [
        date.getUTCFullYear().toString(),
        (date.getUTCMonth() + 1).toString().padStart(2, "0"),
        date.getUTCDate().toString().padStart(2, "0"),
      ];
      const dateString = dateStringParts.join("-");

      const playlistCacheFilePath = path.join(
        playlistCacheDirectoryPath,
        ucsIdentifier,
        ...dateStringParts,
        `${ucsIdentifier}-playlist-${dateString}.json`,
      );

      let stat: Stats | undefined;
      try {
        stat = await fs.stat(playlistCacheFilePath);
      } catch {}

      let playlistJsonAny: any;
      if (stat) {
        // logger.debug(
        //   `reading ${ucs} playlist for ${dateString} from ${playlistCacheFilePath}`,
        // );
        playlistJsonAny = JSON.parse(
          (await fs.readFile(playlistCacheFilePath)).toString(),
        );
        // logger.debug(
        //   `read ${ucs} playlist for ${dateString} from ${playlistCacheFilePath}`,
        // );
      } else {
        logger.debug(`fetching ${ucsIdentifier} playlist for ${dateString}`);
        const response = await fetch(
          `https://api.composer.nprstations.org/v1/widget/${ucsIdentifier}/playlist?${new URLSearchParams(
            {
              datestamp: dateString,
              format: "json",
              limit: "200",
              order: "1",
            },
          ).toString()}`,
        );
        playlistJsonAny = await response.json();
        logger.debug(`fetched ${ucsIdentifier} playlist for ${dateString}`);
        await fs.mkdir(path.dirname(playlistCacheFilePath), {
          recursive: true,
        });
        logger.debug(
          `writing ${ucsIdentifier} playlist for ${dateString} to ${playlistCacheFilePath}`,
        );
        await fs.writeFile(
          playlistCacheFilePath,
          JSON.stringify(playlistJsonAny, undefined, 2),
        );
        logger.debug(
          `wrote ${ucsIdentifier} playlist for ${dateString} to ${playlistCacheFilePath}`,
        );
      }

      yield playlistJsonAny;

      date = dates.subDays(date, 1);
    }
  }
}

function extractUcsIdentifiers(inputDataset: DatasetCore): readonly string[] {
  const resourceSet = new ResourceSet({ dataset: inputDataset });
  const ucsIdentifiers: string[] = [];
  for (const resource of resourceSet.instancesOf(
    RadioBroadcastService.fromRdfType,
  )) {
    RadioBroadcastService.fromRdf({ resource })
      .ifLeft((error) => {
        logger.warn(
          `error deserializing RadioBroadcastService instance ${Identifier.toString(resource.identifier)} from RDF: ${error.message}`,
        );
      })
      .ifRight((model) => {
        const nprComposerApiIri = model.sameAs.find((sameAs) =>
          sameAs.value.startsWith(
            "https://api.composer.nprstations.org/v1/ucs/",
          ),
        );
        if (!nprComposerApiIri) {
          logger.debug(
            `RadioBroadcastService instance ${Identifier.toString(resource.identifier)} has no UCS identifier`,
          );
          return;
        }
        ucsIdentifiers.push(
          nprComposerApiIri.value.substring(
            "https://api.composer.nprstations.org/v1/ucs/".length,
          ),
        );
      });
  }
  return ucsIdentifiers;
}
