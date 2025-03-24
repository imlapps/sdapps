import { configuration } from "@/lib/configuration";
import { encodeFileName } from "@kos-kit/next-utils";
import { Person } from "@sdapps/models";
import { Resource } from "rdfjs-resource";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Hrefs {
  static get root() {
    return `${configuration.nextBasePath}`;
  }

  static get people() {
    return `${Hrefs.root}people`;
  }

  static person(person: { identifier: Person["identifier"] }) {
    return `${Hrefs.people}/${encodeFileName(Resource.Identifier.toString(person.identifier))}`;
  }
}
