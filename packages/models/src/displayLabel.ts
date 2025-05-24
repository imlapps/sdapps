import { Maybe } from "purify-ts";
import { Identifier } from "./Identifier.js";

export function displayLabel({
  identifier,
  jobTitle,
  name,
}: {
  identifier: Identifier;
  jobTitle?: Maybe<string>;
  name: Maybe<string>;
}): string {
  const parts: string[] = [];
  if (name.isJust()) {
    if (jobTitle) {
      jobTitle.ifJust((jobTitle) => parts.push(jobTitle));
    }
    parts.push(name.unsafeCoerce());
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return Identifier.toString(identifier);
}
