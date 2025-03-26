import { Maybe } from "purify-ts";
import { Identifier } from "./Identifier.js";

export function displayLabel({
  identifier,
  name,
}: {
  identifier: Identifier;
  name: Maybe<string>;
}): string {
  return name.orDefaultLazy(() => Identifier.toString(identifier));
}
