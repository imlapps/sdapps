import { Locale } from "@/lib/models/Locale";
import { encodeFileName } from "@kos-kit/next-utils";
import { Identifier, Organization, Person } from "@sdapps/models";

export class Hrefs {
  private readonly basePath: string;
  private readonly _locale: string;

  constructor({ basePath, locale }: { basePath: string; locale: Locale }) {
    this.basePath = basePath;
    this._locale = locale;
  }

  get locale() {
    return `${this.basePath}/${this._locale}`;
  }

  organization(person: { identifier: Organization["identifier"] }) {
    return `${this.organizations}/${encodeFileName(Identifier.toString(person.identifier))}`;
  }

  get organizations() {
    return `${this.locale}/organization`;
  }

  get people() {
    return `${this.locale}/person`;
  }

  person(person: { identifier: Person["identifier"] }) {
    return `${this.people}/${encodeFileName(Identifier.toString(person.identifier))}`;
  }
}
