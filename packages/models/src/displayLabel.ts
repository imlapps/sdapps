import { Maybe } from "purify-ts";
import { Identifier } from "./Identifier.js";

export function displayLabel({
  callSign,
  currency,
  identifier,
  jobTitle,
  name,
  unitText,
  value,
}: {
  callSign?: Maybe<string>;
  currency?: Maybe<string>;
  identifier: Identifier;
  jobTitle?: Maybe<string>;
  name: Maybe<string>;
  unitText?: Maybe<string>;
  value?: Maybe<number>;
}): string {
  const parts: string[] = [];
  name
    .ifJust((name) => {
      jobTitle?.ifJust((jobTitle) => parts.push(jobTitle));
      parts.push(name);
    })
    .ifNothing(() => {
      callSign?.ifJust((callSign) => parts.push(callSign));
    });

  if (parts.length === 0) {
    value?.ifJust((value) => {
      parts.push(value.toString());
      currency?.ifJust((currency) => parts.push(currency));
      unitText?.ifJust((unitText) => parts.push(unitText));
    });
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return Identifier.toString(identifier);
}
