import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import * as queries from "@/lib/queries";
import { Identifier } from "@sdapps/models";
import { Either, Maybe } from "purify-ts";
import { beforeAll, describe, expect, it } from "vitest";

describe("playlist", async () => {
  let broadcastService: {
    broadcastTimezone: Maybe<string>;
    $identifier: Identifier;
  };

  beforeAll(async () => {
    const radioBroadcastServices = Either.rights(
      await testObjectSet.radioBroadcastServiceStubs(),
    );
    expect(radioBroadcastServices).toHaveLength(1);
    broadcastService = {
      broadcastTimezone: radioBroadcastServices[0].broadcastTimezone,
      $identifier: radioBroadcastServices[0].$identifier,
    };
  });

  it("start date range", async ({ expect }) => {
    const startDateRange: [Date, Date] = [
      new Date(Date.UTC(2025, 7, 23, 0, 0, 0)),
      new Date(Date.UTC(2025, 7, 23, 23, 59, 59)),
    ];

    const playlist = (
      await queries.playlist({
        broadcastService,
        objectSet: testObjectSet,
        startDateRange,
      })
    ).unsafeCoerce();

    expect(Object.keys(playlist.artistsByIdentifier)).toHaveLength(183);
    for (const artist of Object.values(playlist.artistsByIdentifier)) {
      expect(artist.label).not.toHaveLength(0);
    }

    expect(Object.keys(playlist.composersByIdentifier)).toHaveLength(50);
    for (const composer of Object.values(playlist.composersByIdentifier)) {
      expect(composer.label).not.toHaveLength(0);
    }

    expect(Object.keys(playlist.compositionsByIdentifier)).toHaveLength(73);
    for (const composition of Object.values(
      playlist.compositionsByIdentifier,
    )) {
      expect(composition.label).not.toHaveLength(0);
    }

    expect(playlist.episodes).toHaveLength(73);
    for (const episode of playlist.episodes) {
      const episodeEndDate = new Date(episode.endDate);
      const episodeStartDate = new Date(episode.startDate);
      expect(episodeStartDate.getTime()).lessThanOrEqual(
        episodeEndDate.getTime(),
      );
      expect(episodeEndDate.getTime()).lessThanOrEqual(
        startDateRange[1].getTime(),
      );
      expect(episodeStartDate.getTime()).greaterThanOrEqual(
        startDateRange[0].getTime(),
      );

      expect(episode.label).not.toHaveLength(0);

      expect(episode.items).not.toHaveLength(0);
      let itemHasComposition = false;
      for (const item of episode.items) {
        const itemEndDate = new Date(item.endDate);
        const itemStartDate = new Date(item.startDate);
        expect(itemStartDate.getTime()).lessThanOrEqual(itemEndDate.getTime());
        expect(itemEndDate.getTime()).lessThanOrEqual(
          startDateRange[1].getTime(),
        );
        expect(itemStartDate.getTime()).greaterThanOrEqual(
          startDateRange[0].getTime(),
        );

        expect(item.label).not.toHaveLength(0);

        for (const artistIdentifier of item.artistIdentifiers) {
          expect(playlist.artistsByIdentifier[artistIdentifier]).toBeDefined();
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

    // expect(
    //   musicRecordingBroadcastEvents_[0].musicRecordingBroadcastEvent.startDate
    //     .unsafeCoerce()
    //     .getTime(),
    // ).toBeLessThan(
    //   musicRecordingBroadcastEvents_[
    //     musicRecordingBroadcastEvents_.length - 1
    //   ].musicRecordingBroadcastEvent.startDate
    //     .unsafeCoerce()
    //     .getTime(),
    // );

    // for (const {
    //   musicRecording,
    //   musicRecordingBroadcastEvent,
    //   radioEpisode,
    //   radioEpisodeBroadcastEvent,
    // } of musicRecordingBroadcastEvents_) {
    //   {
    //     const startDate = musicRecordingBroadcastEvent.startDate.unsafeCoerce();
    //     expect(startDate.getUTCDate()).toStrictEqual(8);
    //     expect(startDate.getUTCMonth() + 1).toStrictEqual(8);
    //     expect(startDate.getUTCFullYear()).toStrictEqual(2025);
    //   }

    //   expect(musicRecordingBroadcastEvent.worksPerformed).toHaveLength(1);
    //   expect(
    //     musicRecordingBroadcastEvent.worksPerformed[0].$identifier.equals(
    //       musicRecording.$identifier,
    //     ),
    //   ).toStrictEqual(true);

    //   const radioEpisodeBroadcastEvent_ =
    //     radioEpisodeBroadcastEvent.unsafeCoerce();
    //   const radioEpisode_ = radioEpisode.unsafeCoerce();

    //   expect(
    //     musicRecordingBroadcastEvent.superEvent
    //       .unsafeCoerce()
    //       .$identifier.equals(radioEpisodeBroadcastEvent_.$identifier),
    //   ).toStrictEqual(true);
    //   expect(radioEpisodeBroadcastEvent_.worksPerformed).toHaveLength(1);
    //   expect(
    //     radioEpisodeBroadcastEvent
    //       .unsafeCoerce()
    //       .worksPerformed[0].$identifier.equals(radioEpisode_.$identifier),
    //   ).toStrictEqual(true);

    //   {
    //     const endDate = radioEpisodeBroadcastEvent_.endDate.unsafeCoerce();
    //     const startDate = radioEpisodeBroadcastEvent_.startDate.unsafeCoerce();
    //     expect(
    //       endDate.getUTCDate() === 8 || startDate.getUTCDate() === 8,
    //     ).toStrictEqual(true);
    //     expect(
    //       endDate.getUTCMonth() === 8 || startDate.getUTCMonth() + 1 === 8,
    //     ).toStrictEqual(true);
    //     expect(endDate.getUTCFullYear()).toStrictEqual(2025);
    //     expect(startDate.getUTCFullYear()).toStrictEqual(2025);
    //   }
    // }
  }, 30000);
});
