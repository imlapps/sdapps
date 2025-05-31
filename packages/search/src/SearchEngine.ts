import { LanguageTag } from "@sdapps/models";
import { LunrSearchEngine } from "./LunrSearchEngine.js";
import { SearchResults } from "./SearchResults.js";

export interface SearchEngine {
  readonly type: SearchEngine.Type;

  search(kwds: {
    languageTag: LanguageTag;
    limit: number;
    offset: number;
    query: string;
  }): Promise<SearchResults>;

  toJson(): SearchEngine.Json;
}

export namespace SearchEngine {
  export function fromJson(json: Json): SearchEngine {
    switch (json.type) {
      case "lunr":
        return LunrSearchEngine.fromJson(json);
    }
  }

  /**
   * JSON serialization of a SearchEngine.
   */
  export interface Json {
    readonly type: Type;

    [index: string]: any;
  }

  export type Type = "lunr";
}
