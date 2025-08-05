import { RadioBroadcastService } from "@sdapps/models";

export interface ExtractResult {
  readonly playlistResponseJson: any;
  readonly radioBroadcastService: RadioBroadcastService;
  readonly ucsIdentifier: string;
}
