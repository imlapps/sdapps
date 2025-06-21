import { NamedNode } from "@rdfjs/types";
import { sha256 } from "js-sha256";

import N3 from "n3";

const dataFactory = N3.DataFactory;

interface PlaylistItem {
  artistName?: string;
  collectionName?: string;
  composerName?: string;
  conductor?: string;
  ensembles?: string;
  id: string;
  soloists?: string;
  trackName: string;
}

function hashStrings(...strings: readonly (string | undefined)[]): string {
  const hasher = sha256.create();
  let valid = false;
  for (const string of strings) {
    if (string) {
      hasher.update(string);
      valid = true;
    }
  }
  if (!valid) {
    throw new Error("no strings to hash");
  }
  return hasher.hex();
}

export namespace Iris {
  const nprComposerApiBaseUrl = "https://api.composer.nprstations.org/v1/";
  const radioBaseIri = "http://purl.org/sdapps/instance/radio/";

  export function broadcastEvent({ episodeId }: { episodeId: string }) {
    return dataFactory.namedNode(
      `${Iris.episode(episodeId).value}/broadcast-event`,
    );
  }

  export function episode(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}episode/${id}`);
  }

  export function musicAlbum(playlistItem: PlaylistItem): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}music-album/${hashStrings(playlistItem.artistName, playlistItem.collectionName, playlistItem.composerName, playlistItem.conductor, playlistItem.ensembles, playlistItem.soloists)}`,
    );
  }

  export function musicComposition(playlistItem: PlaylistItem): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}music-composition/${hashStrings(playlistItem.composerName, playlistItem.trackName)}`,
    );
  }

  export function musicGroup({ name }: { name: string }): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}music-group/${hashStrings(name)}`,
    );
  }

  export function musicRecording(playlistItem: PlaylistItem): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}music-recording/${hashStrings(playlistItem.artistName, playlistItem.composerName, playlistItem.conductor, playlistItem.ensembles, playlistItem.soloists, playlistItem.trackName)}`,
    );
  }

  export function program(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}program/${id}`);
  }

  export function ucs(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}ucs/${id}`);
  }
}
