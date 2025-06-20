import { Maybe } from "purify-ts";

import { Identifier } from "./Identifier";
import {
  ArticleStub,
  CreativeWork,
  CreativeWorkSeriesStub,
  CreativeWorkStub,
  EpisodeStub,
  Event,
  MediaObjectStub,
  MessageStub,
  MusicAlbumStub,
  MusicCompositionStub,
  MusicGroupStub,
  MusicRecordingStub,
  Organization,
  OrganizationStub,
  PerformingGroupStub,
  Person,
  PersonStub,
  PublicationEvent,
  PublicationEventStub,
  RadioBroadcastService,
  RadioBroadcastServiceStub,
  RadioEpisode,
  RadioEpisodeStub,
  RadioSeries,
  RadioSeriesStub,
  ReportStub,
  TextObjectStub,
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

export function stubify(radioSeries: RadioSeries): RadioSeriesStub;

export function stubify(creativeWork: CreativeWork): CreativeWorkStub;

export function stubify(
  model:
    | CreativeWork
    | Organization
    | Person
    | PublicationEvent
    | RadioBroadcastService
    | RadioEpisode
    | RadioSeries,
):
  | CreativeWorkStub
  | OrganizationStub
  | PersonStub
  | PublicationEventStub
  | RadioBroadcastServiceStub
  | RadioEpisodeStub
  | RadioSeriesStub {
  switch (model.type) {
    case "Article":
      return new ArticleStub(stubifyThing(model));
    case "CreativeWork":
      return new CreativeWorkStub(stubifyThing(model));
    case "CreativeWorkSeries":
      return new CreativeWorkSeriesStub(stubifyThing(model));
    case "Episode":
      return new EpisodeStub(stubifyThing(model));
    case "ImageObject":
      return new CreativeWorkStub(stubifyThing(model));
    case "MediaObject":
      return new MediaObjectStub(stubifyThing(model));
    case "Message":
      return new MessageStub(stubifyThing(model));
    case "MusicAlbum":
      return new MusicAlbumStub(stubifyThing(model));
    case "MusicGroup":
      return new MusicGroupStub(stubifyThing(model));
    case "MusicComposition":
      return new MusicCompositionStub(stubifyThing(model));
    case "MusicRecording":
      return new MusicRecordingStub(stubifyThing(model));
    case "Organization":
      return new OrganizationStub(stubifyThing(model));
    case "PerformingGroup":
      return new PerformingGroupStub(stubifyThing(model));
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
    case "RadioSeries":
      return new RadioSeriesStub(stubifyThing(model));
    case "Report":
      return new ReportStub(stubifyThing(model));
    case "TextObject":
      return new TextObjectStub(stubifyThing(model));
  }
}
