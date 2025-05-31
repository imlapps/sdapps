import {
  EventStub,
  Identifier,
  LanguageTag,
  ModelSet,
  OrganizationStub,
  PersonStub,
  displayLabel,
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
    modelSet,
  }: {
    languageTag: LanguageTag;
    modelSet: ModelSet;
  }): Promise<LunrSearchEngine> {
    const indexDocuments: {
      readonly identifier: string;
      readonly label: string;
      readonly type: SearchResult["type"];
    }[] = [];
    for (const models of [
      await modelSet.models<EventStub>("EventStub"),
      await modelSet.models<OrganizationStub>("OrganizationStub"),
      await modelSet.models<PersonStub>("PersonStub"),
    ]) {
      if (models.isLeft()) {
        continue;
      }
      for (const model of models.unsafeCoerce()) {
        if (!model.name.isJust()) {
          continue;
        }
        let indexDocumentType: SearchResult["type"];
        switch (model.type) {
          case "EventStub":
            indexDocumentType = "Event";
            break;
          case "OrganizationStub":
            indexDocumentType = "Organization";
            break;
          case "PersonStub":
            indexDocumentType = "Person";
            break;
        }

        indexDocuments.push({
          identifier: Identifier.toString(model.identifier),
          label: displayLabel(model),
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
