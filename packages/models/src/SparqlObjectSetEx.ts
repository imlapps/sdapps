import { Either } from "purify-ts";
import { $SparqlObjectSet, RadioEpisode } from "./generated.js";

export class SparqlObjectSetEx extends $SparqlObjectSet {
  override radioEpisodeIdentifiers(
    query?: SparqlObjectSetEx.RadioEpisodeQuery,
  ): Promise<Either<Error, readonly RadioEpisode.Identifier[]>> {
    return super.radioEpisodeIdentifiers(
      SparqlObjectSetEx.RadioEpisodeQuery.toPatternsQuery(query),
    );
  }
}

export namespace SparqlObjectSetEx {
  export type RadioEpisodeQuery = Omit<
    $SparqlObjectSet.Query<RadioEpisode.Identifier>,
    "where"
  > & {
    readonly where?:
      | $SparqlObjectSet.Where<RadioEpisode.Identifier>
      | { date: Date; type: "date" };
  };

  export namespace RadioEpisodeQuery {
    export function toPatternsQuery(
      query?: RadioEpisodeQuery,
    ): $SparqlObjectSet.Query<RadioEpisode.Identifier> {
      if (query?.where?.type !== "date") {
        return { ...query, where: query?.where };
      }

      return {
        ...query,
        where: {
          patterns: () => [],
          type: "patterns",
        },
      };
    }
  }
}
