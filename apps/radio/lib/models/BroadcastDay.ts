import { TZDateMini } from "@date-fns/tz";
import { endOfDay, startOfDay } from "date-fns";
import { Maybe } from "purify-ts";
import { invariant } from "ts-invariant";

/**
 * Day, month, and year of a broadcast in the broadcast service's time zone.
 */
export class BroadcastDay {
  readonly day: number; // 1-based
  readonly month: number; // 1-based
  readonly year: number;
  private readonly timeZone: string;

  private constructor({
    day,
    month,
    timeZone,
    year,
  }: { day: number; month: number; timeZone: string; year: number }) {
    this.day = day;
    this.month = month;
    this.timeZone = timeZone;
    this.year = year;
  }

  equals(other: BroadcastDay): boolean {
    invariant(this.timeZone === other.timeZone);
    if (this.day !== other.day) {
      return false;
    }
    if (this.month !== other.month) {
      return false;
    }
    if (this.year !== other.year) {
      return false;
    }
    return true;
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
            timeZone: broadcastTimezone,
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
            timeZone: "UTC",
            year: date.getUTCFullYear(),
          }),
      );
  }

  toDateRange(): [Date, Date] {
    return [
      startOfDay(
        new TZDateMini(this.year, this.month - 1, this.day, this.timeZone),
      ),
      endOfDay(
        new TZDateMini(this.year, this.month - 1, this.day, this.timeZone),
      ),
    ];
  }

  toString(): string {
    return `${this.year}-${this.month.toString().padStart(2, "0")}-${this.day.toString().padStart(2, "0")}`;
  }
}
