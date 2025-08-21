import {
  BroadcastEvent,
  MusicAlbumStub,
  MusicCompositionStub,
  MusicRecordingStub,
} from "@sdapps/models";
import { Either, Maybe } from "purify-ts";

export async function musicRecordingBroadcastEvents(): Promise<
  Either<
    Error,
    readonly {
      readonly broadcastEvent: BroadcastEvent;
      readonly musicArtists: readonly MusicArtist[];
      readonly musicComposition: Maybe<MusicCompositionStub>;
      readonly musicComposers: readonly MusicComposer[];
      readonly musicAlbum: Maybe<MusicAlbumStub>;
      readonly musicRecording: MusicRecordingStub;
    }[]
  >
> {}
