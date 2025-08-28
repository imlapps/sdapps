import { NamedNode } from "@rdfjs/types";
import { MusicArtistRoleStub } from "@sdapps/models";
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

  export function album(playlistItem: PlaylistItem): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}music-album/${hashStrings(playlistItem.artistName, playlistItem.collectionName, playlistItem.composerName, playlistItem.conductor, playlistItem.ensembles, playlistItem.soloists)}`,
    );
  }

  export function artist({
    name,
    roleName,
  }: { name: string; roleName?: MusicArtistRoleStub["roleName"] }): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}${artistRoleNameSlug(roleName)}/${hashStrings(name)}`,
    );
  }

  export function artistRole({
    name,
    roleName,
  }: { name: string; roleName: MusicArtistRoleStub["roleName"] }): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}role/${artistRoleNameSlug(roleName)}/${hashStrings(name)}`,
    );
  }

  function artistRoleNameSlug(roleName?: MusicArtistRoleStub["roleName"]) {
    if (!roleName) {
      return "artist";
    }

    switch (roleName.value) {
      case "http://purl.org/sdapps/ontology#MusicConductorRoleName":
        return "conductor";
      case "http://purl.org/sdapps/ontology#MusicEnsembleRoleName":
        return "ensemble";
      case "http://purl.org/sdapps/ontology#MusicSoloistRoleName":
        return "solist";
    }
  }

  export function composer({ name }: { name: string }): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}composer/${hashStrings(name)}`,
    );
  }

  export function composition(playlistItem: PlaylistItem): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}composition/${hashStrings(playlistItem.composerName, playlistItem.trackName)}`,
    );
  }

  export function episode(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}episode/${id}`);
  }

  export function episodeBroadcastEvent({ episodeId }: { episodeId: string }) {
    return dataFactory.namedNode(
      `${Iris.episode(episodeId).value}/broadcast-event`,
    );
  }

  export function episodePlaylist({ episodeId }: { episodeId: string }) {
    return dataFactory.namedNode(`${Iris.episode(episodeId).value}/playlist`);
  }

  export function episodePlaylistItem({
    episodeId,
    playlistItemId,
  }: { episodeId: string; playlistItemId: string }) {
    return dataFactory.namedNode(
      `${Iris.episodePlaylistItemList({ episodeId }).value}/${playlistItemId}`,
    );
  }

  export function episodePlaylistItemBroadcastEvent({
    episodeId,
    playlistItemId,
  }: { episodeId: string; playlistItemId: string }) {
    return dataFactory.namedNode(
      `${Iris.episodePlaylistItem({ episodeId, playlistItemId }).value}/broadcast-event`,
    );
  }

  export function episodePlaylistItemList({
    episodeId,
  }: { episodeId: string }) {
    return dataFactory.namedNode(
      `${Iris.episodePlaylist({ episodeId }).value}/track`,
    );
  }

  export function program(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}program/${id}`);
  }

  export function recording(playlistItem: PlaylistItem): NamedNode {
    return dataFactory.namedNode(
      `${radioBaseIri}music-recording/${hashStrings(playlistItem.artistName, playlistItem.composerName, playlistItem.conductor, playlistItem.ensembles, playlistItem.soloists, playlistItem.trackName)}`,
    );
  }

  export function ucs(id: string): NamedNode {
    return dataFactory.namedNode(`${nprComposerApiBaseUrl}ucs/${id}`);
  }
}
