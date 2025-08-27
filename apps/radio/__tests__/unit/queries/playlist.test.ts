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
    const playlist = (
      await queries.playlist({
        broadcastService,
        objectSet: testObjectSet,
        startDateRange: [
          new Date(Date.UTC(2025, 7, 8, 0, 0, 0)),
          new Date(Date.UTC(2025, 7, 8, 23, 59, 59)),
        ],
      })
    ).unsafeCoerce();
    expect(playlist.episodes).toHaveLength(91);

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
