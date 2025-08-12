import { BroadcastDay } from "@/lib/models/BroadcastDay";
import { Maybe } from "purify-ts";
import { describe, it } from "vitest";

describe("BroadcastDay", () => {
  it("fromDate (no broadcast timezone)", ({ expect }) => {
    // The supplied Date is 1 AM UTC and there's no broadcast time zone, so the broadcast day should be the same day as the Date's
    const actual = BroadcastDay.fromDate({
      broadcastService: { broadcastTimezone: Maybe.empty() },
      date: new Date("2025-08-01T01:00:00.000Z"),
    });
    expect(actual.day).toStrictEqual(1);
    expect(actual.month).toStrictEqual(8);
    expect(actual.year).toStrictEqual(2025);
  });

  it("fromDate (with broadcast timezone)", ({ expect }) => {
    // The supplied Date is 1 AM UTC but the broadcast time zone is UTC-4 or -5, so the broadcast day should be in the previous day
    const actual = BroadcastDay.fromDate({
      broadcastService: { broadcastTimezone: Maybe.of("America/New_York") },
      date: new Date("2025-01-01T01:00:00.000Z"),
    });
    expect(actual.day).toStrictEqual(31);
    expect(actual.month).toStrictEqual(12);
    expect(actual.year).toStrictEqual(2024);
  });

  it("toDateRange", ({ expect }) => {
    const [startDate, endDate] = BroadcastDay.fromDate({
      broadcastService: { broadcastTimezone: Maybe.of("America/New_York") },
      date: new Date("2025-01-01T01:00:00.000Z"),
    }).toDateRange();
    expect(startDate.getDate()).toStrictEqual(31);
    expect(startDate.getMonth()).toStrictEqual(11);
    expect(startDate.getFullYear()).toStrictEqual(2024);
    expect(startDate.getHours()).toStrictEqual(0);
    expect(startDate.getMinutes()).toStrictEqual(0);
    expect(startDate.getSeconds()).toStrictEqual(0);
    expect(endDate.getDate()).toStrictEqual(31);
    expect(endDate.getMonth()).toStrictEqual(11);
    expect(endDate.getFullYear()).toStrictEqual(2024);
    expect(endDate.getHours()).toStrictEqual(23);
    expect(endDate.getMinutes()).toStrictEqual(59);
    expect(endDate.getSeconds()).toStrictEqual(59);
  });

  it("toString", ({ expect }) => {
    expect(
      BroadcastDay.fromDate({
        broadcastService: { broadcastTimezone: Maybe.empty() },
        date: new Date("2025-08-01T20:40:37.000Z"),
      }).toString(),
    ).toStrictEqual("2025-08-01");
  });
});
