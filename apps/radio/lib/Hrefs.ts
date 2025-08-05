import { Locale } from "@/lib/models/Locale";
import {} from "@sdapps/models";

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
}
