import type { Maybe } from "purify-ts";
import type { Identifier } from "./Identifier.js";
import { displayLabel } from "./displayLabel.js";

export function compare<
  ModelT extends {
    identifier: Identifier;
    name: Maybe<string>;
    order: Maybe<number>;
    startDate?: Maybe<Date>;
  },
>(left: ModelT, right: ModelT): number {
  if (left.startDate && right.startDate) {
    const startTimeDiff =
      left.startDate.map((date) => date.getTime()).orDefault(0) -
      right.startDate.map((date) => date.getTime()).orDefault(0);
    if (startTimeDiff !== 0) {
      return startTimeDiff;
    }
  }

  const orderDiff = left.order.orDefault(0) - right.order.orDefault(0);
  if (orderDiff !== 0) {
    return orderDiff;
  }

  return displayLabel(left).localeCompare(displayLabel(right));
}
