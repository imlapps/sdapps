import { BroadcastDay } from "@/lib/models/BroadcastDay";
import { Locale } from "@/lib/models/Locale";
import { encodeFileName } from "@kos-kit/next-utils";
import { Identifier } from "@sdapps/models";

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

  playlist({
    broadcastDay,
    radioBroadcastService,
  }: {
    broadcastDay: BroadcastDay;
    radioBroadcastService: { identifier: Identifier };
  }) {
    return `${this.radioBroadcastService(radioBroadcastService)}/playlist/${broadcastDay.year}/${broadcastDay.month}/${broadcastDay.day}`;
  }

  radioBroadcastService(radioBroadcastService: {
    identifier: Identifier;
  }) {
    return `${this.locale}/radio-broadcast-service/${encodeFileName(Identifier.toString(radioBroadcastService.identifier))}`;
  }
}
