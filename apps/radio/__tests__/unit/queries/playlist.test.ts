import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import * as queries from "@/lib/queries";
import { Identifier } from "@sdapps/models";
import { Maybe } from "purify-ts";
import { beforeAll, describe, expect, it } from "vitest";

describe.skipIf(process.env["CI"])("playlist", async () => {
  let broadcastService: {
    broadcastTimezone: Maybe<string>;
    $identifier: Identifier;
  };

  beforeAll(async () => {
    const radioBroadcastServices = (
      await testObjectSet.radioBroadcastServiceStubs()
    ).orDefault([]);
    expect(radioBroadcastServices).toHaveLength(1);
    broadcastService = {
      broadcastTimezone: radioBroadcastServices[0].broadcastTimezone,
      $identifier: radioBroadcastServices[0].$identifier,
    };
  });

  it("start date range", async ({ expect }) => {
    const startDateRange: [Date, Date] = [
      new Date(Date.UTC(2025, 7, 25, 0, 0, 0)),
      new Date(Date.UTC(2025, 7, 25, 23, 59, 59)),
    ];

    const playlist = (
      await queries.playlist({
        broadcastService,
        objectSet: testObjectSet,
        startDateRange,
      })
    ).unsafeCoerce();

    expect(Object.keys(playlist.artistsByIdentifier)).not.toHaveLength(0);
    for (const artist of Object.values(playlist.artistsByIdentifier)) {
      expect(artist.label).not.toHaveLength(0);
    }

    expect(Object.keys(playlist.composersByIdentifier)).not.toHaveLength(0);
    for (const composer of Object.values(playlist.composersByIdentifier)) {
      expect(composer.label).not.toHaveLength(0);
    }

    expect(Object.keys(playlist.compositionsByIdentifier)).not.toHaveLength(0);
    for (const composition of Object.values(
      playlist.compositionsByIdentifier,
    )) {
      expect(composition.label).not.toHaveLength(0);
    }

    expect(playlist.episodes).not.toHaveLength(0);
    for (const episode of playlist.episodes) {
      const episodeEndDate = new Date(episode.endDate);
      const episodeStartDate = new Date(episode.startDate);
      expect(episodeStartDate.getTime()).lessThanOrEqual(
        episodeEndDate.getTime(),
      );
      // Episode may end after the start date range
      expect(episodeStartDate.getTime()).greaterThanOrEqual(
        startDateRange[0].getTime(),
      );
      expect(episodeStartDate.getTime()).lessThanOrEqual(
        startDateRange[1].getTime(),
      );

      expect(episode.label).not.toHaveLength(0);

      expect(episode.items).not.toHaveLength(0);
      let itemHasComposition = false;
      for (const item of episode.items) {
        const itemEndDate = new Date(item.endDate);
        const itemStartDate = new Date(item.startDate);
        expect(itemStartDate.getTime()).lessThanOrEqual(itemEndDate.getTime());
        expect(itemStartDate.getTime()).greaterThanOrEqual(
          startDateRange[0].getTime(),
        );
        expect(itemStartDate.getTime()).lessThanOrEqual(
          startDateRange[1].getTime(),
        );
        expect(item.label).not.toHaveLength(0);

        for (const artistIdentifiers of Object.values(item.artistIdentifiers)) {
          for (const artistIdentifier of artistIdentifiers) {
            expect(
              playlist.artistsByIdentifier[artistIdentifier],
            ).toBeDefined();
          }
        }

        if (item.compositionIdentifier) {
          const composition =
            playlist.compositionsByIdentifier[item.compositionIdentifier];
          expect(composition).toBeDefined();
          itemHasComposition = true;

          for (const composerIdentifier of composition.composerIdentifiers) {
            expect(
              playlist.composersByIdentifier[composerIdentifier],
            ).toBeDefined();
          }
        }
      }
      expect(itemHasComposition).toBe(true);
    }
  }, 30000);
});
