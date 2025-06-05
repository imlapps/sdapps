import { Maybe } from "purify-ts";
import {
  Organization,
  OrganizationStub,
  Person,
  PersonStub,
  RadioBroadcastService,
  RadioBroadcastServiceStub,
  RadioEpisode,
  RadioEpisodeStub,
  Thing,
} from "./generated";

function stubifyThing(thing: Thing): {
  identifier: Thing["identifier"];
  name: Maybe<string>;
  order: Maybe<number>;
} {
  return {
    identifier: thing.identifier,
    name: thing.name,
    order: thing.order,
  };
}

/**
 * Convert a model to its stub equivalent e.g., Organization to OrganizationStub.
 */
export function stubify(organization: Organization): OrganizationStub;
export function stubify(person: Person): PersonStub;
export function stubify(
  radioBroadcastService: RadioBroadcastService,
): RadioBroadcastServiceStub;
export function stubify(radioEpisode: RadioEpisode): RadioEpisodeStub;
export function stubify(
  model: Organization | Person | RadioBroadcastService | RadioEpisode,
):
  | OrganizationStub
  | PersonStub
  | RadioBroadcastServiceStub
  | RadioEpisodeStub {
  switch (model.type) {
    case "Organization":
      return new OrganizationStub(stubifyThing(model));
    case "Person":
      return new PersonStub({
        ...stubifyThing(model),
        jobTitle: model.jobTitle,
      });
    case "RadioBroadcastService":
      return new RadioBroadcastServiceStub(stubifyThing(model));
    case "RadioEpisode":
      return new RadioEpisodeStub(stubifyThing(model));
  }
}
