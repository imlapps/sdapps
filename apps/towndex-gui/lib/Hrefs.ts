import { Locale } from "@/lib/models/Locale";
import { encodeFileName } from "@kos-kit/next-utils";
import { Identifier, Person } from "@sdapps/models";

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

  get people() {
    return `${this.locale}/people`;
  }

  person(person: { identifier: Person["identifier"] }) {
    return `${this.people}/${encodeFileName(Identifier.toString(person.identifier))}`;
  }
}
