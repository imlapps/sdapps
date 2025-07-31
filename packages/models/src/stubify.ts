import { Maybe } from "purify-ts";

import { Identifier } from "./Identifier";
import {
  ArticleStub,
  CreativeWork,
  CreativeWorkSeriesStub,
  CreativeWorkStub,
  EpisodeStub,
  Event,
  ItemList,
  ItemListStub,
  ListItem,
  ListItemStub,
  MediaObjectStub,
  MessageStub,
  MusicAlbum,
  MusicAlbumStub,
  MusicComposition,
  MusicCompositionStub,
  MusicGroup,
  MusicGroupStub,
  MusicPlaylist,
  MusicPlaylistStub,
  MusicRecording,
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
export function stubify(model: ItemList): ItemListStub;

export function stubify(model: ListItem): ListItemStub;

export function stubify(model: MusicAlbum): MusicAlbumStub;

export function stubify(model: MusicComposition): MusicCompositionStub;

export function stubify(model: MusicGroup): MusicGroupStub;

export function stubify(model: MusicPlaylist): MusicPlaylistStub;

export function stubify(model: MusicRecording): MusicRecordingStub;

export function stubify(model: Organization): OrganizationStub;

export function stubify(model: Person): PersonStub;

export function stubify(model: PublicationEvent): PublicationEventStub;

export function stubify(
  model: RadioBroadcastService,
): RadioBroadcastServiceStub;

export function stubify(model: RadioEpisode): RadioEpisodeStub;

export function stubify(model: RadioSeries): RadioSeriesStub;

export function stubify(model: CreativeWork): CreativeWorkStub;

export function stubify(
  model:
    | CreativeWork
    | ItemList
    | ListItem
    | Organization
    | Person
    | PublicationEvent
    | RadioBroadcastService
    | RadioEpisode
    | RadioSeries,
):
  | CreativeWorkStub
  | ItemListStub
  | ListItemStub
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
    case "ItemList":
      return new ItemListStub(stubifyThing(model));
    case "ListItem":
      return new ListItemStub({
        ...stubifyThing(model),
        item: model.item,
        position: model.position,
      });
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
    case "MusicPlaylist":
      return new MusicPlaylistStub(stubifyThing(model));
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
