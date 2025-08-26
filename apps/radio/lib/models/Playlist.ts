import {} from "@sdapps/models";
import { z } from "zod";

const identifierSchema = z.string();

const artistSchema = z.object({
  name: z.string(),
});

const composerSchema = artistSchema;

const compositionSchema = z.object({
  composerIdentifiers: z.array(identifierSchema),
  name: z.string(),
});

const dateTimeSchema = z.string().datetime({ offset: true });

const itemSchema = z.object({
  artistIdentifiers: z.array(identifierSchema),
  endDate: dateTimeSchema,
  compositionIdentifier: identifierSchema.optional(),
  name: z.string(),
  startDate: dateTimeSchema,
});

const episodeSchema = z.object({
  endDate: dateTimeSchema,
  identifier: identifierSchema,
  items: z.array(itemSchema),
  name: z.string(),
  startDate: dateTimeSchema,
});

const playlistSchema = z.object({
  artistsByIdentifier: z.record(identifierSchema, artistSchema),
  compositionsByIdentifier: z.record(identifierSchema, compositionSchema),
  composersByIdentifier: z.record(identifierSchema, composerSchema),
  episodes: z.array(episodeSchema),
});

export type Playlist = z.infer<typeof playlistSchema>;
