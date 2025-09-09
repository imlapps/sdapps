import {
  $ObjectSet,
  EventStub,
  Identifier,
  LanguageTag,
  OrganizationStub,
  PersonStub,
  displayLabel,
  iso8601DateString,
} from "@sdapps/models";

import lunr, { Index } from "lunr";
import { LunrIndexCompactor } from "./LunrIndexCompactor.js";
import { SearchEngine } from "./SearchEngine.js";
import { SearchResult } from "./SearchResult.js";
import { SearchResults } from "./SearchResults.js";

/**
 * A SearchEngine implementation built with Lunr.js, so it can be used in the browser.
 */
export class LunrSearchEngine implements SearchEngine {
  readonly type = "lunr";

  private constructor(
    private readonly documents: Record<
      SearchResult["type"],
      Record<string, string>
    >, // type -> identifier -> label
    private readonly index: Index,
    private readonly languageTag: LanguageTag,
  ) {}

  static async create({
    languageTag,
    objectSet,
  }: {
    languageTag: LanguageTag;
    objectSet: $ObjectSet;
  }): Promise<LunrSearchEngine> {
    const indexDocuments: {
      readonly identifier: string;
      readonly label: string;
      readonly type: SearchResult["type"];
    }[] = [];

    async function* modelsGenerator(): AsyncGenerator<
      [
        SearchResult["type"],
        readonly (EventStub | OrganizationStub | PersonStub)[],
      ]
    > {
      yield ["Event", (await objectSet.eventStubs()).orDefault([])];
      yield [
        "Organization",
        (await objectSet.organizationStubs()).orDefault([]),
      ];
      yield ["Person", (await objectSet.personStubs()).orDefault([])];
    }

    for await (const [indexDocumentType, models] of modelsGenerator()) {
      for (const model of models) {
        if (!model.name.isJust()) {
          continue;
        }

        let label: string;
        switch (indexDocumentType) {
          case "Event": {
            label = await eventLabel(model as EventStub, objectSet);
            break;
          }
          default:
            label = displayLabel(model);
            break;
        }

        indexDocuments.push({
          identifier: Identifier.toString(model.$identifier),
          label,
          type: indexDocumentType,
        });
      }
    }

    const compactIndexDocuments: Record<string, Record<string, string>> = {};
    const index = lunr(function () {
      this.ref("identifier");
      this.field("label");
      for (const indexDocument of indexDocuments) {
        if (indexDocument === null) {
          continue;
        }
        this.add(indexDocument);

        let compactIndexDocumentsByIdentifier =
          compactIndexDocuments[indexDocument.type];
        if (!compactIndexDocumentsByIdentifier) {
          compactIndexDocumentsByIdentifier = compactIndexDocuments[
            indexDocument.type
          ] = {};
        }
        compactIndexDocumentsByIdentifier[indexDocument.identifier] =
          indexDocument.label;
      }
    });

    return new LunrSearchEngine(compactIndexDocuments, index, languageTag);
  }

  static fromJson(json: SearchEngine.Json) {
    const lunrIndexCompactor = new LunrIndexCompactor();
    return new LunrSearchEngine(
      json["documents"],
      lunrIndexCompactor.expandLunrIndex(json["index"]),
      json["languageTag"],
    );
  }

  async search({
    languageTag,
    limit,
    offset,
    query,
  }: {
    languageTag: LanguageTag;
    limit: number;
    offset: number;
    query: string;
  }): Promise<SearchResults> {
    if (this.languageTag !== languageTag) {
      throw new RangeError(
        `expected language tag '${this.languageTag}', actual '${languageTag}`,
      );
    }

    const indexResults = this.index.search(query);

    const page: SearchResult[] = [];
    for (const indexResult of indexResults.slice(offset)) {
      for (const stringDocumentType of Object.keys(this.documents)) {
        const documentType = stringDocumentType as SearchResult["type"];
        const documentLabel = this.documents[documentType][indexResult.ref];

        if (!documentLabel) {
          continue;
        }

        page.push({
          identifier: indexResult.ref,
          label: documentLabel,
          type: documentType,
        });
        if (page.length === limit) {
          return { page, total: indexResults.length };
        }
        break;
      }
    }
    return { page, total: indexResults.length };
  }

  toJson(): SearchEngine.Json {
    const lunrIndexCompactor = new LunrIndexCompactor();
    return {
      documents: this.documents,
      index: lunrIndexCompactor.compactLunrIndex(this.index),
      languageTag: this.languageTag,
      type: "lunr",
    };
  }
}

async function eventLabel(
  event: EventStub,
  objectSet: $ObjectSet,
): Promise<string> {
  const eventLabelParts: string[] = [];
  if (event.startDate.isJust()) {
    eventLabelParts.push(iso8601DateString(event.startDate.unsafeCoerce()));
  }
  eventLabelParts.push(displayLabel(event));
  const eventLabelString = eventLabelParts.join(" ");

  if (event.superEvent.isNothing()) {
    return eventLabelString;
  }
  const superEventEither = await objectSet.eventStub(
    event.superEvent.unsafeCoerce(),
  );
  if (superEventEither.isLeft()) {
    return eventLabelString;
  }
  return `${await eventLabel(superEventEither.unsafeCoerce(), objectSet)} > ${eventLabelString}`;
}
