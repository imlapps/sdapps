import { testObjectSet } from "@/__tests__/unit/testObjectSet";
import { musicRecordingBroadcastEvents } from "@/lib/queries/musicRecordingBroadcastEvents";
import { Identifier } from "@sdapps/models";
import { beforeAll, describe, expect, it } from "vitest";

describe("musicRecordingBroadcastEvents", async () => {
  let broadcastService: { $identifier: Identifier };

  beforeAll(async () => {
    const radioBroadcastServiceIdentifiers = (
      await testObjectSet.radioBroadcastServiceIdentifiers()
    ).unsafeCoerce();
    expect(radioBroadcastServiceIdentifiers).toHaveLength(1);
    broadcastService = { $identifier: radioBroadcastServiceIdentifiers[0] };
  });

  it("start date range", async ({ expect }) => {
    const musicRecordingBroadcastEvents_ = (
      await musicRecordingBroadcastEvents({
        broadcastService,
        objectSet: testObjectSet,
        startDateRange: [
          new Date(Date.UTC(2025, 7, 8, 0, 0, 0)),
          new Date(Date.UTC(2025, 7, 8, 23, 59, 59)),
        ],
      })
    ).unsafeCoerce();
    expect(musicRecordingBroadcastEvents_).toHaveLength(91);

    expect(
      musicRecordingBroadcastEvents_[0].musicRecordingBroadcastEvent.startDate
        .unsafeCoerce()
        .getTime(),
    ).toBeLessThan(
      musicRecordingBroadcastEvents_[
        musicRecordingBroadcastEvents_.length - 1
      ].musicRecordingBroadcastEvent.startDate
        .unsafeCoerce()
        .getTime(),
    );

    for (const {
      musicRecording,
      musicRecordingBroadcastEvent,
      radioEpisode,
      radioEpisodeBroadcastEvent,
    } of musicRecordingBroadcastEvents_) {
      {
        const startDate = musicRecordingBroadcastEvent.startDate.unsafeCoerce();
        expect(startDate.getUTCDate()).toStrictEqual(8);
        expect(startDate.getUTCMonth() + 1).toStrictEqual(8);
        expect(startDate.getUTCFullYear()).toStrictEqual(2025);
      }

      expect(musicRecordingBroadcastEvent.worksPerformed).toHaveLength(1);
      expect(
        musicRecordingBroadcastEvent.worksPerformed[0].$identifier.equals(
          musicRecording.$identifier,
        ),
      ).toStrictEqual(true);

      const radioEpisodeBroadcastEvent_ =
        radioEpisodeBroadcastEvent.unsafeCoerce();
      const radioEpisode_ = radioEpisode.unsafeCoerce();

      expect(
        musicRecordingBroadcastEvent.superEvent
          .unsafeCoerce()
          .$identifier.equals(radioEpisodeBroadcastEvent_.$identifier),
      ).toStrictEqual(true);
      expect(radioEpisodeBroadcastEvent_.worksPerformed).toHaveLength(1);
      expect(
        radioEpisodeBroadcastEvent
          .unsafeCoerce()
          .worksPerformed[0].$identifier.equals(radioEpisode_.$identifier),
      ).toStrictEqual(true);

      {
        const endDate = radioEpisodeBroadcastEvent_.endDate.unsafeCoerce();
        const startDate = radioEpisodeBroadcastEvent_.startDate.unsafeCoerce();
        expect(
          endDate.getUTCDate() === 8 || startDate.getUTCDate() === 8,
        ).toStrictEqual(true);
        expect(
          endDate.getUTCMonth() === 8 || startDate.getUTCMonth() + 1 === 8,
        ).toStrictEqual(true);
        expect(endDate.getUTCFullYear()).toStrictEqual(2025);
        expect(startDate.getUTCFullYear()).toStrictEqual(2025);
      }
    }
  }, 30000);
});
