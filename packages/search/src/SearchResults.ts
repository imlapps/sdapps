import { SearchResult } from "./SearchResult.js";

export interface SearchResults {
  readonly page: readonly SearchResult[];
  readonly total: number;
}
