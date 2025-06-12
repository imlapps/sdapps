import { Maybe } from "purify-ts";

import { Identifier } from "./Identifier";
import {
  Event,
  Organization,
  OrganizationStub,
  Person,
  PersonStub,
  PublicationEvent,
  PublicationEventStub,
  RadioBroadcastService,
  RadioBroadcastServiceStub,
  RadioEpisode,
  RadioEpisodeStub,
  Thing,
} from "./generated";

function stubifyEvent(event: Event): ReturnType<typeof stubifyThing> & {
  startDate: Maybe<Date>;
  superEvent: Maybe<Identifier>;
} {
  return {
    ...stubifyThing(event),
    startDate: event.startDate,
    superEvent: event.superEvent.map((event) => event.identifier),
  };
}

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
  publicationEvent: PublicationEvent,
): PublicationEventStub;

export function stubify(
  radioBroadcastService: RadioBroadcastService,
): RadioBroadcastServiceStub;

export function stubify(radioEpisode: RadioEpisode): RadioEpisodeStub;

export function stubify(
  model:
    | Organization
    | Person
    | PublicationEvent
    | RadioBroadcastService
    | RadioEpisode,
):
  | OrganizationStub
  | PersonStub
  | PublicationEventStub
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
    case "BroadcastEvent":
    case "PublicationEvent":
      return new PublicationEventStub(stubifyEvent(model));
    case "RadioBroadcastService":
      return new RadioBroadcastServiceStub(stubifyThing(model));
    case "RadioEpisode":
      return new RadioEpisodeStub(stubifyThing(model));
  }
}
