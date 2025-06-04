import { Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import * as dates from "date-fns";
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
  startDate,
  ucs,
}: {
  cachesDirectoryPath: string;
  endDate: Date;
  startDate: Date;
  ucs: string;
}): Promise<void> {
  ensureDateWithoutTime(endDate);
  ensureDateWithoutTime(startDate);
  invariant(startDate.getTime() <= endDate.getTime());

  const playlistCacheDirectoryPath = path.join(cachesDirectoryPath, "playlist");

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
      ucs,
      ...dateStringParts,
      `${ucs}-playlist-${dateString}.json`,
    );

    let stat: Stats | undefined;
    try {
      stat = await fs.stat(playlistCacheFilePath);
    } catch {}

    let playlistJsonAny: any;
    if (stat) {
      logger.debug(
        `reading ${ucs} playlist for ${dateString} from ${playlistCacheFilePath}`,
      );
      playlistJsonAny = JSON.parse(
        (await fs.readFile(playlistCacheFilePath)).toString(),
      );
      logger.debug(
        `read ${ucs} playlist for ${dateString} from ${playlistCacheFilePath}`,
      );
    } else {
      logger.debug(`fetching ${ucs} playlist for ${dateString}`);
      const response = await fetch(
        `https://api.composer.nprstations.org/v1/widget/${ucs}/playlist?${new URLSearchParams(
          {
            datestamp: dateString,
            format: "json",
            limit: "200",
            order: "1",
          },
        ).toString()}`,
      );
      playlistJsonAny = await response.json();
      logger.debug(`fetched ${ucs} playlist for ${dateString}`);
      await fs.mkdir(path.dirname(playlistCacheFilePath), { recursive: true });
      logger.debug(
        `writing ${ucs} playlist for ${dateString} to ${playlistCacheFilePath}`,
      );
      await fs.writeFile(
        playlistCacheFilePath,
        JSON.stringify(playlistJsonAny, undefined, 2),
      );
      logger.debug(
        `wrote ${ucs} playlist for ${dateString} to ${playlistCacheFilePath}`,
      );
    }

    date = dates.subDays(date, 1);
  }
}
