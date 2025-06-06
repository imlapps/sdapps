import { Locale } from "@/lib/models/Locale";
import { encodeFileName } from "@kos-kit/next-utils";
import {
  Event,
  Identifier,
  Organization,
  Person,
  Place,
  Report,
} from "@sdapps/models";

export class Hrefs {
  private readonly basePath: string;
  private readonly _locale: string;

  constructor({ basePath, locale }: { basePath: string; locale: Locale }) {
    this.basePath = basePath;
    this._locale = locale;
  }

  event(event: { identifier: Event["identifier"] }) {
    return `${this.events}/${encodeFileName(Identifier.toString(event.identifier))}`;
  }

  get events() {
    return `${this.locale}/event`;
  }

  get locale() {
    return `${this.basePath}/${this._locale}`;
  }

  organization(organization: { identifier: Organization["identifier"] }) {
    return `${this.organizations}/${encodeFileName(Identifier.toString(organization.identifier))}`;
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

  place(person: { identifier: Place["identifier"] }) {
    return `${this.places}/${encodeFileName(Identifier.toString(person.identifier))}`;
  }

  private get places() {
    return `${this.locale}/place`;
  }

  report(report: { identifier: Report["identifier"] }) {
    return `${this.reports}/${encodeFileName(Identifier.toString(report.identifier))}`;
  }

  private get reports() {
    return `${this.locale}/report`;
  }
}
