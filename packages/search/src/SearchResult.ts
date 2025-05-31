export interface SearchResult {
  readonly identifier: string;
  readonly label: string;
  readonly type: "Event" | "Organization" | "Person";
}
