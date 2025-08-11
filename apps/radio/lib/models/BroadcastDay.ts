import { Maybe } from "purify-ts";

/**
 * Day, month, and year of a broadcast in the broadcast service's time zone.
 */
export class BroadcastDay {
  readonly day: number; // 1-based
  readonly month: number; // 1-based
  readonly year: number;

  private constructor({
    day,
    month,
    year,
  }: { day: number; month: number; year: number }) {
    this.day = day;
    this.month = month;
    this.year = year;
  }

  static fromDate({
    broadcastService: { broadcastTimezone },
    date,
  }: { broadcastService: { broadcastTimezone: Maybe<string> }; date: Date }) {
    // const timezoneOffset = broadcastTimezone.map(broadcastTimezone => getTimezoneOffset(broadcastTimezone, date)
    return broadcastTimezone
      .map(
        (broadcastTimezone) =>
          new BroadcastDay({
            day: Number.parseInt(
              Intl.DateTimeFormat("en-US", {
                day: "numeric",
                timeZone: broadcastTimezone,
              }).format(date),
            ),
            month: Number.parseInt(
              Intl.DateTimeFormat("en-US", {
                month: "numeric",
                timeZone: broadcastTimezone,
              }).format(date),
            ),
            year: Number.parseInt(
              Intl.DateTimeFormat("en-US", {
                year: "numeric",
                timeZone: broadcastTimezone,
              }).format(date),
            ),
          }),
      )
      .orDefaultLazy(
        () =>
          new BroadcastDay({
            day: date.getUTCDate(),
            month: date.getUTCMonth() + 1,
            year: date.getUTCFullYear(),
          }),
      );
  }

  toString(): string {
    return `${this.year}-${this.month.toString().padStart(2, "0")}-${this.day.toString().padStart(2, "0")}`;
  }
}
