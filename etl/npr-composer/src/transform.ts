import { z } from "zod";
import { logger } from "./logger";

const playlistResponseJsonSchema = z.object({
  dateFilterUsed: z.string(),
  playlist: z.array(
    z.object({
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
    }),
  ),
  ucsNow: z.string(),
});

export async function transform(
  playlistResponsesJson: AsyncIterable<any>,
): Promise<void> {
  for await (const playlistResponseJson of playlistResponsesJson) {
    const parseResult =
      await playlistResponseJsonSchema.safeParseAsync(playlistResponseJson);
    if (!parseResult.success) {
      logger.warn(
        `error parsing playlist response: ${parseResult.error.message}`,
      );
      continue;
    }
    logger.info("success parsing playlist response");
  }
}
