export class WikipediaEntity {
  readonly url: URL;
  readonly urlTitle: string;
  readonly wikidataEntityId: string;

  constructor({
    url,
    urlTitle,
    wikidataEntityId,
  }: {
    url: URL;
    urlTitle: string;
    wikidataEntityId: string;
  }) {
    this.url = url;
    this.urlTitle = urlTitle;
    this.wikidataEntityId = wikidataEntityId;
  }

  toString(): string {
    return this.urlTitle;
  }
}
