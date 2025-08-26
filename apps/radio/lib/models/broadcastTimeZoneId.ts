import { ZoneId } from "@js-joda/core";
import { Maybe } from "purify-ts";

export function broadcastTimeZoneId(broadcastService: {
  broadcastTimezone: Maybe<string>;
}): ZoneId {
  return ZoneId.of(broadcastService.broadcastTimezone.orDefault("UTC"));
}
