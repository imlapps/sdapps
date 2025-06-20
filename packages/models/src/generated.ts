import type * as rdfjs from "@rdfjs/types";
import { sha256 } from "js-sha256";
import { DataFactory as dataFactory } from "n3";
import * as purify from "purify-ts";
import * as rdfLiteral from "rdf-literal";
import * as rdfjsResource from "rdfjs-resource";
import * as sparqljs from "sparqljs";
import { z as zod } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
export type $EqualsResult = purify.Either<$EqualsResult.Unequal, true>;

export namespace $EqualsResult {
  export const Equal: $EqualsResult = purify.Either.of<Unequal, true>(true);

  export function fromBooleanEqualsResult(
    left: any,
    right: any,
    equalsResult: boolean | $EqualsResult,
  ): $EqualsResult {
    if (typeof equalsResult !== "boolean") {
      return equalsResult;
    }

    if (equalsResult) {
      return Equal;
    }

    return purify.Left({ left, right, type: "BooleanEquals" });
  }

  export type Unequal =
    | {
        readonly left: {
          readonly array: readonly any[];
          readonly element: any;
          readonly elementIndex: number;
        };
        readonly right: {
          readonly array: readonly any[];
          readonly unequals: readonly Unequal[];
        };
        readonly type: "ArrayElement";
      }
    | {
        readonly left: readonly any[];
        readonly right: readonly any[];
        readonly type: "ArrayLength";
      }
    | {
        readonly left: any;
        readonly right: any;
        readonly type: "BooleanEquals";
      }
    | {
        readonly left: any;
        readonly right: any;
        readonly type: "LeftError";
      }
    | {
        readonly right: any;
        readonly type: "LeftNull";
      }
    | {
        readonly left: bigint | boolean | number | string;
        readonly right: bigint | boolean | number | string;
        readonly type: "Primitive";
      }
    | {
        readonly left: object;
        readonly right: object;
        readonly propertyName: string;
        readonly propertyValuesUnequal: Unequal;
        readonly type: "Property";
      }
    | {
        readonly left: any;
        readonly right: any;
        readonly type: "RightError";
      }
    | {
        readonly left: any;
        readonly type: "RightNull";
      };
}
/**
 * Compare two objects with equals(other: T): boolean methods and return an $EqualsResult.
 */
export function $booleanEquals<T extends { equals: (other: T) => boolean }>(
  left: T,
  right: T,
): $EqualsResult {
  return $EqualsResult.fromBooleanEqualsResult(left, right, left.equals(right));
}
/**
 * Compare two values for strict equality (===), returning an $EqualsResult rather than a boolean.
 */
export function $strictEquals<T extends bigint | boolean | number | string>(
  left: T,
  right: T,
): $EqualsResult {
  return $EqualsResult.fromBooleanEqualsResult(left, right, left === right);
}
type $UnwrapR<T> = T extends purify.Either<any, infer R> ? R : never;
export function $maybeEquals<T>(
  leftMaybe: purify.Maybe<T>,
  rightMaybe: purify.Maybe<T>,
  valueEquals: (left: T, right: T) => boolean | $EqualsResult,
): $EqualsResult {
  if (leftMaybe.isJust()) {
    if (rightMaybe.isJust()) {
      return $EqualsResult.fromBooleanEqualsResult(
        leftMaybe,
        rightMaybe,
        valueEquals(leftMaybe.unsafeCoerce(), rightMaybe.unsafeCoerce()),
      );
    }
    return purify.Left({
      left: leftMaybe.unsafeCoerce(),
      type: "RightNull",
    });
  }

  if (rightMaybe.isJust()) {
    return purify.Left({
      right: rightMaybe.unsafeCoerce(),
      type: "LeftNull",
    });
  }

  return $EqualsResult.Equal;
}
export function $arrayEquals<T>(
  leftArray: readonly T[],
  rightArray: readonly T[],
  elementEquals: (left: T, right: T) => boolean | $EqualsResult,
): $EqualsResult {
  if (leftArray.length !== rightArray.length) {
    return purify.Left({
      left: leftArray,
      right: rightArray,
      type: "ArrayLength",
    });
  }

  for (
    let leftElementIndex = 0;
    leftElementIndex < leftArray.length;
    leftElementIndex++
  ) {
    const leftElement = leftArray[leftElementIndex];

    const rightUnequals: $EqualsResult.Unequal[] = [];
    for (
      let rightElementIndex = 0;
      rightElementIndex < rightArray.length;
      rightElementIndex++
    ) {
      const rightElement = rightArray[rightElementIndex];

      const leftElementEqualsRightElement =
        $EqualsResult.fromBooleanEqualsResult(
          leftElement,
          rightElement,
          elementEquals(leftElement, rightElement),
        );
      if (leftElementEqualsRightElement.isRight()) {
        break; // left element === right element, break out of the right iteration
      }
      rightUnequals.push(
        leftElementEqualsRightElement.extract() as $EqualsResult.Unequal,
      );
    }

    if (rightUnequals.length === rightArray.length) {
      // All right elements were unequal to the left element
      return purify.Left({
        left: {
          array: leftArray,
          element: leftElement,
          elementIndex: leftElementIndex,
        },
        right: {
          array: rightArray,
          unequals: rightUnequals,
        },
        type: "ArrayElement",
      });
    }
    // Else there was a right element equal to the left element, continue to the next left element
  }

  return $EqualsResult.Equal;
}
/**
 * Compare two Dates and return an $EqualsResult.
 */
export function $dateEquals(left: Date, right: Date): $EqualsResult {
  return $EqualsResult.fromBooleanEqualsResult(
    left,
    right,
    left.getTime() === right.getTime(),
  );
}
export abstract class Model {
  abstract readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract readonly type:
    | "Action"
    | "ActionStub"
    | "Article"
    | "ArticleStub"
    | "AssessAction"
    | "AssessActionStub"
    | "BroadcastEvent"
    | "BroadcastService"
    | "BroadcastServiceStub"
    | "ChooseAction"
    | "ChooseActionStub"
    | "CreativeWork"
    | "CreativeWorkSeries"
    | "CreativeWorkSeriesStub"
    | "CreativeWorkStub"
    | "Enumeration"
    | "Episode"
    | "EpisodeStub"
    | "Event"
    | "EventStub"
    | "GenderType"
    | "ImageObject"
    | "Intangible"
    | "IntangibleStub"
    | "Invoice"
    | "InvoiceStub"
    | "MediaObject"
    | "MediaObjectStub"
    | "Message"
    | "MessageStub"
    | "MonetaryAmount"
    | "MonetaryAmountStub"
    | "MusicAlbum"
    | "MusicAlbumStub"
    | "MusicComposition"
    | "MusicCompositionStub"
    | "MusicGroup"
    | "MusicGroupStub"
    | "MusicRecording"
    | "MusicRecordingStub"
    | "Occupation"
    | "Order"
    | "OrderStub"
    | "Organization"
    | "OrganizationStub"
    | "PerformingGroup"
    | "PerformingGroupStub"
    | "Person"
    | "PersonStub"
    | "Place"
    | "PlaceStub"
    | "PublicationEvent"
    | "PublicationEventStub"
    | "QuantitativeValue"
    | "QuantitativeValueStub"
    | "RadioBroadcastService"
    | "RadioBroadcastServiceStub"
    | "RadioEpisode"
    | "RadioEpisodeStub"
    | "RadioSeries"
    | "RadioSeriesStub"
    | "Report"
    | "ReportStub"
    | "Role"
    | "Service"
    | "ServiceStub"
    | "StructuredValue"
    | "StructuredValueStub"
    | "TextObject"
    | "TextObjectStub"
    | "Thing"
    | "ThingStub"
    | "VoteAction"
    | "VoteActionStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(_parameters: object) {}

  equals(other: Model): $EqualsResult {
    return $booleanEquals(this.identifier, other.identifier)
      .mapLeft((propertyValuesUnequal) => ({
        left: this,
        right: other,
        propertyName: "identifier",
        propertyValuesUnequal,
        type: "Property" as const,
      }))
      .chain(() =>
        $strictEquals(this.type, other.type).mapLeft(
          (propertyValuesUnequal) => ({
            left: this,
            right: other,
            propertyName: "type",
            propertyValuesUnequal,
            type: "Property" as const,
          }),
        ),
      );
  }

  hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    _hasher.update(this.identifier.value);
    _hasher.update(this.type);
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    return _hasher;
  }

  toJson(): ModelStatic.Json {
    return JSON.parse(
      JSON.stringify({
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        type: this.type,
      } satisfies ModelStatic.Json),
    );
  }

  toRdf({
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = resourceSet.mutableResource(this.identifier, {
      mutateGraph,
    });
    return _resource;
  }

  toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ModelStatic {
  export type Json = {
    readonly "@id": string;
    readonly type:
      | "Action"
      | "ActionStub"
      | "Article"
      | "ArticleStub"
      | "AssessAction"
      | "AssessActionStub"
      | "BroadcastEvent"
      | "BroadcastService"
      | "BroadcastServiceStub"
      | "ChooseAction"
      | "ChooseActionStub"
      | "CreativeWork"
      | "CreativeWorkSeries"
      | "CreativeWorkSeriesStub"
      | "CreativeWorkStub"
      | "Enumeration"
      | "Episode"
      | "EpisodeStub"
      | "Event"
      | "EventStub"
      | "GenderType"
      | "ImageObject"
      | "Intangible"
      | "IntangibleStub"
      | "Invoice"
      | "InvoiceStub"
      | "MediaObject"
      | "MediaObjectStub"
      | "Message"
      | "MessageStub"
      | "MonetaryAmount"
      | "MonetaryAmountStub"
      | "MusicAlbum"
      | "MusicAlbumStub"
      | "MusicComposition"
      | "MusicCompositionStub"
      | "MusicGroup"
      | "MusicGroupStub"
      | "MusicRecording"
      | "MusicRecordingStub"
      | "Occupation"
      | "Order"
      | "OrderStub"
      | "Organization"
      | "OrganizationStub"
      | "PerformingGroup"
      | "PerformingGroupStub"
      | "Person"
      | "PersonStub"
      | "Place"
      | "PlaceStub"
      | "PublicationEvent"
      | "PublicationEventStub"
      | "QuantitativeValue"
      | "QuantitativeValueStub"
      | "RadioBroadcastService"
      | "RadioBroadcastServiceStub"
      | "RadioEpisode"
      | "RadioEpisodeStub"
      | "RadioSeries"
      | "RadioSeriesStub"
      | "Report"
      | "ReportStub"
      | "Role"
      | "Service"
      | "ServiceStub"
      | "StructuredValue"
      | "StructuredValueStub"
      | "TextObject"
      | "TextObjectStub"
      | "Thing"
      | "ThingStub"
      | "VoteAction"
      | "VoteActionStub";
  };

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode }
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ identifier });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Model> {
    return (
      ThingStubStatic.fromJson(json) as purify.Either<zod.ZodError, Model>
    ).altLazy(
      () => ThingStatic.fromJson(json) as purify.Either<zod.ZodError, Model>,
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        {
          label: "Identifier",
          scope: `${scopePrefix}/properties/@id`,
          type: "Control",
        },
        {
          rule: {
            condition: {
              schema: { const: "Model" },
              scope: `${scopePrefix}/properties/type`,
            },
            effect: "HIDE",
          },
          scope: `${scopePrefix}/properties/type`,
          type: "Control",
        },
      ],
      label: "Model",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return zod.object({
      "@id": zod.string().min(1),
      type: zod.enum([
        "Action",
        "ActionStub",
        "Article",
        "ArticleStub",
        "AssessAction",
        "AssessActionStub",
        "BroadcastEvent",
        "BroadcastService",
        "BroadcastServiceStub",
        "ChooseAction",
        "ChooseActionStub",
        "CreativeWork",
        "CreativeWorkSeries",
        "CreativeWorkSeriesStub",
        "CreativeWorkStub",
        "Enumeration",
        "Episode",
        "EpisodeStub",
        "Event",
        "EventStub",
        "GenderType",
        "ImageObject",
        "Intangible",
        "IntangibleStub",
        "Invoice",
        "InvoiceStub",
        "MediaObject",
        "MediaObjectStub",
        "Message",
        "MessageStub",
        "MonetaryAmount",
        "MonetaryAmountStub",
        "MusicAlbum",
        "MusicAlbumStub",
        "MusicComposition",
        "MusicCompositionStub",
        "MusicGroup",
        "MusicGroupStub",
        "MusicRecording",
        "MusicRecordingStub",
        "Occupation",
        "Order",
        "OrderStub",
        "Organization",
        "OrganizationStub",
        "PerformingGroup",
        "PerformingGroupStub",
        "Person",
        "PersonStub",
        "Place",
        "PlaceStub",
        "PublicationEvent",
        "PublicationEventStub",
        "QuantitativeValue",
        "QuantitativeValueStub",
        "RadioBroadcastService",
        "RadioBroadcastServiceStub",
        "RadioEpisode",
        "RadioEpisodeStub",
        "RadioSeries",
        "RadioSeriesStub",
        "Report",
        "ReportStub",
        "Role",
        "Service",
        "ServiceStub",
        "StructuredValue",
        "StructuredValueStub",
        "TextObject",
        "TextObjectStub",
        "Thing",
        "ThingStub",
        "VoteAction",
        "VoteActionStub",
      ]),
    });
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode }
  > {
    const identifier = _resource.identifier;
    return purify.Either.of({ identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ModelStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Model> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ThingStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Model
      >
    ).altLazy(
      () =>
        ThingStatic.fromRdf(otherParameters) as purify.Either<
          rdfjsResource.Resource.ValueError,
          Model
        >,
    );
  }

  export const rdfProperties = [];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        ModelStatic.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ModelStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      ModelStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(_parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    return [];
  }

  export function sparqlWherePatterns(_parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    return [];
  }
}
export class Thing extends Model {
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type:
    | "Thing"
    | "Action"
    | "Article"
    | "AssessAction"
    | "BroadcastEvent"
    | "BroadcastService"
    | "ChooseAction"
    | "CreativeWork"
    | "CreativeWorkSeries"
    | "Enumeration"
    | "Episode"
    | "Event"
    | "GenderType"
    | "ImageObject"
    | "Intangible"
    | "Invoice"
    | "MediaObject"
    | "Message"
    | "MonetaryAmount"
    | "MusicAlbum"
    | "MusicComposition"
    | "MusicGroup"
    | "MusicRecording"
    | "Occupation"
    | "Order"
    | "Organization"
    | "PerformingGroup"
    | "Person"
    | "Place"
    | "PublicationEvent"
    | "QuantitativeValue"
    | "RadioBroadcastService"
    | "RadioEpisode"
    | "RadioSeries"
    | "Report"
    | "Role"
    | "Service"
    | "StructuredValue"
    | "TextObject"
    | "VoteAction" = "Thing";
  readonly description: purify.Maybe<string>;
  readonly localIdentifiers: readonly string[];
  readonly name: purify.Maybe<string>;
  readonly order: purify.Maybe<number>;
  readonly sameAs: readonly rdfjs.NamedNode[];
  readonly subjectOf: readonly (CreativeWorkStub | EventStub)[];
  readonly url: purify.Maybe<rdfjs.NamedNode>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly description?: purify.Maybe<string> | string;
      readonly localIdentifiers?: readonly string[];
      readonly name?: purify.Maybe<string> | string;
      readonly order?: number | purify.Maybe<number>;
      readonly sameAs?: readonly rdfjs.NamedNode[];
      readonly subjectOf?: readonly (CreativeWorkStub | EventStub)[];
      readonly url?: rdfjs.NamedNode | purify.Maybe<rdfjs.NamedNode> | string;
    } & ConstructorParameters<typeof Model>[0],
  ) {
    super(parameters);
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

    if (purify.Maybe.isMaybe(parameters.description)) {
      this.description = parameters.description;
    } else if (typeof parameters.description === "string") {
      this.description = purify.Maybe.of(parameters.description);
    } else if (typeof parameters.description === "undefined") {
      this.description = purify.Maybe.empty();
    } else {
      this.description = parameters.description as never;
    }

    if (typeof parameters.localIdentifiers === "undefined") {
      this.localIdentifiers = [];
    } else if (Array.isArray(parameters.localIdentifiers)) {
      this.localIdentifiers = parameters.localIdentifiers;
    } else {
      this.localIdentifiers = parameters.localIdentifiers as never;
    }

    if (purify.Maybe.isMaybe(parameters.name)) {
      this.name = parameters.name;
    } else if (typeof parameters.name === "string") {
      this.name = purify.Maybe.of(parameters.name);
    } else if (typeof parameters.name === "undefined") {
      this.name = purify.Maybe.empty();
    } else {
      this.name = parameters.name as never;
    }

    if (purify.Maybe.isMaybe(parameters.order)) {
      this.order = parameters.order;
    } else if (typeof parameters.order === "number") {
      this.order = purify.Maybe.of(parameters.order);
    } else if (typeof parameters.order === "undefined") {
      this.order = purify.Maybe.empty();
    } else {
      this.order = parameters.order as never;
    }

    if (typeof parameters.sameAs === "undefined") {
      this.sameAs = [];
    } else if (Array.isArray(parameters.sameAs)) {
      this.sameAs = parameters.sameAs;
    } else {
      this.sameAs = parameters.sameAs as never;
    }

    if (typeof parameters.subjectOf === "undefined") {
      this.subjectOf = [];
    } else if (Array.isArray(parameters.subjectOf)) {
      this.subjectOf = parameters.subjectOf;
    } else {
      this.subjectOf = parameters.subjectOf as never;
    }

    if (purify.Maybe.isMaybe(parameters.url)) {
      this.url = parameters.url;
    } else if (typeof parameters.url === "object") {
      this.url = purify.Maybe.of(parameters.url);
    } else if (typeof parameters.url === "string") {
      this.url = purify.Maybe.of(dataFactory.namedNode(parameters.url));
    } else if (typeof parameters.url === "undefined") {
      this.url = purify.Maybe.empty();
    } else {
      this.url = parameters.url as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Thing): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.description,
          other.description,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "description",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, $strictEquals))(
          this.localIdentifiers,
          other.localIdentifiers,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "localIdentifiers",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.name,
          other.name,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "name",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.order,
          other.order,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "order",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, $booleanEquals))(
          this.sameAs,
          other.sameAs,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "sameAs",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(
            left,
            right,
            (
              left: CreativeWorkStub | EventStub,
              right: CreativeWorkStub | EventStub,
            ) => {
              if (
                left.type === "CreativeWorkStub" &&
                right.type === "CreativeWorkStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (left.type === "ArticleStub" && right.type === "ArticleStub") {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "CreativeWorkSeriesStub" &&
                right.type === "CreativeWorkSeriesStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (left.type === "EpisodeStub" && right.type === "EpisodeStub") {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "MediaObjectStub" &&
                right.type === "MediaObjectStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (left.type === "MessageStub" && right.type === "MessageStub") {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "MusicAlbumStub" &&
                right.type === "MusicAlbumStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "MusicCompositionStub" &&
                right.type === "MusicCompositionStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "MusicRecordingStub" &&
                right.type === "MusicRecordingStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "RadioEpisodeStub" &&
                right.type === "RadioEpisodeStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "RadioSeriesStub" &&
                right.type === "RadioSeriesStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (left.type === "ReportStub" && right.type === "ReportStub") {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "TextObjectStub" &&
                right.type === "TextObjectStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (left.type === "EventStub" && right.type === "EventStub") {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (
                left.type === "PublicationEventStub" &&
                right.type === "PublicationEventStub"
              ) {
                return ((left, right) => left.equals(right))(left, right);
              }

              return purify.Left({
                left,
                right,
                propertyName: "type",
                propertyValuesUnequal: {
                  left: typeof left,
                  right: typeof right,
                  type: "BooleanEquals" as const,
                },
                type: "Property" as const,
              });
            },
          ))(this.subjectOf, other.subjectOf).mapLeft(
          (propertyValuesUnequal) => ({
            left: this,
            right: other,
            propertyName: "subjectOf",
            propertyValuesUnequal,
            type: "Property" as const,
          }),
        ),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $booleanEquals))(
          this.url,
          other.url,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "url",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.description.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.localIdentifiers) {
      _hasher.update(_item0);
    }

    this.name.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.order.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    for (const _item0 of this.sameAs) {
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
    }

    for (const _item0 of this.subjectOf) {
      switch (_item0.type) {
        case "CreativeWorkStub":
        case "ArticleStub":
        case "CreativeWorkSeriesStub":
        case "EpisodeStub":
        case "MediaObjectStub":
        case "MessageStub":
        case "MusicAlbumStub":
        case "MusicCompositionStub":
        case "MusicRecordingStub":
        case "RadioEpisodeStub":
        case "RadioSeriesStub":
        case "ReportStub":
        case "TextObjectStub": {
          _item0.hash(_hasher);
          break;
        }
        case "EventStub":
        case "PublicationEventStub": {
          _item0.hash(_hasher);
          break;
        }
        default:
          _item0 satisfies never;
          throw new Error("unrecognized type");
      }
    }

    this.url.ifJust((_value0) => {
      _hasher.update(_value0.termType);
      _hasher.update(_value0.value);
    });
    return _hasher;
  }

  override toJson(): ThingStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        description: this.description.map((_item) => _item).extract(),
        localIdentifiers: this.localIdentifiers.map((_item) => _item),
        name: this.name.map((_item) => _item).extract(),
        order: this.order.map((_item) => _item).extract(),
        sameAs: this.sameAs.map((_item) => ({ "@id": _item.value })),
        subjectOf: this.subjectOf.map((_item) =>
          _item.type === "EventStub" || _item.type === "PublicationEventStub"
            ? _item.toJson()
            : _item.toJson(),
        ),
        url: this.url.map((_item) => ({ "@id": _item.value })).extract(),
      } satisfies ThingStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Thing"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/description"),
      this.description,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/identifier"),
      this.localIdentifiers.map((_item) => _item),
    );
    _resource.add(dataFactory.namedNode("http://schema.org/name"), this.name);
    _resource.add(
      dataFactory.namedNode("http://www.w3.org/ns/shacl#order"),
      this.order,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/sameAs"),
      this.sameAs.map((_item) => _item),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/subjectOf"),
      this.subjectOf.map((_item) =>
        _item.type === "EventStub" || _item.type === "PublicationEventStub"
          ? _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet })
          : _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(dataFactory.namedNode("http://schema.org/url"), this.url);
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ThingStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Thing",
  );
  export type Json = {
    readonly description: string | undefined;
    readonly localIdentifiers: readonly string[];
    readonly name: string | undefined;
    readonly order: number | undefined;
    readonly sameAs: readonly { readonly "@id": string }[];
    readonly subjectOf: readonly (
      | CreativeWorkStubStatic.Json
      | EventStubStatic.Json
    )[];
    readonly url: { readonly "@id": string } | undefined;
  } & ModelStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      description: purify.Maybe<string>;
      localIdentifiers: readonly string[];
      name: purify.Maybe<string>;
      order: purify.Maybe<number>;
      sameAs: readonly rdfjs.NamedNode[];
      subjectOf: readonly (CreativeWorkStub | EventStub)[];
      url: purify.Maybe<rdfjs.NamedNode>;
    } & $UnwrapR<ReturnType<typeof ModelStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ModelStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const description = purify.Maybe.fromNullable(_jsonObject["description"]);
    const localIdentifiers = _jsonObject["localIdentifiers"];
    const name = purify.Maybe.fromNullable(_jsonObject["name"]);
    const order = purify.Maybe.fromNullable(_jsonObject["order"]);
    const sameAs = _jsonObject["sameAs"].map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    const subjectOf = _jsonObject["subjectOf"].map((_item) =>
      _item.type === "EventStub" || _item.type === "PublicationEventStub"
        ? EventStubStatic.fromJson(_item).unsafeCoerce()
        : CreativeWorkStubStatic.fromJson(_item).unsafeCoerce(),
    );
    const url = purify.Maybe.fromNullable(_jsonObject["url"]).map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      description,
      localIdentifiers,
      name,
      order,
      sameAs,
      subjectOf,
      url,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Thing> {
    return (ActionStatic.fromJson(json) as purify.Either<zod.ZodError, Thing>)
      .altLazy(
        () =>
          CreativeWorkStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            Thing
          >,
      )
      .altLazy(
        () => EventStatic.fromJson(json) as purify.Either<zod.ZodError, Thing>,
      )
      .altLazy(
        () =>
          IntangibleStatic.fromJson(json) as purify.Either<zod.ZodError, Thing>,
      )
      .altLazy(
        () =>
          OrganizationStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            Thing
          >,
      )
      .altLazy(
        () => Person.fromJson(json) as purify.Either<zod.ZodError, Thing>,
      )
      .altLazy(() => Place.fromJson(json) as purify.Either<zod.ZodError, Thing>)
      .altLazy(() =>
        propertiesFromJson(json).map((properties) => new Thing(properties)),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ModelStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/description`, type: "Control" },
        {
          scope: `${scopePrefix}/properties/localIdentifiers`,
          type: "Control",
        },
        { scope: `${scopePrefix}/properties/name`, type: "Control" },
        { scope: `${scopePrefix}/properties/order`, type: "Control" },
        { scope: `${scopePrefix}/properties/sameAs`, type: "Control" },
        { scope: `${scopePrefix}/properties/subjectOf`, type: "Control" },
        { scope: `${scopePrefix}/properties/url`, type: "Control" },
      ],
      label: "Thing",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ModelStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "Thing",
          "Action",
          "Article",
          "AssessAction",
          "BroadcastEvent",
          "BroadcastService",
          "ChooseAction",
          "CreativeWork",
          "CreativeWorkSeries",
          "Enumeration",
          "Episode",
          "Event",
          "GenderType",
          "ImageObject",
          "Intangible",
          "Invoice",
          "MediaObject",
          "Message",
          "MonetaryAmount",
          "MusicAlbum",
          "MusicComposition",
          "MusicGroup",
          "MusicRecording",
          "Occupation",
          "Order",
          "Organization",
          "PerformingGroup",
          "Person",
          "Place",
          "PublicationEvent",
          "QuantitativeValue",
          "RadioBroadcastService",
          "RadioEpisode",
          "RadioSeries",
          "Report",
          "Role",
          "Service",
          "StructuredValue",
          "TextObject",
          "VoteAction",
        ]),
        description: zod.string().optional(),
        localIdentifiers: zod
          .string()
          .array()
          .default(() => []),
        name: zod.string().optional(),
        order: zod.number().optional(),
        sameAs: zod
          .object({ "@id": zod.string().min(1) })
          .array()
          .default(() => []),
        subjectOf: zod
          .discriminatedUnion("type", [
            CreativeWorkStubStatic.jsonZodSchema(),
            EventStubStatic.jsonZodSchema(),
          ])
          .array()
          .default(() => []),
        url: zod.object({ "@id": zod.string().min(1) }).optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      description: purify.Maybe<string>;
      localIdentifiers: readonly string[];
      name: purify.Maybe<string>;
      order: purify.Maybe<number>;
      sameAs: readonly rdfjs.NamedNode[];
      subjectOf: readonly (CreativeWorkStub | EventStub)[];
      url: purify.Maybe<rdfjs.NamedNode>;
    } & $UnwrapR<ReturnType<typeof ModelStatic.propertiesFromRdf>>
  > {
    const _super0Either = ModelStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Thing"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Thing)`,
          predicate: dataFactory.namedNode("http://schema.org/Thing"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _descriptionEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/description"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_descriptionEither.isLeft()) {
      return _descriptionEither;
    }

    const description = _descriptionEither.unsafeCoerce();
    const _localIdentifiersEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly string[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/identifier"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((_value) => _value.toString())
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_localIdentifiersEither.isLeft()) {
      return _localIdentifiersEither;
    }

    const localIdentifiers = _localIdentifiersEither.unsafeCoerce();
    const _nameEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/name"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_nameEither.isLeft()) {
      return _nameEither;
    }

    const name = _nameEither.unsafeCoerce();
    const _orderEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<number>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://www.w3.org/ns/shacl#order"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toNumber())
        .toMaybe(),
    );
    if (_orderEither.isLeft()) {
      return _orderEither;
    }

    const order = _orderEither.unsafeCoerce();
    const _sameAsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly rdfjs.NamedNode[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/sameAs"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((_value) => _value.toIri())
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_sameAsEither.isLeft()) {
      return _sameAsEither;
    }

    const sameAs = _sameAsEither.unsafeCoerce();
    const _subjectOfEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly (CreativeWorkStub | EventStub)[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/subjectOf"), {
          unique: true,
        })
        .flatMap((_item) =>
          (
            _item
              .toValues()
              .head()
              .chain((value) => value.toResource())
              .chain((_resource) =>
                CreativeWorkStubStatic.fromRdf({
                  ..._context,
                  languageIn: _languageIn,
                  resource: _resource,
                }),
              ) as purify.Either<
              rdfjsResource.Resource.ValueError,
              CreativeWorkStub | EventStub
            >
          )
            .altLazy(
              () =>
                _item
                  .toValues()
                  .head()
                  .chain((value) => value.toResource())
                  .chain((_resource) =>
                    EventStubStatic.fromRdf({
                      ..._context,
                      languageIn: _languageIn,
                      resource: _resource,
                    }),
                  ) as purify.Either<
                  rdfjsResource.Resource.ValueError,
                  CreativeWorkStub | EventStub
                >,
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_subjectOfEither.isLeft()) {
      return _subjectOfEither;
    }

    const subjectOf = _subjectOfEither.unsafeCoerce();
    const _urlEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<rdfjs.NamedNode>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/url"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toIri())
        .toMaybe(),
    );
    if (_urlEither.isLeft()) {
      return _urlEither;
    }

    const url = _urlEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      description,
      localIdentifiers,
      name,
      order,
      sameAs,
      subjectOf,
      url,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof ThingStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Thing> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ActionStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Thing
      >
    )
      .altLazy(
        () =>
          CreativeWorkStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(
        () =>
          EventStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(
        () =>
          IntangibleStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(
        () =>
          OrganizationStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(
        () =>
          Person.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(
        () =>
          Place.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(() =>
        ThingStatic.propertiesFromRdf(parameters).map(
          (properties) => new Thing(properties),
        ),
      );
  }

  export const rdfProperties = [
    ...ModelStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/description") },
    { path: dataFactory.namedNode("http://schema.org/identifier") },
    { path: dataFactory.namedNode("http://schema.org/name") },
    { path: dataFactory.namedNode("http://www.w3.org/ns/shacl#order") },
    { path: dataFactory.namedNode("http://schema.org/sameAs") },
    { path: dataFactory.namedNode("http://schema.org/subjectOf") },
    { path: dataFactory.namedNode("http://schema.org/url") },
  ];
}
export class Intangible extends Thing {
  override readonly type:
    | "Intangible"
    | "BroadcastService"
    | "Enumeration"
    | "GenderType"
    | "Invoice"
    | "MonetaryAmount"
    | "Occupation"
    | "Order"
    | "QuantitativeValue"
    | "RadioBroadcastService"
    | "Role"
    | "Service"
    | "StructuredValue" = "Intangible";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Intangible"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace IntangibleStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Intangible",
  );
  export type Json = ThingStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Intangible> {
    return (Invoice.fromJson(json) as purify.Either<zod.ZodError, Intangible>)
      .altLazy(
        () => Order.fromJson(json) as purify.Either<zod.ZodError, Intangible>,
      )
      .altLazy(
        () =>
          ServiceStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          StructuredValueStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          EnumerationStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          Occupation.fromJson(json) as purify.Either<zod.ZodError, Intangible>,
      )
      .altLazy(
        () => Role.fromJson(json) as purify.Either<zod.ZodError, Intangible>,
      )
      .altLazy(() =>
        propertiesFromJson(json).map(
          (properties) => new Intangible(properties),
        ),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStatic.jsonUiSchema({ scopePrefix })],
      label: "Intangible",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "Intangible",
          "BroadcastService",
          "Enumeration",
          "GenderType",
          "Invoice",
          "MonetaryAmount",
          "Occupation",
          "Order",
          "QuantitativeValue",
          "RadioBroadcastService",
          "Role",
          "Service",
          "StructuredValue",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Intangible"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Intangible)`,
          predicate: dataFactory.namedNode("http://schema.org/Intangible"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof IntangibleStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Intangible> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      Invoice.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Intangible
      >
    )
      .altLazy(
        () =>
          Order.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          ServiceStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          StructuredValueStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          EnumerationStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          Occupation.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          Role.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Intangible
          >,
      )
      .altLazy(() =>
        IntangibleStatic.propertiesFromRdf(parameters).map(
          (properties) => new Intangible(properties),
        ),
      );
  }

  export const rdfProperties = [...ThingStatic.rdfProperties];
}
export class Role extends Intangible {
  protected readonly _identifierPrefix?: string;
  override readonly type = "Role";
  readonly endDate: purify.Maybe<Date>;
  readonly roleName: purify.Maybe<rdfjs.NamedNode>;
  readonly startDate: purify.Maybe<Date>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly identifierPrefix?: string;
      readonly endDate?: Date | purify.Maybe<Date>;
      readonly roleName?:
        | rdfjs.NamedNode
        | purify.Maybe<rdfjs.NamedNode>
        | string;
      readonly startDate?: Date | purify.Maybe<Date>;
    } & ConstructorParameters<typeof Intangible>[0],
  ) {
    super(parameters);
    this._identifierPrefix = parameters.identifierPrefix;
    if (purify.Maybe.isMaybe(parameters.endDate)) {
      this.endDate = parameters.endDate;
    } else if (
      typeof parameters.endDate === "object" &&
      parameters.endDate instanceof Date
    ) {
      this.endDate = purify.Maybe.of(parameters.endDate);
    } else if (typeof parameters.endDate === "undefined") {
      this.endDate = purify.Maybe.empty();
    } else {
      this.endDate = parameters.endDate as never;
    }

    if (purify.Maybe.isMaybe(parameters.roleName)) {
      this.roleName = parameters.roleName;
    } else if (typeof parameters.roleName === "object") {
      this.roleName = purify.Maybe.of(parameters.roleName);
    } else if (typeof parameters.roleName === "string") {
      this.roleName = purify.Maybe.of(
        dataFactory.namedNode(parameters.roleName),
      );
    } else if (typeof parameters.roleName === "undefined") {
      this.roleName = purify.Maybe.empty();
    } else {
      this.roleName = parameters.roleName as never;
    }

    if (purify.Maybe.isMaybe(parameters.startDate)) {
      this.startDate = parameters.startDate;
    } else if (
      typeof parameters.startDate === "object" &&
      parameters.startDate instanceof Date
    ) {
      this.startDate = purify.Maybe.of(parameters.startDate);
    } else if (typeof parameters.startDate === "undefined") {
      this.startDate = purify.Maybe.empty();
    } else {
      this.startDate = parameters.startDate as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    return typeof this._identifier !== "undefined"
      ? this._identifier
      : dataFactory.namedNode(
          `${this.identifierPrefix}${this.hashShaclProperties(sha256.create())}`,
        );
  }

  protected get identifierPrefix(): string {
    return typeof this._identifierPrefix !== "undefined"
      ? this._identifierPrefix
      : `urn:shaclmate:${this.type}:`;
  }

  override equals(other: Role): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.endDate,
          other.endDate,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "endDate",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $booleanEquals))(
          this.roleName,
          other.roleName,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "roleName",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.startDate,
          other.startDate,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "startDate",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.endDate.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    this.roleName.ifJust((_value0) => {
      _hasher.update(_value0.termType);
      _hasher.update(_value0.value);
    });
    this.startDate.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    return _hasher;
  }

  override toJson(): Role.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        endDate: this.endDate
          .map((_item) => _item.toISOString().replace(/T.*$/, ""))
          .extract(),
        roleName: this.roleName
          .map((_item) => ({ "@id": _item.value }))
          .extract(),
        startDate: this.startDate
          .map((_item) => _item.toISOString().replace(/T.*$/, ""))
          .extract(),
      } satisfies Role.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Role"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/endDate"),
      this.endDate.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#date",
          ),
        }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/roleName"),
      this.roleName,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/startDate"),
      this.startDate.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#date",
          ),
        }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Role {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Role",
  );
  export type Json = {
    readonly endDate: string | undefined;
    readonly roleName: { readonly "@id": string } | undefined;
    readonly startDate: string | undefined;
  } & IntangibleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      endDate: purify.Maybe<Date>;
      roleName: purify.Maybe<rdfjs.NamedNode>;
      startDate: purify.Maybe<Date>;
    } & $UnwrapR<ReturnType<typeof IntangibleStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const endDate = purify.Maybe.fromNullable(_jsonObject["endDate"]).map(
      (_item) => new Date(_item),
    );
    const roleName = purify.Maybe.fromNullable(_jsonObject["roleName"]).map(
      (_item) => dataFactory.namedNode(_item["@id"]),
    );
    const startDate = purify.Maybe.fromNullable(_jsonObject["startDate"]).map(
      (_item) => new Date(_item),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      endDate,
      roleName,
      startDate,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Role> {
    return propertiesFromJson(json).map((properties) => new Role(properties));
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        IntangibleStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/endDate`, type: "Control" },
        { scope: `${scopePrefix}/properties/roleName`, type: "Control" },
        { scope: `${scopePrefix}/properties/startDate`, type: "Control" },
      ],
      label: "Role",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Role"),
        endDate: zod.string().date().optional(),
        roleName: zod.object({ "@id": zod.string().min(1) }).optional(),
        startDate: zod.string().date().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      endDate: purify.Maybe<Date>;
      roleName: purify.Maybe<rdfjs.NamedNode>;
      startDate: purify.Maybe<Date>;
    } & $UnwrapR<ReturnType<typeof IntangibleStatic.propertiesFromRdf>>
  > {
    const _super0Either = IntangibleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Role"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Role)`,
          predicate: dataFactory.namedNode("http://schema.org/Role"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _endDateEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/endDate"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_endDateEither.isLeft()) {
      return _endDateEither;
    }

    const endDate = _endDateEither.unsafeCoerce();
    const _roleNameEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<rdfjs.NamedNode>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/roleName"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toIri())
        .toMaybe(),
    );
    if (_roleNameEither.isLeft()) {
      return _roleNameEither;
    }

    const roleName = _roleNameEither.unsafeCoerce();
    const _startDateEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/startDate"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_startDateEither.isLeft()) {
      return _startDateEither;
    }

    const startDate = _startDateEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      endDate,
      roleName,
      startDate,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof Role.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Role> {
    return Role.propertiesFromRdf(parameters).map(
      (properties) => new Role(properties),
    );
  }

  export const rdfProperties = [
    ...IntangibleStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/endDate") },
    { path: dataFactory.namedNode("http://schema.org/roleName") },
    { path: dataFactory.namedNode("http://schema.org/startDate") },
  ];
}
export class Occupation extends Intangible {
  override readonly type = "Occupation";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Intangible>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Occupation"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Occupation {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Occupation",
  );
  export type Json = IntangibleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Occupation> {
    return propertiesFromJson(json).map(
      (properties) => new Occupation(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStatic.jsonUiSchema({ scopePrefix })],
      label: "Occupation",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Occupation"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Occupation"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Occupation)`,
          predicate: dataFactory.namedNode("http://schema.org/Occupation"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof Occupation.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Occupation> {
    return Occupation.propertiesFromRdf(parameters).map(
      (properties) => new Occupation(properties),
    );
  }

  export const rdfProperties = [...IntangibleStatic.rdfProperties];
}
export class CreativeWork extends Thing {
  override readonly type:
    | "CreativeWork"
    | "Article"
    | "CreativeWorkSeries"
    | "Episode"
    | "ImageObject"
    | "MediaObject"
    | "Message"
    | "MusicAlbum"
    | "MusicComposition"
    | "MusicRecording"
    | "RadioEpisode"
    | "RadioSeries"
    | "Report"
    | "TextObject" = "CreativeWork";
  readonly about: readonly ThingStub[];
  readonly authors: readonly AgentStub[];
  readonly datePublished: purify.Maybe<Date>;
  readonly isBasedOn: readonly rdfjs.NamedNode[];
  readonly publication: readonly PublicationEventStub[];

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly about?: readonly ThingStub[];
      readonly authors?: readonly AgentStub[];
      readonly datePublished?: Date | purify.Maybe<Date>;
      readonly isBasedOn?: readonly rdfjs.NamedNode[];
      readonly publication?: readonly PublicationEventStub[];
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
    if (typeof parameters.about === "undefined") {
      this.about = [];
    } else if (Array.isArray(parameters.about)) {
      this.about = parameters.about;
    } else {
      this.about = parameters.about as never;
    }

    if (typeof parameters.authors === "undefined") {
      this.authors = [];
    } else if (Array.isArray(parameters.authors)) {
      this.authors = parameters.authors;
    } else {
      this.authors = parameters.authors as never;
    }

    if (purify.Maybe.isMaybe(parameters.datePublished)) {
      this.datePublished = parameters.datePublished;
    } else if (
      typeof parameters.datePublished === "object" &&
      parameters.datePublished instanceof Date
    ) {
      this.datePublished = purify.Maybe.of(parameters.datePublished);
    } else if (typeof parameters.datePublished === "undefined") {
      this.datePublished = purify.Maybe.empty();
    } else {
      this.datePublished = parameters.datePublished as never;
    }

    if (typeof parameters.isBasedOn === "undefined") {
      this.isBasedOn = [];
    } else if (Array.isArray(parameters.isBasedOn)) {
      this.isBasedOn = parameters.isBasedOn;
    } else {
      this.isBasedOn = parameters.isBasedOn as never;
    }

    if (typeof parameters.publication === "undefined") {
      this.publication = [];
    } else if (Array.isArray(parameters.publication)) {
      this.publication = parameters.publication;
    } else {
      this.publication = parameters.publication as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: CreativeWork): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.about,
          other.about,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "about",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, AgentStub.equals))(
          this.authors,
          other.authors,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "authors",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.datePublished,
          other.datePublished,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "datePublished",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, $booleanEquals))(
          this.isBasedOn,
          other.isBasedOn,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "isBasedOn",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.publication,
          other.publication,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "publication",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    for (const _item0 of this.about) {
      _item0.hash(_hasher);
    }

    for (const _item0 of this.authors) {
      _item0.hash(_hasher);
    }

    this.datePublished.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    for (const _item0 of this.isBasedOn) {
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
    }

    for (const _item0 of this.publication) {
      _item0.hash(_hasher);
    }

    return _hasher;
  }

  override toJson(): CreativeWorkStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        about: this.about.map((_item) => _item.toJson()),
        authors: this.authors.map((_item) => _item.toJson()),
        datePublished: this.datePublished
          .map((_item) => _item.toISOString())
          .extract(),
        isBasedOn: this.isBasedOn.map((_item) => ({ "@id": _item.value })),
        publication: this.publication.map((_item) => _item.toJson()),
      } satisfies CreativeWorkStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/CreativeWork"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/about"),
      this.about.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/author"),
      this.authors.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/datePublished"),
      this.datePublished.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#dateTime",
          ),
        }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/isBasedOn"),
      this.isBasedOn.map((_item) => _item),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/publication"),
      this.publication.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace CreativeWorkStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/CreativeWork",
  );
  export type Json = {
    readonly about: readonly ThingStubStatic.Json[];
    readonly authors: readonly (
      | OrganizationStubStatic.Json
      | PersonStub.Json
    )[];
    readonly datePublished: string | undefined;
    readonly isBasedOn: readonly { readonly "@id": string }[];
    readonly publication: readonly PublicationEventStub.Json[];
  } & ThingStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      about: readonly ThingStub[];
      authors: readonly AgentStub[];
      datePublished: purify.Maybe<Date>;
      isBasedOn: readonly rdfjs.NamedNode[];
      publication: readonly PublicationEventStub[];
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const about = _jsonObject["about"].map((_item) =>
      ThingStubStatic.fromJson(_item).unsafeCoerce(),
    );
    const authors = _jsonObject["authors"].map((_item) =>
      AgentStub.fromJson(_item).unsafeCoerce(),
    );
    const datePublished = purify.Maybe.fromNullable(
      _jsonObject["datePublished"],
    ).map((_item) => new Date(_item));
    const isBasedOn = _jsonObject["isBasedOn"].map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    const publication = _jsonObject["publication"].map((_item) =>
      PublicationEventStub.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      about,
      authors,
      datePublished,
      isBasedOn,
      publication,
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, CreativeWork> {
    return (
      ArticleStatic.fromJson(json) as purify.Either<zod.ZodError, CreativeWork>
    )
      .altLazy(
        () =>
          CreativeWorkSeriesStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          EpisodeStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          MediaObjectStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          Message.fromJson(json) as purify.Either<zod.ZodError, CreativeWork>,
      )
      .altLazy(
        () =>
          MusicAlbum.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          MusicComposition.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          MusicRecording.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWork
          >,
      )
      .altLazy(() =>
        propertiesFromJson(json).map(
          (properties) => new CreativeWork(properties),
        ),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStatic.jsonUiSchema({ scopePrefix }),
        ThingStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/about`,
        }),
        { scope: `${scopePrefix}/properties/authors`, type: "Control" },
        { scope: `${scopePrefix}/properties/datePublished`, type: "Control" },
        { scope: `${scopePrefix}/properties/isBasedOn`, type: "Control" },
        PublicationEventStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/publication`,
        }),
      ],
      label: "CreativeWork",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "CreativeWork",
          "Article",
          "CreativeWorkSeries",
          "Episode",
          "ImageObject",
          "MediaObject",
          "Message",
          "MusicAlbum",
          "MusicComposition",
          "MusicRecording",
          "RadioEpisode",
          "RadioSeries",
          "Report",
          "TextObject",
        ]),
        about: ThingStubStatic.jsonZodSchema()
          .array()
          .default(() => []),
        authors: AgentStub.jsonZodSchema()
          .array()
          .default(() => []),
        datePublished: zod.string().datetime().optional(),
        isBasedOn: zod
          .object({ "@id": zod.string().min(1) })
          .array()
          .default(() => []),
        publication: PublicationEventStub.jsonZodSchema()
          .array()
          .default(() => []),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      about: readonly ThingStub[];
      authors: readonly AgentStub[];
      datePublished: purify.Maybe<Date>;
      isBasedOn: readonly rdfjs.NamedNode[];
      publication: readonly PublicationEventStub[];
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromRdf>>
  > {
    const _super0Either = ThingStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/CreativeWork"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/CreativeWork)`,
          predicate: dataFactory.namedNode("http://schema.org/CreativeWork"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _aboutEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly ThingStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/about"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              ThingStubStatic.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_aboutEither.isLeft()) {
      return _aboutEither;
    }

    const about = _aboutEither.unsafeCoerce();
    const _authorsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly AgentStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/author"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              AgentStub.fromRdf({
                ..._context,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_authorsEither.isLeft()) {
      return _authorsEither;
    }

    const authors = _authorsEither.unsafeCoerce();
    const _datePublishedEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/datePublished"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_datePublishedEither.isLeft()) {
      return _datePublishedEither;
    }

    const datePublished = _datePublishedEither.unsafeCoerce();
    const _isBasedOnEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly rdfjs.NamedNode[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/isBasedOn"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((_value) => _value.toIri())
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_isBasedOnEither.isLeft()) {
      return _isBasedOnEither;
    }

    const isBasedOn = _isBasedOnEither.unsafeCoerce();
    const _publicationEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly PublicationEventStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/publication"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              PublicationEventStub.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_publicationEither.isLeft()) {
      return _publicationEither;
    }

    const publication = _publicationEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      about,
      authors,
      datePublished,
      isBasedOn,
      publication,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof CreativeWorkStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, CreativeWork> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ArticleStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        CreativeWork
      >
    )
      .altLazy(
        () =>
          CreativeWorkSeriesStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          EpisodeStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          MediaObjectStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          Message.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          MusicAlbum.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          MusicComposition.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          MusicRecording.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWork
          >,
      )
      .altLazy(() =>
        CreativeWorkStatic.propertiesFromRdf(parameters).map(
          (properties) => new CreativeWork(properties),
        ),
      );
  }

  export const rdfProperties = [
    ...ThingStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/about") },
    { path: dataFactory.namedNode("http://schema.org/author") },
    { path: dataFactory.namedNode("http://schema.org/datePublished") },
    { path: dataFactory.namedNode("http://schema.org/isBasedOn") },
    { path: dataFactory.namedNode("http://schema.org/publication") },
  ];
}
export class MediaObject extends CreativeWork {
  override readonly type: "MediaObject" | "ImageObject" | "TextObject" =
    "MediaObject";
  readonly contentUrl: purify.Maybe<rdfjs.NamedNode>;
  readonly encodingFormat: purify.Maybe<string>;
  readonly height: purify.Maybe<QuantitativeValue>;
  readonly width: purify.Maybe<QuantitativeValue>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly contentUrl?:
        | rdfjs.NamedNode
        | purify.Maybe<rdfjs.NamedNode>
        | string;
      readonly encodingFormat?: purify.Maybe<string> | string;
      readonly height?: QuantitativeValue | purify.Maybe<QuantitativeValue>;
      readonly width?: QuantitativeValue | purify.Maybe<QuantitativeValue>;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.contentUrl)) {
      this.contentUrl = parameters.contentUrl;
    } else if (typeof parameters.contentUrl === "object") {
      this.contentUrl = purify.Maybe.of(parameters.contentUrl);
    } else if (typeof parameters.contentUrl === "string") {
      this.contentUrl = purify.Maybe.of(
        dataFactory.namedNode(parameters.contentUrl),
      );
    } else if (typeof parameters.contentUrl === "undefined") {
      this.contentUrl = purify.Maybe.empty();
    } else {
      this.contentUrl = parameters.contentUrl as never;
    }

    if (purify.Maybe.isMaybe(parameters.encodingFormat)) {
      this.encodingFormat = parameters.encodingFormat;
    } else if (typeof parameters.encodingFormat === "string") {
      this.encodingFormat = purify.Maybe.of(parameters.encodingFormat);
    } else if (typeof parameters.encodingFormat === "undefined") {
      this.encodingFormat = purify.Maybe.empty();
    } else {
      this.encodingFormat = parameters.encodingFormat as never;
    }

    if (purify.Maybe.isMaybe(parameters.height)) {
      this.height = parameters.height;
    } else if (
      typeof parameters.height === "object" &&
      parameters.height instanceof QuantitativeValue
    ) {
      this.height = purify.Maybe.of(parameters.height);
    } else if (typeof parameters.height === "undefined") {
      this.height = purify.Maybe.empty();
    } else {
      this.height = parameters.height as never;
    }

    if (purify.Maybe.isMaybe(parameters.width)) {
      this.width = parameters.width;
    } else if (
      typeof parameters.width === "object" &&
      parameters.width instanceof QuantitativeValue
    ) {
      this.width = purify.Maybe.of(parameters.width);
    } else if (typeof parameters.width === "undefined") {
      this.width = purify.Maybe.empty();
    } else {
      this.width = parameters.width as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: MediaObject): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $booleanEquals))(
          this.contentUrl,
          other.contentUrl,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "contentUrl",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.encodingFormat,
          other.encodingFormat,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "encodingFormat",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.height,
          other.height,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "height",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.width,
          other.width,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "width",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.contentUrl.ifJust((_value0) => {
      _hasher.update(_value0.termType);
      _hasher.update(_value0.value);
    });
    this.encodingFormat.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.height.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    this.width.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): MediaObjectStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        contentUrl: this.contentUrl
          .map((_item) => ({ "@id": _item.value }))
          .extract(),
        encodingFormat: this.encodingFormat.map((_item) => _item).extract(),
        height: this.height.map((_item) => _item.toJson()).extract(),
        width: this.width.map((_item) => _item.toJson()).extract(),
      } satisfies MediaObjectStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MediaObject"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/contentUrl"),
      this.contentUrl,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/encodingFormat"),
      this.encodingFormat,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/height"),
      this.height.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/width"),
      this.width.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MediaObjectStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MediaObject",
  );
  export type Json = {
    readonly contentUrl: { readonly "@id": string } | undefined;
    readonly encodingFormat: string | undefined;
    readonly height: QuantitativeValue.Json | undefined;
    readonly width: QuantitativeValue.Json | undefined;
  } & CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      contentUrl: purify.Maybe<rdfjs.NamedNode>;
      encodingFormat: purify.Maybe<string>;
      height: purify.Maybe<QuantitativeValue>;
      width: purify.Maybe<QuantitativeValue>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const contentUrl = purify.Maybe.fromNullable(_jsonObject["contentUrl"]).map(
      (_item) => dataFactory.namedNode(_item["@id"]),
    );
    const encodingFormat = purify.Maybe.fromNullable(
      _jsonObject["encodingFormat"],
    );
    const height = purify.Maybe.fromNullable(_jsonObject["height"]).map(
      (_item) => QuantitativeValue.fromJson(_item).unsafeCoerce(),
    );
    const width = purify.Maybe.fromNullable(_jsonObject["width"]).map((_item) =>
      QuantitativeValue.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      contentUrl,
      encodingFormat,
      height,
      width,
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MediaObject> {
    return (
      TextObject.fromJson(json) as purify.Either<zod.ZodError, MediaObject>
    )
      .altLazy(
        () =>
          ImageObject.fromJson(json) as purify.Either<
            zod.ZodError,
            MediaObject
          >,
      )
      .altLazy(() =>
        propertiesFromJson(json).map(
          (properties) => new MediaObject(properties),
        ),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/contentUrl`, type: "Control" },
        { scope: `${scopePrefix}/properties/encodingFormat`, type: "Control" },
        QuantitativeValue.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/height`,
        }),
        QuantitativeValue.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/width`,
        }),
      ],
      label: "MediaObject",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["MediaObject", "ImageObject", "TextObject"]),
        contentUrl: zod.object({ "@id": zod.string().min(1) }).optional(),
        encodingFormat: zod.string().optional(),
        height: QuantitativeValue.jsonZodSchema().optional(),
        width: QuantitativeValue.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      contentUrl: purify.Maybe<rdfjs.NamedNode>;
      encodingFormat: purify.Maybe<string>;
      height: purify.Maybe<QuantitativeValue>;
      width: purify.Maybe<QuantitativeValue>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>>
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MediaObject"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MediaObject)`,
          predicate: dataFactory.namedNode("http://schema.org/MediaObject"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _contentUrlEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<rdfjs.NamedNode>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/contentUrl"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toIri())
        .toMaybe(),
    );
    if (_contentUrlEither.isLeft()) {
      return _contentUrlEither;
    }

    const contentUrl = _contentUrlEither.unsafeCoerce();
    const _encodingFormatEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/encodingFormat"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_encodingFormatEither.isLeft()) {
      return _encodingFormatEither;
    }

    const encodingFormat = _encodingFormatEither.unsafeCoerce();
    const _heightEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<QuantitativeValue>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/height"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          QuantitativeValue.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_heightEither.isLeft()) {
      return _heightEither;
    }

    const height = _heightEither.unsafeCoerce();
    const _widthEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<QuantitativeValue>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/width"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          QuantitativeValue.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_widthEither.isLeft()) {
      return _widthEither;
    }

    const width = _widthEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      contentUrl,
      encodingFormat,
      height,
      width,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof MediaObjectStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MediaObject> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      TextObject.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        MediaObject
      >
    )
      .altLazy(
        () =>
          ImageObject.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            MediaObject
          >,
      )
      .altLazy(() =>
        MediaObjectStatic.propertiesFromRdf(parameters).map(
          (properties) => new MediaObject(properties),
        ),
      );
  }

  export const rdfProperties = [
    ...CreativeWorkStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/contentUrl") },
    { path: dataFactory.namedNode("http://schema.org/encodingFormat") },
    { path: dataFactory.namedNode("http://schema.org/height") },
    { path: dataFactory.namedNode("http://schema.org/width") },
  ];
}
export class ImageObject extends MediaObject {
  override readonly type = "ImageObject";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof MediaObject>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/ImageObject"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ImageObject {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/ImageObject",
  );
  export type Json = MediaObjectStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof MediaObjectStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = MediaObjectStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ImageObject> {
    return propertiesFromJson(json).map(
      (properties) => new ImageObject(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [MediaObjectStatic.jsonUiSchema({ scopePrefix })],
      label: "ImageObject",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return MediaObjectStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("ImageObject"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof MediaObjectStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = MediaObjectStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/ImageObject"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/ImageObject)`,
          predicate: dataFactory.namedNode("http://schema.org/ImageObject"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ImageObject.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ImageObject> {
    return ImageObject.propertiesFromRdf(parameters).map(
      (properties) => new ImageObject(properties),
    );
  }

  export const rdfProperties = [...MediaObjectStatic.rdfProperties];
}
export class Enumeration extends Intangible {
  override readonly type: "Enumeration" | "GenderType" = "Enumeration";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Intangible>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Enumeration"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace EnumerationStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Enumeration",
  );
  export type Json = IntangibleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Enumeration> {
    return (
      GenderType.fromJson(json) as purify.Either<zod.ZodError, Enumeration>
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new Enumeration(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStatic.jsonUiSchema({ scopePrefix })],
      label: "Enumeration",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["Enumeration", "GenderType"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Enumeration"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Enumeration)`,
          predicate: dataFactory.namedNode("http://schema.org/Enumeration"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof EnumerationStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Enumeration> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      GenderType.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Enumeration
      >
    ).altLazy(() =>
      EnumerationStatic.propertiesFromRdf(parameters).map(
        (properties) => new Enumeration(properties),
      ),
    );
  }

  export const rdfProperties = [...IntangibleStatic.rdfProperties];
}
export class GenderType extends Enumeration {
  override readonly type = "GenderType";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier:
        | "http://schema.org/Female"
        | "http://schema.org/Male"
        | rdfjs.NamedNode<
            "http://schema.org/Female" | "http://schema.org/Male"
          >;
    } & ConstructorParameters<typeof Enumeration>[0],
  ) {
    super(parameters);
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/GenderType"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace GenderType {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/GenderType",
  );
  export type Json = EnumerationStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.NamedNode<
        "http://schema.org/Female" | "http://schema.org/Male"
      >;
    } & $UnwrapR<ReturnType<typeof EnumerationStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = EnumerationStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, GenderType> {
    return propertiesFromJson(json).map(
      (properties) => new GenderType(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [EnumerationStatic.jsonUiSchema({ scopePrefix })],
      label: "GenderType",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return EnumerationStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.enum(["http://schema.org/Female", "http://schema.org/Male"]),
        type: zod.literal("GenderType"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.NamedNode<
        "http://schema.org/Female" | "http://schema.org/Male"
      >;
    } & $UnwrapR<ReturnType<typeof EnumerationStatic.propertiesFromRdf>>
  > {
    const _super0Either = EnumerationStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/GenderType"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/GenderType)`,
          predicate: dataFactory.namedNode("http://schema.org/GenderType"),
        }),
      );
    }

    let identifier: rdfjs.NamedNode<
      "http://schema.org/Female" | "http://schema.org/Male"
    >;
    switch (_resource.identifier.value) {
      case "http://schema.org/Female":
        identifier = dataFactory.namedNode("http://schema.org/Female");
        break;
      case "http://schema.org/Male":
        identifier = dataFactory.namedNode("http://schema.org/Male");
        break;
      default:
        return purify.Left(
          new rdfjsResource.Resource.MistypedValueError({
            actualValue: _resource.identifier,
            expectedValueType:
              'rdfjs.NamedNode<"http://schema.org/Female" | "http://schema.org/Male">',
            focusResource: _resource,
            predicate: dataFactory.namedNode(
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#subject",
            ),
          }),
        );
    }

    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof GenderType.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, GenderType> {
    return GenderType.propertiesFromRdf(parameters).map(
      (properties) => new GenderType(properties),
    );
  }

  export const rdfProperties = [...EnumerationStatic.rdfProperties];
}
export class Event extends Thing {
  override readonly type: "Event" | "BroadcastEvent" | "PublicationEvent" =
    "Event";
  readonly about: readonly ThingStub[];
  readonly endDate: purify.Maybe<Date>;
  readonly location: purify.Maybe<PlaceStub>;
  readonly organizers: readonly AgentStub[];
  readonly performers: readonly AgentStub[];
  readonly startDate: purify.Maybe<Date>;
  subEvents: EventStub[];
  superEvent: purify.Maybe<EventStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly about?: readonly ThingStub[];
      readonly endDate?: Date | purify.Maybe<Date>;
      readonly location?: PlaceStub | purify.Maybe<PlaceStub>;
      readonly organizers?: readonly AgentStub[];
      readonly performers?: readonly AgentStub[];
      readonly startDate?: Date | purify.Maybe<Date>;
      readonly subEvents?: readonly EventStub[];
      readonly superEvent?: EventStub | purify.Maybe<EventStub>;
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
    if (typeof parameters.about === "undefined") {
      this.about = [];
    } else if (Array.isArray(parameters.about)) {
      this.about = parameters.about;
    } else {
      this.about = parameters.about as never;
    }

    if (purify.Maybe.isMaybe(parameters.endDate)) {
      this.endDate = parameters.endDate;
    } else if (
      typeof parameters.endDate === "object" &&
      parameters.endDate instanceof Date
    ) {
      this.endDate = purify.Maybe.of(parameters.endDate);
    } else if (typeof parameters.endDate === "undefined") {
      this.endDate = purify.Maybe.empty();
    } else {
      this.endDate = parameters.endDate as never;
    }

    if (purify.Maybe.isMaybe(parameters.location)) {
      this.location = parameters.location;
    } else if (
      typeof parameters.location === "object" &&
      parameters.location instanceof PlaceStub
    ) {
      this.location = purify.Maybe.of(parameters.location);
    } else if (typeof parameters.location === "undefined") {
      this.location = purify.Maybe.empty();
    } else {
      this.location = parameters.location as never;
    }

    if (typeof parameters.organizers === "undefined") {
      this.organizers = [];
    } else if (Array.isArray(parameters.organizers)) {
      this.organizers = parameters.organizers;
    } else {
      this.organizers = parameters.organizers as never;
    }

    if (typeof parameters.performers === "undefined") {
      this.performers = [];
    } else if (Array.isArray(parameters.performers)) {
      this.performers = parameters.performers;
    } else {
      this.performers = parameters.performers as never;
    }

    if (purify.Maybe.isMaybe(parameters.startDate)) {
      this.startDate = parameters.startDate;
    } else if (
      typeof parameters.startDate === "object" &&
      parameters.startDate instanceof Date
    ) {
      this.startDate = purify.Maybe.of(parameters.startDate);
    } else if (typeof parameters.startDate === "undefined") {
      this.startDate = purify.Maybe.empty();
    } else {
      this.startDate = parameters.startDate as never;
    }

    if (typeof parameters.subEvents === "undefined") {
      this.subEvents = [];
    } else if (Array.isArray(parameters.subEvents)) {
      this.subEvents = parameters.subEvents;
    } else {
      this.subEvents = parameters.subEvents as never;
    }

    if (purify.Maybe.isMaybe(parameters.superEvent)) {
      this.superEvent = parameters.superEvent;
    } else if (
      typeof parameters.superEvent === "object" &&
      parameters.superEvent instanceof EventStub
    ) {
      this.superEvent = purify.Maybe.of(parameters.superEvent);
    } else if (typeof parameters.superEvent === "undefined") {
      this.superEvent = purify.Maybe.empty();
    } else {
      this.superEvent = parameters.superEvent as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Event): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.about,
          other.about,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "about",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.endDate,
          other.endDate,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "endDate",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.location,
          other.location,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "location",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, AgentStub.equals))(
          this.organizers,
          other.organizers,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "organizers",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, AgentStub.equals))(
          this.performers,
          other.performers,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "performers",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.startDate,
          other.startDate,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "startDate",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.subEvents,
          other.subEvents,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "subEvents",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.superEvent,
          other.superEvent,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "superEvent",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    for (const _item0 of this.about) {
      _item0.hash(_hasher);
    }

    this.endDate.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    this.location.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    for (const _item0 of this.organizers) {
      _item0.hash(_hasher);
    }

    for (const _item0 of this.performers) {
      _item0.hash(_hasher);
    }

    this.startDate.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    for (const _item0 of this.subEvents) {
      _item0.hash(_hasher);
    }

    this.superEvent.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): EventStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        about: this.about.map((_item) => _item.toJson()),
        endDate: this.endDate.map((_item) => _item.toISOString()).extract(),
        location: this.location.map((_item) => _item.toJson()).extract(),
        organizers: this.organizers.map((_item) => _item.toJson()),
        performers: this.performers.map((_item) => _item.toJson()),
        startDate: this.startDate.map((_item) => _item.toISOString()).extract(),
        subEvents: this.subEvents.map((_item) => _item.toJson()),
        superEvent: this.superEvent.map((_item) => _item.toJson()).extract(),
      } satisfies EventStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Event"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/about"),
      this.about.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/endDate"),
      this.endDate.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#dateTime",
          ),
        }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/location"),
      this.location.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/organizer"),
      this.organizers.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/performer"),
      this.performers.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/startDate"),
      this.startDate.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#dateTime",
          ),
        }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/subEvent"),
      this.subEvents.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/superEvent"),
      this.superEvent.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace EventStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Event",
  );
  export type Json = {
    readonly about: readonly ThingStubStatic.Json[];
    readonly endDate: string | undefined;
    readonly location: PlaceStub.Json | undefined;
    readonly organizers: readonly (
      | OrganizationStubStatic.Json
      | PersonStub.Json
    )[];
    readonly performers: readonly (
      | OrganizationStubStatic.Json
      | PersonStub.Json
    )[];
    readonly startDate: string | undefined;
    readonly subEvents: readonly EventStubStatic.Json[];
    readonly superEvent: EventStubStatic.Json | undefined;
  } & ThingStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      about: readonly ThingStub[];
      endDate: purify.Maybe<Date>;
      location: purify.Maybe<PlaceStub>;
      organizers: readonly AgentStub[];
      performers: readonly AgentStub[];
      startDate: purify.Maybe<Date>;
      subEvents: EventStub[];
      superEvent: purify.Maybe<EventStub>;
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const about = _jsonObject["about"].map((_item) =>
      ThingStubStatic.fromJson(_item).unsafeCoerce(),
    );
    const endDate = purify.Maybe.fromNullable(_jsonObject["endDate"]).map(
      (_item) => new Date(_item),
    );
    const location = purify.Maybe.fromNullable(_jsonObject["location"]).map(
      (_item) => PlaceStub.fromJson(_item).unsafeCoerce(),
    );
    const organizers = _jsonObject["organizers"].map((_item) =>
      AgentStub.fromJson(_item).unsafeCoerce(),
    );
    const performers = _jsonObject["performers"].map((_item) =>
      AgentStub.fromJson(_item).unsafeCoerce(),
    );
    const startDate = purify.Maybe.fromNullable(_jsonObject["startDate"]).map(
      (_item) => new Date(_item),
    );
    const subEvents = _jsonObject["subEvents"].map((_item) =>
      EventStubStatic.fromJson(_item).unsafeCoerce(),
    );
    const superEvent = purify.Maybe.fromNullable(_jsonObject["superEvent"]).map(
      (_item) => EventStubStatic.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      about,
      endDate,
      location,
      organizers,
      performers,
      startDate,
      subEvents,
      superEvent,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Event> {
    return (
      PublicationEventStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        Event
      >
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new Event(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStatic.jsonUiSchema({ scopePrefix }),
        ThingStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/about`,
        }),
        { scope: `${scopePrefix}/properties/endDate`, type: "Control" },
        PlaceStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/location`,
        }),
        { scope: `${scopePrefix}/properties/organizers`, type: "Control" },
        { scope: `${scopePrefix}/properties/performers`, type: "Control" },
        { scope: `${scopePrefix}/properties/startDate`, type: "Control" },
        EventStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/subEvents`,
        }),
        EventStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/superEvent`,
        }),
      ],
      label: "Event",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["Event", "BroadcastEvent", "PublicationEvent"]),
        about: ThingStubStatic.jsonZodSchema()
          .array()
          .default(() => []),
        endDate: zod.string().datetime().optional(),
        location: PlaceStub.jsonZodSchema().optional(),
        organizers: AgentStub.jsonZodSchema()
          .array()
          .default(() => []),
        performers: AgentStub.jsonZodSchema()
          .array()
          .default(() => []),
        startDate: zod.string().datetime().optional(),
        subEvents: EventStubStatic.jsonZodSchema()
          .array()
          .default(() => []),
        superEvent: EventStubStatic.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      about: readonly ThingStub[];
      endDate: purify.Maybe<Date>;
      location: purify.Maybe<PlaceStub>;
      organizers: readonly AgentStub[];
      performers: readonly AgentStub[];
      startDate: purify.Maybe<Date>;
      subEvents: EventStub[];
      superEvent: purify.Maybe<EventStub>;
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromRdf>>
  > {
    const _super0Either = ThingStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Event"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Event)`,
          predicate: dataFactory.namedNode("http://schema.org/Event"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _aboutEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly ThingStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/about"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              ThingStubStatic.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_aboutEither.isLeft()) {
      return _aboutEither;
    }

    const about = _aboutEither.unsafeCoerce();
    const _endDateEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/endDate"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_endDateEither.isLeft()) {
      return _endDateEither;
    }

    const endDate = _endDateEither.unsafeCoerce();
    const _locationEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<PlaceStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/location"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          PlaceStub.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_locationEither.isLeft()) {
      return _locationEither;
    }

    const location = _locationEither.unsafeCoerce();
    const _organizersEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly AgentStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/organizer"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              AgentStub.fromRdf({
                ..._context,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_organizersEither.isLeft()) {
      return _organizersEither;
    }

    const organizers = _organizersEither.unsafeCoerce();
    const _performersEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly AgentStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/performer"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              AgentStub.fromRdf({
                ..._context,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_performersEither.isLeft()) {
      return _performersEither;
    }

    const performers = _performersEither.unsafeCoerce();
    const _startDateEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/startDate"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_startDateEither.isLeft()) {
      return _startDateEither;
    }

    const startDate = _startDateEither.unsafeCoerce();
    const _subEventsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      EventStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/subEvent"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              EventStubStatic.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_subEventsEither.isLeft()) {
      return _subEventsEither;
    }

    const subEvents = _subEventsEither.unsafeCoerce();
    const _superEventEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<EventStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/superEvent"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          EventStubStatic.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_superEventEither.isLeft()) {
      return _superEventEither;
    }

    const superEvent = _superEventEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      about,
      endDate,
      location,
      organizers,
      performers,
      startDate,
      subEvents,
      superEvent,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof EventStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Event> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      PublicationEventStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Event
      >
    ).altLazy(() =>
      EventStatic.propertiesFromRdf(parameters).map(
        (properties) => new Event(properties),
      ),
    );
  }

  export const rdfProperties = [
    ...ThingStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/about") },
    { path: dataFactory.namedNode("http://schema.org/endDate") },
    { path: dataFactory.namedNode("http://schema.org/location") },
    { path: dataFactory.namedNode("http://schema.org/organizer") },
    { path: dataFactory.namedNode("http://schema.org/performer") },
    { path: dataFactory.namedNode("http://schema.org/startDate") },
    { path: dataFactory.namedNode("http://schema.org/subEvent") },
    { path: dataFactory.namedNode("http://schema.org/superEvent") },
  ];
}
export class PublicationEvent extends Event {
  override readonly type: "PublicationEvent" | "BroadcastEvent" =
    "PublicationEvent";
  readonly publishedOn: purify.Maybe<BroadcastServiceStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly publishedOn?:
        | BroadcastServiceStub
        | purify.Maybe<BroadcastServiceStub>;
    } & ConstructorParameters<typeof Event>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.publishedOn)) {
      this.publishedOn = parameters.publishedOn;
    } else if (
      typeof parameters.publishedOn === "object" &&
      parameters.publishedOn instanceof BroadcastServiceStub
    ) {
      this.publishedOn = purify.Maybe.of(parameters.publishedOn);
    } else if (typeof parameters.publishedOn === "undefined") {
      this.publishedOn = purify.Maybe.empty();
    } else {
      this.publishedOn = parameters.publishedOn as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: PublicationEvent): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.publishedOn,
          other.publishedOn,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "publishedOn",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.publishedOn.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): PublicationEventStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        publishedOn: this.publishedOn.map((_item) => _item.toJson()).extract(),
      } satisfies PublicationEventStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/PublicationEvent"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/publishedOn"),
      this.publishedOn.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace PublicationEventStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/PublicationEvent",
  );
  export type Json = {
    readonly publishedOn: BroadcastServiceStubStatic.Json | undefined;
  } & EventStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      publishedOn: purify.Maybe<BroadcastServiceStub>;
    } & $UnwrapR<ReturnType<typeof EventStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = EventStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const publishedOn = purify.Maybe.fromNullable(
      _jsonObject["publishedOn"],
    ).map((_item) => BroadcastServiceStubStatic.fromJson(_item).unsafeCoerce());
    return purify.Either.of({ ..._super0, identifier, publishedOn });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, PublicationEvent> {
    return (
      BroadcastEvent.fromJson(json) as purify.Either<
        zod.ZodError,
        PublicationEvent
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new PublicationEvent(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        EventStatic.jsonUiSchema({ scopePrefix }),
        BroadcastServiceStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/publishedOn`,
        }),
      ],
      label: "PublicationEvent",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return EventStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["PublicationEvent", "BroadcastEvent"]),
        publishedOn: BroadcastServiceStubStatic.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      publishedOn: purify.Maybe<BroadcastServiceStub>;
    } & $UnwrapR<ReturnType<typeof EventStatic.propertiesFromRdf>>
  > {
    const _super0Either = EventStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/PublicationEvent"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/PublicationEvent)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/PublicationEvent",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _publishedOnEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<BroadcastServiceStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/publishedOn"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          BroadcastServiceStubStatic.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_publishedOnEither.isLeft()) {
      return _publishedOnEither;
    }

    const publishedOn = _publishedOnEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, publishedOn });
  }

  export function fromRdf(
    parameters: Parameters<typeof PublicationEventStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PublicationEvent> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      BroadcastEvent.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        PublicationEvent
      >
    ).altLazy(() =>
      PublicationEventStatic.propertiesFromRdf(parameters).map(
        (properties) => new PublicationEvent(properties),
      ),
    );
  }

  export const rdfProperties = [
    ...EventStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/publishedOn") },
  ];
}
export class BroadcastEvent extends PublicationEvent {
  override readonly type = "BroadcastEvent";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof PublicationEvent>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/BroadcastEvent"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace BroadcastEvent {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/BroadcastEvent",
  );
  export type Json = PublicationEventStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof PublicationEventStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      PublicationEventStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, BroadcastEvent> {
    return propertiesFromJson(json).map(
      (properties) => new BroadcastEvent(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [PublicationEventStatic.jsonUiSchema({ scopePrefix })],
      label: "BroadcastEvent",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return PublicationEventStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("BroadcastEvent"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof PublicationEventStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = PublicationEventStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/BroadcastEvent"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/BroadcastEvent)`,
          predicate: dataFactory.namedNode("http://schema.org/BroadcastEvent"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof BroadcastEvent.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, BroadcastEvent> {
    return BroadcastEvent.propertiesFromRdf(parameters).map(
      (properties) => new BroadcastEvent(properties),
    );
  }

  export const rdfProperties = [...PublicationEventStatic.rdfProperties];
}
export class Action extends Thing {
  override readonly type:
    | "Action"
    | "AssessAction"
    | "ChooseAction"
    | "VoteAction" = "Action";
  readonly agents: readonly AgentStub[];
  readonly endTime: purify.Maybe<Date>;
  readonly participants: readonly AgentStub[];
  readonly startTime: purify.Maybe<Date>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly agents?: readonly AgentStub[];
      readonly endTime?: Date | purify.Maybe<Date>;
      readonly participants?: readonly AgentStub[];
      readonly startTime?: Date | purify.Maybe<Date>;
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
    if (typeof parameters.agents === "undefined") {
      this.agents = [];
    } else if (Array.isArray(parameters.agents)) {
      this.agents = parameters.agents;
    } else {
      this.agents = parameters.agents as never;
    }

    if (purify.Maybe.isMaybe(parameters.endTime)) {
      this.endTime = parameters.endTime;
    } else if (
      typeof parameters.endTime === "object" &&
      parameters.endTime instanceof Date
    ) {
      this.endTime = purify.Maybe.of(parameters.endTime);
    } else if (typeof parameters.endTime === "undefined") {
      this.endTime = purify.Maybe.empty();
    } else {
      this.endTime = parameters.endTime as never;
    }

    if (typeof parameters.participants === "undefined") {
      this.participants = [];
    } else if (Array.isArray(parameters.participants)) {
      this.participants = parameters.participants;
    } else {
      this.participants = parameters.participants as never;
    }

    if (purify.Maybe.isMaybe(parameters.startTime)) {
      this.startTime = parameters.startTime;
    } else if (
      typeof parameters.startTime === "object" &&
      parameters.startTime instanceof Date
    ) {
      this.startTime = purify.Maybe.of(parameters.startTime);
    } else if (typeof parameters.startTime === "undefined") {
      this.startTime = purify.Maybe.empty();
    } else {
      this.startTime = parameters.startTime as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Action): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, AgentStub.equals))(
          this.agents,
          other.agents,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "agents",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.endTime,
          other.endTime,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "endTime",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, AgentStub.equals))(
          this.participants,
          other.participants,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "participants",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.startTime,
          other.startTime,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "startTime",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    for (const _item0 of this.agents) {
      _item0.hash(_hasher);
    }

    this.endTime.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    for (const _item0 of this.participants) {
      _item0.hash(_hasher);
    }

    this.startTime.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    return _hasher;
  }

  override toJson(): ActionStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        agents: this.agents.map((_item) => _item.toJson()),
        endTime: this.endTime.map((_item) => _item.toISOString()).extract(),
        participants: this.participants.map((_item) => _item.toJson()),
        startTime: this.startTime.map((_item) => _item.toISOString()).extract(),
      } satisfies ActionStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Action"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/agent"),
      this.agents.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/endTime"),
      this.endTime.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#dateTime",
          ),
        }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/participant"),
      this.participants.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/startTime"),
      this.startTime.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#dateTime",
          ),
        }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ActionStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Action",
  );
  export type Json = {
    readonly agents: readonly (OrganizationStubStatic.Json | PersonStub.Json)[];
    readonly endTime: string | undefined;
    readonly participants: readonly (
      | OrganizationStubStatic.Json
      | PersonStub.Json
    )[];
    readonly startTime: string | undefined;
  } & ThingStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      agents: readonly AgentStub[];
      endTime: purify.Maybe<Date>;
      participants: readonly AgentStub[];
      startTime: purify.Maybe<Date>;
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const agents = _jsonObject["agents"].map((_item) =>
      AgentStub.fromJson(_item).unsafeCoerce(),
    );
    const endTime = purify.Maybe.fromNullable(_jsonObject["endTime"]).map(
      (_item) => new Date(_item),
    );
    const participants = _jsonObject["participants"].map((_item) =>
      AgentStub.fromJson(_item).unsafeCoerce(),
    );
    const startTime = purify.Maybe.fromNullable(_jsonObject["startTime"]).map(
      (_item) => new Date(_item),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      agents,
      endTime,
      participants,
      startTime,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Action> {
    return (
      AssessActionStatic.fromJson(json) as purify.Either<zod.ZodError, Action>
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new Action(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/agents`, type: "Control" },
        { scope: `${scopePrefix}/properties/endTime`, type: "Control" },
        { scope: `${scopePrefix}/properties/participants`, type: "Control" },
        { scope: `${scopePrefix}/properties/startTime`, type: "Control" },
      ],
      label: "Action",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "Action",
          "AssessAction",
          "ChooseAction",
          "VoteAction",
        ]),
        agents: AgentStub.jsonZodSchema()
          .array()
          .default(() => []),
        endTime: zod.string().datetime().optional(),
        participants: AgentStub.jsonZodSchema()
          .array()
          .default(() => []),
        startTime: zod.string().datetime().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      agents: readonly AgentStub[];
      endTime: purify.Maybe<Date>;
      participants: readonly AgentStub[];
      startTime: purify.Maybe<Date>;
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromRdf>>
  > {
    const _super0Either = ThingStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Action"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Action)`,
          predicate: dataFactory.namedNode("http://schema.org/Action"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _agentsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly AgentStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/agent"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              AgentStub.fromRdf({
                ..._context,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_agentsEither.isLeft()) {
      return _agentsEither;
    }

    const agents = _agentsEither.unsafeCoerce();
    const _endTimeEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/endTime"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_endTimeEither.isLeft()) {
      return _endTimeEither;
    }

    const endTime = _endTimeEither.unsafeCoerce();
    const _participantsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly AgentStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/participant"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              AgentStub.fromRdf({
                ..._context,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_participantsEither.isLeft()) {
      return _participantsEither;
    }

    const participants = _participantsEither.unsafeCoerce();
    const _startTimeEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/startTime"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_startTimeEither.isLeft()) {
      return _startTimeEither;
    }

    const startTime = _startTimeEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      agents,
      endTime,
      participants,
      startTime,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof ActionStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Action> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      AssessActionStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Action
      >
    ).altLazy(() =>
      ActionStatic.propertiesFromRdf(parameters).map(
        (properties) => new Action(properties),
      ),
    );
  }

  export const rdfProperties = [
    ...ThingStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/agent") },
    { path: dataFactory.namedNode("http://schema.org/endTime") },
    { path: dataFactory.namedNode("http://schema.org/participant") },
    { path: dataFactory.namedNode("http://schema.org/startTime") },
  ];
}
export class AssessAction extends Action {
  override readonly type: "AssessAction" | "ChooseAction" | "VoteAction" =
    "AssessAction";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Action>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/AssessAction"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace AssessActionStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/AssessAction",
  );
  export type Json = ActionStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ActionStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ActionStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, AssessAction> {
    return (
      ChooseActionStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        AssessAction
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new AssessAction(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ActionStatic.jsonUiSchema({ scopePrefix })],
      label: "AssessAction",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ActionStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["AssessAction", "ChooseAction", "VoteAction"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ActionStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ActionStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/AssessAction"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/AssessAction)`,
          predicate: dataFactory.namedNode("http://schema.org/AssessAction"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof AssessActionStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, AssessAction> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ChooseActionStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        AssessAction
      >
    ).altLazy(() =>
      AssessActionStatic.propertiesFromRdf(parameters).map(
        (properties) => new AssessAction(properties),
      ),
    );
  }

  export const rdfProperties = [...ActionStatic.rdfProperties];
}
export class ChooseAction extends AssessAction {
  override readonly type: "ChooseAction" | "VoteAction" = "ChooseAction";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof AssessAction>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/ChooseAction"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ChooseActionStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/ChooseAction",
  );
  export type Json = AssessActionStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof AssessActionStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = AssessActionStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ChooseAction> {
    return (
      VoteAction.fromJson(json) as purify.Either<zod.ZodError, ChooseAction>
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new ChooseAction(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [AssessActionStatic.jsonUiSchema({ scopePrefix })],
      label: "ChooseAction",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return AssessActionStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["ChooseAction", "VoteAction"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof AssessActionStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = AssessActionStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/ChooseAction"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/ChooseAction)`,
          predicate: dataFactory.namedNode("http://schema.org/ChooseAction"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ChooseActionStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ChooseAction> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      VoteAction.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ChooseAction
      >
    ).altLazy(() =>
      ChooseActionStatic.propertiesFromRdf(parameters).map(
        (properties) => new ChooseAction(properties),
      ),
    );
  }

  export const rdfProperties = [...AssessActionStatic.rdfProperties];
}
export class VoteAction extends ChooseAction {
  override readonly type = "VoteAction";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ChooseAction>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/VoteAction"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace VoteAction {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/VoteAction",
  );
  export type Json = ChooseActionStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ChooseActionStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ChooseActionStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, VoteAction> {
    return propertiesFromJson(json).map(
      (properties) => new VoteAction(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ChooseActionStatic.jsonUiSchema({ scopePrefix })],
      label: "VoteAction",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ChooseActionStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("VoteAction"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ChooseActionStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ChooseActionStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/VoteAction"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/VoteAction)`,
          predicate: dataFactory.namedNode("http://schema.org/VoteAction"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof VoteAction.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, VoteAction> {
    return VoteAction.propertiesFromRdf(parameters).map(
      (properties) => new VoteAction(properties),
    );
  }

  export const rdfProperties = [...ChooseActionStatic.rdfProperties];
}
export class ThingStub extends Model {
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type:
    | "ThingStub"
    | "ActionStub"
    | "ArticleStub"
    | "AssessActionStub"
    | "BroadcastServiceStub"
    | "ChooseActionStub"
    | "CreativeWorkSeriesStub"
    | "CreativeWorkStub"
    | "EpisodeStub"
    | "EventStub"
    | "IntangibleStub"
    | "InvoiceStub"
    | "MediaObjectStub"
    | "MessageStub"
    | "MonetaryAmountStub"
    | "MusicAlbumStub"
    | "MusicCompositionStub"
    | "MusicGroupStub"
    | "MusicRecordingStub"
    | "OrderStub"
    | "OrganizationStub"
    | "PerformingGroupStub"
    | "PersonStub"
    | "PlaceStub"
    | "PublicationEventStub"
    | "QuantitativeValueStub"
    | "RadioBroadcastServiceStub"
    | "RadioEpisodeStub"
    | "RadioSeriesStub"
    | "ReportStub"
    | "ServiceStub"
    | "StructuredValueStub"
    | "TextObjectStub"
    | "VoteActionStub" = "ThingStub";
  readonly name: purify.Maybe<string>;
  readonly order: purify.Maybe<number>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly name?: purify.Maybe<string> | string;
      readonly order?: number | purify.Maybe<number>;
    } & ConstructorParameters<typeof Model>[0],
  ) {
    super(parameters);
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

    if (purify.Maybe.isMaybe(parameters.name)) {
      this.name = parameters.name;
    } else if (typeof parameters.name === "string") {
      this.name = purify.Maybe.of(parameters.name);
    } else if (typeof parameters.name === "undefined") {
      this.name = purify.Maybe.empty();
    } else {
      this.name = parameters.name as never;
    }

    if (purify.Maybe.isMaybe(parameters.order)) {
      this.order = parameters.order;
    } else if (typeof parameters.order === "number") {
      this.order = purify.Maybe.of(parameters.order);
    } else if (typeof parameters.order === "undefined") {
      this.order = purify.Maybe.empty();
    } else {
      this.order = parameters.order as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: ThingStub): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.name,
          other.name,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "name",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.order,
          other.order,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "order",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.name.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.order.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    return _hasher;
  }

  override toJson(): ThingStubStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        name: this.name.map((_item) => _item).extract(),
        order: this.order.map((_item) => _item).extract(),
      } satisfies ThingStubStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Thing"),
      );
    }

    _resource.add(dataFactory.namedNode("http://schema.org/name"), this.name);
    _resource.add(
      dataFactory.namedNode("http://www.w3.org/ns/shacl#order"),
      this.order,
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ThingStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Thing",
  );
  export type Json = {
    readonly name: string | undefined;
    readonly order: number | undefined;
  } & ModelStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      name: purify.Maybe<string>;
      order: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof ModelStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ModelStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const name = purify.Maybe.fromNullable(_jsonObject["name"]);
    const order = purify.Maybe.fromNullable(_jsonObject["order"]);
    return purify.Either.of({ ..._super0, identifier, name, order });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ThingStub> {
    return (
      ActionStubStatic.fromJson(json) as purify.Either<zod.ZodError, ThingStub>
    )
      .altLazy(
        () =>
          OrganizationStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          PersonStub.fromJson(json) as purify.Either<zod.ZodError, ThingStub>,
      )
      .altLazy(
        () =>
          CreativeWorkStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          EventStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          IntangibleStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          PlaceStub.fromJson(json) as purify.Either<zod.ZodError, ThingStub>,
      )
      .altLazy(() =>
        propertiesFromJson(json).map((properties) => new ThingStub(properties)),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ModelStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/name`, type: "Control" },
        { scope: `${scopePrefix}/properties/order`, type: "Control" },
      ],
      label: "ThingStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ModelStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "ThingStub",
          "ActionStub",
          "ArticleStub",
          "AssessActionStub",
          "BroadcastServiceStub",
          "ChooseActionStub",
          "CreativeWorkSeriesStub",
          "CreativeWorkStub",
          "EpisodeStub",
          "EventStub",
          "IntangibleStub",
          "InvoiceStub",
          "MediaObjectStub",
          "MessageStub",
          "MonetaryAmountStub",
          "MusicAlbumStub",
          "MusicCompositionStub",
          "MusicGroupStub",
          "MusicRecordingStub",
          "OrderStub",
          "OrganizationStub",
          "PerformingGroupStub",
          "PersonStub",
          "PlaceStub",
          "PublicationEventStub",
          "QuantitativeValueStub",
          "RadioBroadcastServiceStub",
          "RadioEpisodeStub",
          "RadioSeriesStub",
          "ReportStub",
          "ServiceStub",
          "StructuredValueStub",
          "TextObjectStub",
          "VoteActionStub",
        ]),
        name: zod.string().optional(),
        order: zod.number().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      name: purify.Maybe<string>;
      order: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof ModelStatic.propertiesFromRdf>>
  > {
    const _super0Either = ModelStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Thing"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Thing)`,
          predicate: dataFactory.namedNode("http://schema.org/Thing"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _nameEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/name"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_nameEither.isLeft()) {
      return _nameEither;
    }

    const name = _nameEither.unsafeCoerce();
    const _orderEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<number>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://www.w3.org/ns/shacl#order"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toNumber())
        .toMaybe(),
    );
    if (_orderEither.isLeft()) {
      return _orderEither;
    }

    const order = _orderEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, name, order });
  }

  export function fromRdf(
    parameters: Parameters<typeof ThingStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ThingStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ActionStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ThingStub
      >
    )
      .altLazy(
        () =>
          OrganizationStubStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          PersonStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          CreativeWorkStubStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          EventStubStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          IntangibleStubStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          PlaceStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(() =>
        ThingStubStatic.propertiesFromRdf(parameters).map(
          (properties) => new ThingStub(properties),
        ),
      );
  }

  export const rdfProperties = [
    ...ModelStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/name") },
    { path: dataFactory.namedNode("http://www.w3.org/ns/shacl#order") },
  ];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        ThingStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ThingStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      ThingStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("thingStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "thingStub");
    return [
      ...ModelStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
      {
        object: dataFactory.variable!(`${variablePrefix}Name`),
        predicate: dataFactory.namedNode("http://schema.org/name"),
        subject,
      },
      {
        object: dataFactory.variable!(`${variablePrefix}Order`),
        predicate: dataFactory.namedNode("http://www.w3.org/ns/shacl#order"),
        subject,
      },
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("thingStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "thingStub");
    return [
      ...ModelStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Thing"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}Name`),
                predicate: dataFactory.namedNode("http://schema.org/name"),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}Order`),
                predicate: dataFactory.namedNode(
                  "http://www.w3.org/ns/shacl#order",
                ),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
    ];
  }
}
export class ActionStub extends ThingStub {
  override readonly type:
    | "ActionStub"
    | "AssessActionStub"
    | "ChooseActionStub"
    | "VoteActionStub" = "ActionStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Action"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ActionStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Action",
  );
  export type Json = ThingStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ActionStub> {
    return (
      AssessActionStubStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        ActionStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new ActionStub(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStubStatic.jsonUiSchema({ scopePrefix })],
      label: "ActionStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "ActionStub",
          "AssessActionStub",
          "ChooseActionStub",
          "VoteActionStub",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Action"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Action)`,
          predicate: dataFactory.namedNode("http://schema.org/Action"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ActionStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ActionStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      AssessActionStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ActionStub
      >
    ).altLazy(() =>
      ActionStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new ActionStub(properties),
      ),
    );
  }

  export const rdfProperties = [...ThingStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        ActionStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ActionStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      ActionStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("actionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "actionStub");
    return [
      ...ThingStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("actionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "actionStub");
    return [
      ...ThingStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Action"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class AssessActionStub extends ActionStub {
  override readonly type:
    | "AssessActionStub"
    | "ChooseActionStub"
    | "VoteActionStub" = "AssessActionStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ActionStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/AssessAction"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace AssessActionStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/AssessAction",
  );
  export type Json = ActionStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ActionStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ActionStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, AssessActionStub> {
    return (
      ChooseActionStubStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        AssessActionStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new AssessActionStub(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ActionStubStatic.jsonUiSchema({ scopePrefix })],
      label: "AssessActionStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ActionStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "AssessActionStub",
          "ChooseActionStub",
          "VoteActionStub",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ActionStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ActionStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/AssessAction"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/AssessAction)`,
          predicate: dataFactory.namedNode("http://schema.org/AssessAction"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof AssessActionStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, AssessActionStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ChooseActionStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        AssessActionStub
      >
    ).altLazy(() =>
      AssessActionStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new AssessActionStub(properties),
      ),
    );
  }

  export const rdfProperties = [...ActionStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        AssessActionStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        AssessActionStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      AssessActionStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("assessActionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "assessActionStub");
    return [
      ...ActionStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("assessActionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "assessActionStub");
    return [
      ...ActionStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/AssessAction",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class ChooseActionStub extends AssessActionStub {
  override readonly type: "ChooseActionStub" | "VoteActionStub" =
    "ChooseActionStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof AssessActionStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/ChooseAction"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ChooseActionStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/ChooseAction",
  );
  export type Json = AssessActionStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof AssessActionStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      AssessActionStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ChooseActionStub> {
    return (
      VoteActionStub.fromJson(json) as purify.Either<
        zod.ZodError,
        ChooseActionStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new ChooseActionStub(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [AssessActionStubStatic.jsonUiSchema({ scopePrefix })],
      label: "ChooseActionStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return AssessActionStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["ChooseActionStub", "VoteActionStub"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof AssessActionStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = AssessActionStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/ChooseAction"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/ChooseAction)`,
          predicate: dataFactory.namedNode("http://schema.org/ChooseAction"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ChooseActionStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ChooseActionStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      VoteActionStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ChooseActionStub
      >
    ).altLazy(() =>
      ChooseActionStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new ChooseActionStub(properties),
      ),
    );
  }

  export const rdfProperties = [...AssessActionStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        ChooseActionStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ChooseActionStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      ChooseActionStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("chooseActionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "chooseActionStub");
    return [
      ...AssessActionStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("chooseActionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "chooseActionStub");
    return [
      ...AssessActionStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/ChooseAction",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class VoteActionStub extends ChooseActionStub {
  override readonly type = "VoteActionStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ChooseActionStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/VoteAction"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace VoteActionStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/VoteAction",
  );
  export type Json = ChooseActionStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ChooseActionStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      ChooseActionStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, VoteActionStub> {
    return propertiesFromJson(json).map(
      (properties) => new VoteActionStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ChooseActionStubStatic.jsonUiSchema({ scopePrefix })],
      label: "VoteActionStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ChooseActionStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("VoteActionStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ChooseActionStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ChooseActionStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/VoteAction"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/VoteAction)`,
          predicate: dataFactory.namedNode("http://schema.org/VoteAction"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof VoteActionStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, VoteActionStub> {
    return VoteActionStub.propertiesFromRdf(parameters).map(
      (properties) => new VoteActionStub(properties),
    );
  }

  export const rdfProperties = [...ChooseActionStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        VoteActionStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        VoteActionStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      VoteActionStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("voteActionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "voteActionStub");
    return [
      ...ChooseActionStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("voteActionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "voteActionStub");
    return [
      ...ChooseActionStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/VoteAction"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class TextObject extends MediaObject {
  override readonly type = "TextObject";
  readonly uriSpace: purify.Maybe<string>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly uriSpace?: purify.Maybe<string> | string;
    } & ConstructorParameters<typeof MediaObject>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.uriSpace)) {
      this.uriSpace = parameters.uriSpace;
    } else if (typeof parameters.uriSpace === "string") {
      this.uriSpace = purify.Maybe.of(parameters.uriSpace);
    } else if (typeof parameters.uriSpace === "undefined") {
      this.uriSpace = purify.Maybe.empty();
    } else {
      this.uriSpace = parameters.uriSpace as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: TextObject): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.uriSpace,
          other.uriSpace,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "uriSpace",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.uriSpace.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    return _hasher;
  }

  override toJson(): TextObject.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        uriSpace: this.uriSpace.map((_item) => _item).extract(),
      } satisfies TextObject.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/TextObject"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://rdfs.org/ns/void#uriSpace"),
      this.uriSpace,
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace TextObject {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/TextObject",
  );
  export type Json = {
    readonly uriSpace: string | undefined;
  } & MediaObjectStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      uriSpace: purify.Maybe<string>;
    } & $UnwrapR<ReturnType<typeof MediaObjectStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = MediaObjectStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const uriSpace = purify.Maybe.fromNullable(_jsonObject["uriSpace"]);
    return purify.Either.of({ ..._super0, identifier, uriSpace });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, TextObject> {
    return propertiesFromJson(json).map(
      (properties) => new TextObject(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        MediaObjectStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/uriSpace`, type: "Control" },
      ],
      label: "TextObject",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return MediaObjectStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("TextObject"),
        uriSpace: zod.string().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      uriSpace: purify.Maybe<string>;
    } & $UnwrapR<ReturnType<typeof MediaObjectStatic.propertiesFromRdf>>
  > {
    const _super0Either = MediaObjectStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/TextObject"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/TextObject)`,
          predicate: dataFactory.namedNode("http://schema.org/TextObject"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _uriSpaceEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://rdfs.org/ns/void#uriSpace"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_uriSpaceEither.isLeft()) {
      return _uriSpaceEither;
    }

    const uriSpace = _uriSpaceEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, uriSpace });
  }

  export function fromRdf(
    parameters: Parameters<typeof TextObject.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, TextObject> {
    return TextObject.propertiesFromRdf(parameters).map(
      (properties) => new TextObject(properties),
    );
  }

  export const rdfProperties = [
    ...MediaObjectStatic.rdfProperties,
    { path: dataFactory.namedNode("http://rdfs.org/ns/void#uriSpace") },
  ];
}
export class CreativeWorkStub extends ThingStub {
  override readonly type:
    | "CreativeWorkStub"
    | "ArticleStub"
    | "CreativeWorkSeriesStub"
    | "EpisodeStub"
    | "MediaObjectStub"
    | "MessageStub"
    | "MusicAlbumStub"
    | "MusicCompositionStub"
    | "MusicRecordingStub"
    | "RadioEpisodeStub"
    | "RadioSeriesStub"
    | "ReportStub"
    | "TextObjectStub" = "CreativeWorkStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/CreativeWork"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace CreativeWorkStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/CreativeWork",
  );
  export type Json = ThingStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, CreativeWorkStub> {
    return (
      ArticleStubStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        CreativeWorkStub
      >
    )
      .altLazy(
        () =>
          CreativeWorkSeriesStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          EpisodeStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MediaObjectStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MessageStub.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MusicAlbumStub.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MusicCompositionStub.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MusicRecordingStub.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWorkStub
          >,
      )
      .altLazy(() =>
        propertiesFromJson(json).map(
          (properties) => new CreativeWorkStub(properties),
        ),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStubStatic.jsonUiSchema({ scopePrefix })],
      label: "CreativeWorkStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "CreativeWorkStub",
          "ArticleStub",
          "CreativeWorkSeriesStub",
          "EpisodeStub",
          "MediaObjectStub",
          "MessageStub",
          "MusicAlbumStub",
          "MusicCompositionStub",
          "MusicRecordingStub",
          "RadioEpisodeStub",
          "RadioSeriesStub",
          "ReportStub",
          "TextObjectStub",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/CreativeWork"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/CreativeWork)`,
          predicate: dataFactory.namedNode("http://schema.org/CreativeWork"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof CreativeWorkStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, CreativeWorkStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ArticleStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        CreativeWorkStub
      >
    )
      .altLazy(
        () =>
          CreativeWorkSeriesStubStatic.fromRdf(
            otherParameters,
          ) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          EpisodeStubStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MediaObjectStubStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MessageStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MusicAlbumStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MusicCompositionStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWorkStub
          >,
      )
      .altLazy(
        () =>
          MusicRecordingStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            CreativeWorkStub
          >,
      )
      .altLazy(() =>
        CreativeWorkStubStatic.propertiesFromRdf(parameters).map(
          (properties) => new CreativeWorkStub(properties),
        ),
      );
  }

  export const rdfProperties = [...ThingStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        CreativeWorkStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        CreativeWorkStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      CreativeWorkStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("creativeWorkStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "creativeWorkStub");
    return [
      ...ThingStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("creativeWorkStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "creativeWorkStub");
    return [
      ...ThingStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/CreativeWork",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class MediaObjectStub extends CreativeWorkStub {
  override readonly type: "MediaObjectStub" | "TextObjectStub" =
    "MediaObjectStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MediaObject"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MediaObjectStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MediaObject",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MediaObjectStub> {
    return (
      TextObjectStub.fromJson(json) as purify.Either<
        zod.ZodError,
        MediaObjectStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new MediaObjectStub(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "MediaObjectStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["MediaObjectStub", "TextObjectStub"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MediaObject"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MediaObject)`,
          predicate: dataFactory.namedNode("http://schema.org/MediaObject"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MediaObjectStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MediaObjectStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      TextObjectStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        MediaObjectStub
      >
    ).altLazy(() =>
      MediaObjectStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new MediaObjectStub(properties),
      ),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        MediaObjectStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MediaObjectStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      MediaObjectStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("mediaObjectStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "mediaObjectStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("mediaObjectStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "mediaObjectStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/MediaObject",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class TextObjectStub extends MediaObjectStub {
  override readonly type = "TextObjectStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof MediaObjectStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/TextObject"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace TextObjectStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/TextObject",
  );
  export type Json = MediaObjectStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof MediaObjectStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = MediaObjectStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, TextObjectStub> {
    return propertiesFromJson(json).map(
      (properties) => new TextObjectStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [MediaObjectStubStatic.jsonUiSchema({ scopePrefix })],
      label: "TextObjectStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return MediaObjectStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("TextObjectStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof MediaObjectStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = MediaObjectStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/TextObject"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/TextObject)`,
          predicate: dataFactory.namedNode("http://schema.org/TextObject"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof TextObjectStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, TextObjectStub> {
    return TextObjectStub.propertiesFromRdf(parameters).map(
      (properties) => new TextObjectStub(properties),
    );
  }

  export const rdfProperties = [...MediaObjectStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        TextObjectStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        TextObjectStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      TextObjectStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("textObjectStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "textObjectStub");
    return [
      ...MediaObjectStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("textObjectStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "textObjectStub");
    return [
      ...MediaObjectStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/TextObject"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class StructuredValue extends Intangible {
  override readonly type:
    | "StructuredValue"
    | "MonetaryAmount"
    | "QuantitativeValue" = "StructuredValue";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Intangible>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/StructuredValue"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace StructuredValueStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/StructuredValue",
  );
  export type Json = IntangibleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, StructuredValue> {
    return (
      MonetaryAmount.fromJson(json) as purify.Either<
        zod.ZodError,
        StructuredValue
      >
    )
      .altLazy(
        () =>
          QuantitativeValue.fromJson(json) as purify.Either<
            zod.ZodError,
            StructuredValue
          >,
      )
      .altLazy(() =>
        propertiesFromJson(json).map(
          (properties) => new StructuredValue(properties),
        ),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStatic.jsonUiSchema({ scopePrefix })],
      label: "StructuredValue",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "StructuredValue",
          "MonetaryAmount",
          "QuantitativeValue",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/StructuredValue"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/StructuredValue)`,
          predicate: dataFactory.namedNode("http://schema.org/StructuredValue"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof StructuredValueStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, StructuredValue> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      MonetaryAmount.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        StructuredValue
      >
    )
      .altLazy(
        () =>
          QuantitativeValue.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            StructuredValue
          >,
      )
      .altLazy(() =>
        StructuredValueStatic.propertiesFromRdf(parameters).map(
          (properties) => new StructuredValue(properties),
        ),
      );
  }

  export const rdfProperties = [...IntangibleStatic.rdfProperties];
}
export class Service extends Intangible {
  override readonly type:
    | "Service"
    | "BroadcastService"
    | "RadioBroadcastService" = "Service";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Intangible>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Service"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ServiceStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Service",
  );
  export type Json = IntangibleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Service> {
    return (
      BroadcastServiceStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        Service
      >
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new Service(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStatic.jsonUiSchema({ scopePrefix })],
      label: "Service",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "Service",
          "BroadcastService",
          "RadioBroadcastService",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Service"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Service)`,
          predicate: dataFactory.namedNode("http://schema.org/Service"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ServiceStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Service> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      BroadcastServiceStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Service
      >
    ).altLazy(() =>
      ServiceStatic.propertiesFromRdf(parameters).map(
        (properties) => new Service(properties),
      ),
    );
  }

  export const rdfProperties = [...IntangibleStatic.rdfProperties];
}
export class Article extends CreativeWork {
  override readonly type: "Article" | "Report" = "Article";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Article"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ArticleStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Article",
  );
  export type Json = CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Article> {
    return (
      Report.fromJson(json) as purify.Either<zod.ZodError, Article>
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new Article(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStatic.jsonUiSchema({ scopePrefix })],
      label: "Article",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["Article", "Report"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Article"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Article)`,
          predicate: dataFactory.namedNode("http://schema.org/Article"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ArticleStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Article> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      Report.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Article
      >
    ).altLazy(() =>
      ArticleStatic.propertiesFromRdf(parameters).map(
        (properties) => new Article(properties),
      ),
    );
  }

  export const rdfProperties = [...CreativeWorkStatic.rdfProperties];
}
export class Report extends Article {
  override readonly type = "Report";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Article>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Report"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Report {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Report",
  );
  export type Json = ArticleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ArticleStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ArticleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Report> {
    return propertiesFromJson(json).map((properties) => new Report(properties));
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ArticleStatic.jsonUiSchema({ scopePrefix })],
      label: "Report",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ArticleStatic.jsonZodSchema().merge(
      zod.object({ "@id": zod.string().min(1), type: zod.literal("Report") }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ArticleStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ArticleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Report"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Report)`,
          predicate: dataFactory.namedNode("http://schema.org/Report"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof Report.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Report> {
    return Report.propertiesFromRdf(parameters).map(
      (properties) => new Report(properties),
    );
  }

  export const rdfProperties = [...ArticleStatic.rdfProperties];
}
export class ArticleStub extends CreativeWorkStub {
  override readonly type: "ArticleStub" | "ReportStub" = "ArticleStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Article"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ArticleStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Article",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ArticleStub> {
    return (
      ReportStub.fromJson(json) as purify.Either<zod.ZodError, ArticleStub>
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new ArticleStub(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "ArticleStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["ArticleStub", "ReportStub"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Article"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Article)`,
          predicate: dataFactory.namedNode("http://schema.org/Article"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ArticleStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ArticleStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ReportStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ArticleStub
      >
    ).altLazy(() =>
      ArticleStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new ArticleStub(properties),
      ),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        ArticleStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ArticleStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      ArticleStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("articleStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "articleStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("articleStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "articleStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Article"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class ReportStub extends ArticleStub {
  override readonly type = "ReportStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ArticleStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Report"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ReportStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Report",
  );
  export type Json = ArticleStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ArticleStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ArticleStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ReportStub> {
    return propertiesFromJson(json).map(
      (properties) => new ReportStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ArticleStubStatic.jsonUiSchema({ scopePrefix })],
      label: "ReportStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ArticleStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("ReportStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ArticleStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ArticleStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Report"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Report)`,
          predicate: dataFactory.namedNode("http://schema.org/Report"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ReportStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ReportStub> {
    return ReportStub.propertiesFromRdf(parameters).map(
      (properties) => new ReportStub(properties),
    );
  }

  export const rdfProperties = [...ArticleStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        ReportStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ReportStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      ReportStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("reportStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "reportStub");
    return [
      ...ArticleStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("reportStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "reportStub");
    return [
      ...ArticleStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Report"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class CreativeWorkSeries extends CreativeWork {
  override readonly type: "CreativeWorkSeries" | "RadioSeries" =
    "CreativeWorkSeries";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/CreativeWorkSeries"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace CreativeWorkSeriesStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/CreativeWorkSeries",
  );
  export type Json = CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, CreativeWorkSeries> {
    return (
      RadioSeries.fromJson(json) as purify.Either<
        zod.ZodError,
        CreativeWorkSeries
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new CreativeWorkSeries(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStatic.jsonUiSchema({ scopePrefix })],
      label: "CreativeWorkSeries",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["CreativeWorkSeries", "RadioSeries"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/CreativeWorkSeries"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/CreativeWorkSeries)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/CreativeWorkSeries",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<
      typeof CreativeWorkSeriesStatic.propertiesFromRdf
    >[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, CreativeWorkSeries> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      RadioSeries.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        CreativeWorkSeries
      >
    ).altLazy(() =>
      CreativeWorkSeriesStatic.propertiesFromRdf(parameters).map(
        (properties) => new CreativeWorkSeries(properties),
      ),
    );
  }

  export const rdfProperties = [...CreativeWorkStatic.rdfProperties];
}
export class RadioSeries extends CreativeWorkSeries {
  override readonly type = "RadioSeries";
  episodes: RadioEpisodeStub[];

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly episodes?: readonly RadioEpisodeStub[];
    } & ConstructorParameters<typeof CreativeWorkSeries>[0],
  ) {
    super(parameters);
    if (typeof parameters.episodes === "undefined") {
      this.episodes = [];
    } else if (Array.isArray(parameters.episodes)) {
      this.episodes = parameters.episodes;
    } else {
      this.episodes = parameters.episodes as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: RadioSeries): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.episodes,
          other.episodes,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "episodes",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    for (const _item0 of this.episodes) {
      _item0.hash(_hasher);
    }

    return _hasher;
  }

  override toJson(): RadioSeries.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        episodes: this.episodes.map((_item) => _item.toJson()),
      } satisfies RadioSeries.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/RadioSeries"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/episode"),
      this.episodes.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace RadioSeries {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/RadioSeries",
  );
  export type Json = {
    readonly episodes: readonly RadioEpisodeStub.Json[];
  } & CreativeWorkSeriesStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      episodes: RadioEpisodeStub[];
    } & $UnwrapR<ReturnType<typeof CreativeWorkSeriesStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkSeriesStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const episodes = _jsonObject["episodes"].map((_item) =>
      RadioEpisodeStub.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({ ..._super0, identifier, episodes });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, RadioSeries> {
    return propertiesFromJson(json).map(
      (properties) => new RadioSeries(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkSeriesStatic.jsonUiSchema({ scopePrefix }),
        RadioEpisodeStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/episodes`,
        }),
      ],
      label: "RadioSeries",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkSeriesStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("RadioSeries"),
        episodes: RadioEpisodeStub.jsonZodSchema()
          .array()
          .default(() => []),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      episodes: RadioEpisodeStub[];
    } & $UnwrapR<ReturnType<typeof CreativeWorkSeriesStatic.propertiesFromRdf>>
  > {
    const _super0Either = CreativeWorkSeriesStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/RadioSeries"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/RadioSeries)`,
          predicate: dataFactory.namedNode("http://schema.org/RadioSeries"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _episodesEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      RadioEpisodeStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/episode"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              RadioEpisodeStub.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_episodesEither.isLeft()) {
      return _episodesEither;
    }

    const episodes = _episodesEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, episodes });
  }

  export function fromRdf(
    parameters: Parameters<typeof RadioSeries.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, RadioSeries> {
    return RadioSeries.propertiesFromRdf(parameters).map(
      (properties) => new RadioSeries(properties),
    );
  }

  export const rdfProperties = [
    ...CreativeWorkSeriesStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/episode") },
  ];
}
export class CreativeWorkSeriesStub extends CreativeWorkStub {
  override readonly type: "CreativeWorkSeriesStub" | "RadioSeriesStub" =
    "CreativeWorkSeriesStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/CreativeWorkSeries"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace CreativeWorkSeriesStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/CreativeWorkSeries",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, CreativeWorkSeriesStub> {
    return (
      RadioSeriesStub.fromJson(json) as purify.Either<
        zod.ZodError,
        CreativeWorkSeriesStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new CreativeWorkSeriesStub(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "CreativeWorkSeriesStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["CreativeWorkSeriesStub", "RadioSeriesStub"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/CreativeWorkSeries"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/CreativeWorkSeries)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/CreativeWorkSeries",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<
      typeof CreativeWorkSeriesStubStatic.propertiesFromRdf
    >[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, CreativeWorkSeriesStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      RadioSeriesStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        CreativeWorkSeriesStub
      >
    ).altLazy(() =>
      CreativeWorkSeriesStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new CreativeWorkSeriesStub(properties),
      ),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        CreativeWorkSeriesStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        CreativeWorkSeriesStubStatic.sparqlWherePatterns({
          ignoreRdfType,
          subject,
        }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      CreativeWorkSeriesStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("creativeWorkSeriesStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "creativeWorkSeriesStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("creativeWorkSeriesStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "creativeWorkSeriesStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/CreativeWorkSeries",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class RadioSeriesStub extends CreativeWorkSeriesStub {
  override readonly type = "RadioSeriesStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkSeriesStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/RadioSeries"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace RadioSeriesStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/RadioSeries",
  );
  export type Json = CreativeWorkSeriesStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkSeriesStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkSeriesStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, RadioSeriesStub> {
    return propertiesFromJson(json).map(
      (properties) => new RadioSeriesStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkSeriesStubStatic.jsonUiSchema({ scopePrefix })],
      label: "RadioSeriesStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkSeriesStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("RadioSeriesStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkSeriesStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkSeriesStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/RadioSeries"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/RadioSeries)`,
          predicate: dataFactory.namedNode("http://schema.org/RadioSeries"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof RadioSeriesStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, RadioSeriesStub> {
    return RadioSeriesStub.propertiesFromRdf(parameters).map(
      (properties) => new RadioSeriesStub(properties),
    );
  }

  export const rdfProperties = [...CreativeWorkSeriesStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        RadioSeriesStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        RadioSeriesStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      RadioSeriesStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("radioSeriesStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "radioSeriesStub");
    return [
      ...CreativeWorkSeriesStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("radioSeriesStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "radioSeriesStub");
    return [
      ...CreativeWorkSeriesStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/RadioSeries",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class Episode extends CreativeWork {
  override readonly type: "Episode" | "RadioEpisode" = "Episode";
  readonly partOfSeries: purify.Maybe<CreativeWorkSeriesStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly partOfSeries?:
        | CreativeWorkSeriesStub
        | purify.Maybe<CreativeWorkSeriesStub>;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.partOfSeries)) {
      this.partOfSeries = parameters.partOfSeries;
    } else if (
      typeof parameters.partOfSeries === "object" &&
      parameters.partOfSeries instanceof CreativeWorkSeriesStub
    ) {
      this.partOfSeries = purify.Maybe.of(parameters.partOfSeries);
    } else if (typeof parameters.partOfSeries === "undefined") {
      this.partOfSeries = purify.Maybe.empty();
    } else {
      this.partOfSeries = parameters.partOfSeries as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Episode): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.partOfSeries,
          other.partOfSeries,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "partOfSeries",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.partOfSeries.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): EpisodeStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        partOfSeries: this.partOfSeries
          .map((_item) => _item.toJson())
          .extract(),
      } satisfies EpisodeStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Episode"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/partOfSeries"),
      this.partOfSeries.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace EpisodeStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Episode",
  );
  export type Json = {
    readonly partOfSeries: CreativeWorkSeriesStubStatic.Json | undefined;
  } & CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      partOfSeries: purify.Maybe<CreativeWorkSeriesStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const partOfSeries = purify.Maybe.fromNullable(
      _jsonObject["partOfSeries"],
    ).map((_item) =>
      CreativeWorkSeriesStubStatic.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({ ..._super0, identifier, partOfSeries });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Episode> {
    return (
      RadioEpisode.fromJson(json) as purify.Either<zod.ZodError, Episode>
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new Episode(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStatic.jsonUiSchema({ scopePrefix }),
        CreativeWorkSeriesStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/partOfSeries`,
        }),
      ],
      label: "Episode",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["Episode", "RadioEpisode"]),
        partOfSeries: CreativeWorkSeriesStubStatic.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      partOfSeries: purify.Maybe<CreativeWorkSeriesStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>>
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Episode"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Episode)`,
          predicate: dataFactory.namedNode("http://schema.org/Episode"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _partOfSeriesEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<CreativeWorkSeriesStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/partOfSeries"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          CreativeWorkSeriesStubStatic.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_partOfSeriesEither.isLeft()) {
      return _partOfSeriesEither;
    }

    const partOfSeries = _partOfSeriesEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, partOfSeries });
  }

  export function fromRdf(
    parameters: Parameters<typeof EpisodeStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Episode> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      RadioEpisode.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Episode
      >
    ).altLazy(() =>
      EpisodeStatic.propertiesFromRdf(parameters).map(
        (properties) => new Episode(properties),
      ),
    );
  }

  export const rdfProperties = [
    ...CreativeWorkStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/partOfSeries") },
  ];
}
export class RadioEpisode extends Episode {
  override readonly type = "RadioEpisode";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Episode>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/RadioEpisode"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace RadioEpisode {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/RadioEpisode",
  );
  export type Json = EpisodeStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof EpisodeStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = EpisodeStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, RadioEpisode> {
    return propertiesFromJson(json).map(
      (properties) => new RadioEpisode(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [EpisodeStatic.jsonUiSchema({ scopePrefix })],
      label: "RadioEpisode",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return EpisodeStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("RadioEpisode"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof EpisodeStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = EpisodeStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/RadioEpisode"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/RadioEpisode)`,
          predicate: dataFactory.namedNode("http://schema.org/RadioEpisode"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof RadioEpisode.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, RadioEpisode> {
    return RadioEpisode.propertiesFromRdf(parameters).map(
      (properties) => new RadioEpisode(properties),
    );
  }

  export const rdfProperties = [...EpisodeStatic.rdfProperties];
}
export class EpisodeStub extends CreativeWorkStub {
  override readonly type: "EpisodeStub" | "RadioEpisodeStub" = "EpisodeStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Episode"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace EpisodeStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Episode",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, EpisodeStub> {
    return (
      RadioEpisodeStub.fromJson(json) as purify.Either<
        zod.ZodError,
        EpisodeStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new EpisodeStub(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "EpisodeStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["EpisodeStub", "RadioEpisodeStub"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Episode"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Episode)`,
          predicate: dataFactory.namedNode("http://schema.org/Episode"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof EpisodeStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, EpisodeStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      RadioEpisodeStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        EpisodeStub
      >
    ).altLazy(() =>
      EpisodeStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new EpisodeStub(properties),
      ),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        EpisodeStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        EpisodeStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      EpisodeStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("episodeStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "episodeStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("episodeStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "episodeStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Episode"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class RadioEpisodeStub extends EpisodeStub {
  override readonly type = "RadioEpisodeStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof EpisodeStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/RadioEpisode"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace RadioEpisodeStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/RadioEpisode",
  );
  export type Json = EpisodeStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof EpisodeStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = EpisodeStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, RadioEpisodeStub> {
    return propertiesFromJson(json).map(
      (properties) => new RadioEpisodeStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [EpisodeStubStatic.jsonUiSchema({ scopePrefix })],
      label: "RadioEpisodeStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return EpisodeStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("RadioEpisodeStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof EpisodeStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = EpisodeStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/RadioEpisode"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/RadioEpisode)`,
          predicate: dataFactory.namedNode("http://schema.org/RadioEpisode"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof RadioEpisodeStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, RadioEpisodeStub> {
    return RadioEpisodeStub.propertiesFromRdf(parameters).map(
      (properties) => new RadioEpisodeStub(properties),
    );
  }

  export const rdfProperties = [...EpisodeStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        RadioEpisodeStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        RadioEpisodeStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      RadioEpisodeStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("radioEpisodeStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "radioEpisodeStub");
    return [
      ...EpisodeStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("radioEpisodeStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "radioEpisodeStub");
    return [
      ...EpisodeStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/RadioEpisode",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class BroadcastService extends Service {
  override readonly type: "BroadcastService" | "RadioBroadcastService" =
    "BroadcastService";
  readonly callSign: purify.Maybe<string>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly callSign?: purify.Maybe<string> | string;
    } & ConstructorParameters<typeof Service>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.callSign)) {
      this.callSign = parameters.callSign;
    } else if (typeof parameters.callSign === "string") {
      this.callSign = purify.Maybe.of(parameters.callSign);
    } else if (typeof parameters.callSign === "undefined") {
      this.callSign = purify.Maybe.empty();
    } else {
      this.callSign = parameters.callSign as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: BroadcastService): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.callSign,
          other.callSign,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "callSign",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.callSign.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    return _hasher;
  }

  override toJson(): BroadcastServiceStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        callSign: this.callSign.map((_item) => _item).extract(),
      } satisfies BroadcastServiceStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/BroadcastService"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/callSign"),
      this.callSign,
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace BroadcastServiceStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/BroadcastService",
  );
  export type Json = {
    readonly callSign: string | undefined;
  } & ServiceStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      callSign: purify.Maybe<string>;
    } & $UnwrapR<ReturnType<typeof ServiceStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ServiceStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const callSign = purify.Maybe.fromNullable(_jsonObject["callSign"]);
    return purify.Either.of({ ..._super0, identifier, callSign });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, BroadcastService> {
    return (
      RadioBroadcastService.fromJson(json) as purify.Either<
        zod.ZodError,
        BroadcastService
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new BroadcastService(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ServiceStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/callSign`, type: "Control" },
      ],
      label: "BroadcastService",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ServiceStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["BroadcastService", "RadioBroadcastService"]),
        callSign: zod.string().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      callSign: purify.Maybe<string>;
    } & $UnwrapR<ReturnType<typeof ServiceStatic.propertiesFromRdf>>
  > {
    const _super0Either = ServiceStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/BroadcastService"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/BroadcastService)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/BroadcastService",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _callSignEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/callSign"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_callSignEither.isLeft()) {
      return _callSignEither;
    }

    const callSign = _callSignEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, callSign });
  }

  export function fromRdf(
    parameters: Parameters<typeof BroadcastServiceStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, BroadcastService> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      RadioBroadcastService.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        BroadcastService
      >
    ).altLazy(() =>
      BroadcastServiceStatic.propertiesFromRdf(parameters).map(
        (properties) => new BroadcastService(properties),
      ),
    );
  }

  export const rdfProperties = [
    ...ServiceStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/callSign") },
  ];
}
export class RadioBroadcastService extends BroadcastService {
  override readonly type = "RadioBroadcastService";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof BroadcastService>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode(
          "http://schema.org/RadioBroadcastService",
        ),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace RadioBroadcastService {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/RadioBroadcastService",
  );
  export type Json = BroadcastServiceStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof BroadcastServiceStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      BroadcastServiceStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, RadioBroadcastService> {
    return propertiesFromJson(json).map(
      (properties) => new RadioBroadcastService(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [BroadcastServiceStatic.jsonUiSchema({ scopePrefix })],
      label: "RadioBroadcastService",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return BroadcastServiceStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("RadioBroadcastService"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof BroadcastServiceStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = BroadcastServiceStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/RadioBroadcastService"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/RadioBroadcastService)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/RadioBroadcastService",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof RadioBroadcastService.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, RadioBroadcastService> {
    return RadioBroadcastService.propertiesFromRdf(parameters).map(
      (properties) => new RadioBroadcastService(properties),
    );
  }

  export const rdfProperties = [...BroadcastServiceStatic.rdfProperties];
}
export class IntangibleStub extends ThingStub {
  override readonly type:
    | "IntangibleStub"
    | "BroadcastServiceStub"
    | "InvoiceStub"
    | "MonetaryAmountStub"
    | "OrderStub"
    | "QuantitativeValueStub"
    | "RadioBroadcastServiceStub"
    | "ServiceStub"
    | "StructuredValueStub" = "IntangibleStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Intangible"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace IntangibleStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Intangible",
  );
  export type Json = ThingStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, IntangibleStub> {
    return (
      ServiceStubStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        IntangibleStub
      >
    )
      .altLazy(
        () =>
          InvoiceStub.fromJson(json) as purify.Either<
            zod.ZodError,
            IntangibleStub
          >,
      )
      .altLazy(
        () =>
          StructuredValueStubStatic.fromJson(json) as purify.Either<
            zod.ZodError,
            IntangibleStub
          >,
      )
      .altLazy(
        () =>
          OrderStub.fromJson(json) as purify.Either<
            zod.ZodError,
            IntangibleStub
          >,
      )
      .altLazy(() =>
        propertiesFromJson(json).map(
          (properties) => new IntangibleStub(properties),
        ),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStubStatic.jsonUiSchema({ scopePrefix })],
      label: "IntangibleStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "IntangibleStub",
          "BroadcastServiceStub",
          "InvoiceStub",
          "MonetaryAmountStub",
          "OrderStub",
          "QuantitativeValueStub",
          "RadioBroadcastServiceStub",
          "ServiceStub",
          "StructuredValueStub",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Intangible"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Intangible)`,
          predicate: dataFactory.namedNode("http://schema.org/Intangible"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof IntangibleStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, IntangibleStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ServiceStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        IntangibleStub
      >
    )
      .altLazy(
        () =>
          InvoiceStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            IntangibleStub
          >,
      )
      .altLazy(
        () =>
          StructuredValueStubStatic.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            IntangibleStub
          >,
      )
      .altLazy(
        () =>
          OrderStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            IntangibleStub
          >,
      )
      .altLazy(() =>
        IntangibleStubStatic.propertiesFromRdf(parameters).map(
          (properties) => new IntangibleStub(properties),
        ),
      );
  }

  export const rdfProperties = [...ThingStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        IntangibleStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        IntangibleStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      IntangibleStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("intangibleStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "intangibleStub");
    return [
      ...ThingStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("intangibleStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "intangibleStub");
    return [
      ...ThingStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Intangible"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class ServiceStub extends IntangibleStub {
  override readonly type:
    | "ServiceStub"
    | "BroadcastServiceStub"
    | "RadioBroadcastServiceStub" = "ServiceStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof IntangibleStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Service"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ServiceStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Service",
  );
  export type Json = IntangibleStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ServiceStub> {
    return (
      BroadcastServiceStubStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        ServiceStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new ServiceStub(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStubStatic.jsonUiSchema({ scopePrefix })],
      label: "ServiceStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "ServiceStub",
          "BroadcastServiceStub",
          "RadioBroadcastServiceStub",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Service"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Service)`,
          predicate: dataFactory.namedNode("http://schema.org/Service"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof ServiceStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ServiceStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      BroadcastServiceStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ServiceStub
      >
    ).altLazy(() =>
      ServiceStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new ServiceStub(properties),
      ),
    );
  }

  export const rdfProperties = [...IntangibleStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        ServiceStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ServiceStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      ServiceStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("serviceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "serviceStub");
    return [
      ...IntangibleStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("serviceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "serviceStub");
    return [
      ...IntangibleStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Service"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class BroadcastServiceStub extends ServiceStub {
  override readonly type: "BroadcastServiceStub" | "RadioBroadcastServiceStub" =
    "BroadcastServiceStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ServiceStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/BroadcastService"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace BroadcastServiceStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/BroadcastService",
  );
  export type Json = ServiceStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ServiceStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ServiceStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, BroadcastServiceStub> {
    return (
      RadioBroadcastServiceStub.fromJson(json) as purify.Either<
        zod.ZodError,
        BroadcastServiceStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new BroadcastServiceStub(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ServiceStubStatic.jsonUiSchema({ scopePrefix })],
      label: "BroadcastServiceStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ServiceStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["BroadcastServiceStub", "RadioBroadcastServiceStub"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ServiceStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ServiceStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/BroadcastService"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/BroadcastService)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/BroadcastService",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<
      typeof BroadcastServiceStubStatic.propertiesFromRdf
    >[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, BroadcastServiceStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      RadioBroadcastServiceStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        BroadcastServiceStub
      >
    ).altLazy(() =>
      BroadcastServiceStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new BroadcastServiceStub(properties),
      ),
    );
  }

  export const rdfProperties = [...ServiceStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        BroadcastServiceStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        BroadcastServiceStubStatic.sparqlWherePatterns({
          ignoreRdfType,
          subject,
        }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      BroadcastServiceStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("broadcastServiceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "broadcastServiceStub");
    return [
      ...ServiceStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("broadcastServiceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "broadcastServiceStub");
    return [
      ...ServiceStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/BroadcastService",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class RadioBroadcastServiceStub extends BroadcastServiceStub {
  override readonly type = "RadioBroadcastServiceStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof BroadcastServiceStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode(
          "http://schema.org/RadioBroadcastService",
        ),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace RadioBroadcastServiceStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/RadioBroadcastService",
  );
  export type Json = BroadcastServiceStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof BroadcastServiceStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      BroadcastServiceStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, RadioBroadcastServiceStub> {
    return propertiesFromJson(json).map(
      (properties) => new RadioBroadcastServiceStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [BroadcastServiceStubStatic.jsonUiSchema({ scopePrefix })],
      label: "RadioBroadcastServiceStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return BroadcastServiceStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("RadioBroadcastServiceStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof BroadcastServiceStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = BroadcastServiceStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/RadioBroadcastService"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/RadioBroadcastService)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/RadioBroadcastService",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<
      typeof RadioBroadcastServiceStub.propertiesFromRdf
    >[0],
  ): purify.Either<
    rdfjsResource.Resource.ValueError,
    RadioBroadcastServiceStub
  > {
    return RadioBroadcastServiceStub.propertiesFromRdf(parameters).map(
      (properties) => new RadioBroadcastServiceStub(properties),
    );
  }

  export const rdfProperties = [...BroadcastServiceStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        RadioBroadcastServiceStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        RadioBroadcastServiceStub.sparqlWherePatterns({
          ignoreRdfType,
          subject,
        }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      RadioBroadcastServiceStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("radioBroadcastServiceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "radioBroadcastServiceStub");
    return [
      ...BroadcastServiceStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("radioBroadcastServiceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "radioBroadcastServiceStub");
    return [
      ...BroadcastServiceStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/RadioBroadcastService",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class QuantitativeValue extends StructuredValue {
  override readonly type = "QuantitativeValue";
  readonly unitText: purify.Maybe<string>;
  readonly value: purify.Maybe<number>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly unitText?: purify.Maybe<string> | string;
      readonly value?: number | purify.Maybe<number>;
    } & ConstructorParameters<typeof StructuredValue>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.unitText)) {
      this.unitText = parameters.unitText;
    } else if (typeof parameters.unitText === "string") {
      this.unitText = purify.Maybe.of(parameters.unitText);
    } else if (typeof parameters.unitText === "undefined") {
      this.unitText = purify.Maybe.empty();
    } else {
      this.unitText = parameters.unitText as never;
    }

    if (purify.Maybe.isMaybe(parameters.value)) {
      this.value = parameters.value;
    } else if (typeof parameters.value === "number") {
      this.value = purify.Maybe.of(parameters.value);
    } else if (typeof parameters.value === "undefined") {
      this.value = purify.Maybe.empty();
    } else {
      this.value = parameters.value as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: QuantitativeValue): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.unitText,
          other.unitText,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "unitText",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.value,
          other.value,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "value",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.unitText.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.value.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    return _hasher;
  }

  override toJson(): QuantitativeValue.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        unitText: this.unitText.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies QuantitativeValue.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/QuantitativeValue"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/unitText"),
      this.unitText,
    );
    _resource.add(dataFactory.namedNode("http://schema.org/value"), this.value);
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace QuantitativeValue {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/QuantitativeValue",
  );
  export type Json = {
    readonly unitText: string | undefined;
    readonly value: number | undefined;
  } & StructuredValueStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      unitText: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof StructuredValueStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = StructuredValueStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const unitText = purify.Maybe.fromNullable(_jsonObject["unitText"]);
    const value = purify.Maybe.fromNullable(_jsonObject["value"]);
    return purify.Either.of({ ..._super0, identifier, unitText, value });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, QuantitativeValue> {
    return propertiesFromJson(json).map(
      (properties) => new QuantitativeValue(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValueStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/unitText`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "QuantitativeValue",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return StructuredValueStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("QuantitativeValue"),
        unitText: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      unitText: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof StructuredValueStatic.propertiesFromRdf>>
  > {
    const _super0Either = StructuredValueStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/QuantitativeValue"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/QuantitativeValue)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/QuantitativeValue",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _unitTextEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/unitText"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_unitTextEither.isLeft()) {
      return _unitTextEither;
    }

    const unitText = _unitTextEither.unsafeCoerce();
    const _valueEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<number>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/value"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toNumber())
        .toMaybe(),
    );
    if (_valueEither.isLeft()) {
      return _valueEither;
    }

    const value = _valueEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, unitText, value });
  }

  export function fromRdf(
    parameters: Parameters<typeof QuantitativeValue.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, QuantitativeValue> {
    return QuantitativeValue.propertiesFromRdf(parameters).map(
      (properties) => new QuantitativeValue(properties),
    );
  }

  export const rdfProperties = [
    ...StructuredValueStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/unitText") },
    { path: dataFactory.namedNode("http://schema.org/value") },
  ];
}
export class StructuredValueStub extends IntangibleStub {
  override readonly type:
    | "StructuredValueStub"
    | "MonetaryAmountStub"
    | "QuantitativeValueStub" = "StructuredValueStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof IntangibleStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/StructuredValue"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace StructuredValueStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/StructuredValue",
  );
  export type Json = IntangibleStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, StructuredValueStub> {
    return (
      MonetaryAmountStub.fromJson(json) as purify.Either<
        zod.ZodError,
        StructuredValueStub
      >
    )
      .altLazy(
        () =>
          QuantitativeValueStub.fromJson(json) as purify.Either<
            zod.ZodError,
            StructuredValueStub
          >,
      )
      .altLazy(() =>
        propertiesFromJson(json).map(
          (properties) => new StructuredValueStub(properties),
        ),
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStubStatic.jsonUiSchema({ scopePrefix })],
      label: "StructuredValueStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "StructuredValueStub",
          "MonetaryAmountStub",
          "QuantitativeValueStub",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/StructuredValue"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/StructuredValue)`,
          predicate: dataFactory.namedNode("http://schema.org/StructuredValue"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<
      typeof StructuredValueStubStatic.propertiesFromRdf
    >[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, StructuredValueStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      MonetaryAmountStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        StructuredValueStub
      >
    )
      .altLazy(
        () =>
          QuantitativeValueStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            StructuredValueStub
          >,
      )
      .altLazy(() =>
        StructuredValueStubStatic.propertiesFromRdf(parameters).map(
          (properties) => new StructuredValueStub(properties),
        ),
      );
  }

  export const rdfProperties = [...IntangibleStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        StructuredValueStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        StructuredValueStubStatic.sparqlWherePatterns({
          ignoreRdfType,
          subject,
        }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      StructuredValueStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("structuredValueStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "structuredValueStub");
    return [
      ...IntangibleStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("structuredValueStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "structuredValueStub");
    return [
      ...IntangibleStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/StructuredValue",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class QuantitativeValueStub extends StructuredValueStub {
  override readonly type = "QuantitativeValueStub";
  readonly unitText: purify.Maybe<string>;
  readonly value: purify.Maybe<number>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly unitText?: purify.Maybe<string> | string;
      readonly value?: number | purify.Maybe<number>;
    } & ConstructorParameters<typeof StructuredValueStub>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.unitText)) {
      this.unitText = parameters.unitText;
    } else if (typeof parameters.unitText === "string") {
      this.unitText = purify.Maybe.of(parameters.unitText);
    } else if (typeof parameters.unitText === "undefined") {
      this.unitText = purify.Maybe.empty();
    } else {
      this.unitText = parameters.unitText as never;
    }

    if (purify.Maybe.isMaybe(parameters.value)) {
      this.value = parameters.value;
    } else if (typeof parameters.value === "number") {
      this.value = purify.Maybe.of(parameters.value);
    } else if (typeof parameters.value === "undefined") {
      this.value = purify.Maybe.empty();
    } else {
      this.value = parameters.value as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: QuantitativeValueStub): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.unitText,
          other.unitText,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "unitText",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.value,
          other.value,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "value",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.unitText.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.value.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    return _hasher;
  }

  override toJson(): QuantitativeValueStub.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        unitText: this.unitText.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies QuantitativeValueStub.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/QuantitativeValue"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/unitText"),
      this.unitText,
    );
    _resource.add(dataFactory.namedNode("http://schema.org/value"), this.value);
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace QuantitativeValueStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/QuantitativeValue",
  );
  export type Json = {
    readonly unitText: string | undefined;
    readonly value: number | undefined;
  } & StructuredValueStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      unitText: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<
      ReturnType<typeof StructuredValueStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      StructuredValueStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const unitText = purify.Maybe.fromNullable(_jsonObject["unitText"]);
    const value = purify.Maybe.fromNullable(_jsonObject["value"]);
    return purify.Either.of({ ..._super0, identifier, unitText, value });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, QuantitativeValueStub> {
    return propertiesFromJson(json).map(
      (properties) => new QuantitativeValueStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValueStubStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/unitText`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "QuantitativeValueStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return StructuredValueStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("QuantitativeValueStub"),
        unitText: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      unitText: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof StructuredValueStubStatic.propertiesFromRdf>>
  > {
    const _super0Either = StructuredValueStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/QuantitativeValue"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/QuantitativeValue)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/QuantitativeValue",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _unitTextEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/unitText"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_unitTextEither.isLeft()) {
      return _unitTextEither;
    }

    const unitText = _unitTextEither.unsafeCoerce();
    const _valueEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<number>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/value"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toNumber())
        .toMaybe(),
    );
    if (_valueEither.isLeft()) {
      return _valueEither;
    }

    const value = _valueEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, unitText, value });
  }

  export function fromRdf(
    parameters: Parameters<typeof QuantitativeValueStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, QuantitativeValueStub> {
    return QuantitativeValueStub.propertiesFromRdf(parameters).map(
      (properties) => new QuantitativeValueStub(properties),
    );
  }

  export const rdfProperties = [
    ...StructuredValueStubStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/unitText") },
    { path: dataFactory.namedNode("http://schema.org/value") },
  ];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        QuantitativeValueStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        QuantitativeValueStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      QuantitativeValueStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("quantitativeValueStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "quantitativeValueStub");
    return [
      ...StructuredValueStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
      {
        object: dataFactory.variable!(`${variablePrefix}UnitText`),
        predicate: dataFactory.namedNode("http://schema.org/unitText"),
        subject,
      },
      {
        object: dataFactory.variable!(`${variablePrefix}Value`),
        predicate: dataFactory.namedNode("http://schema.org/value"),
        subject,
      },
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("quantitativeValueStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "quantitativeValueStub");
    return [
      ...StructuredValueStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/QuantitativeValue",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}UnitText`),
                predicate: dataFactory.namedNode("http://schema.org/unitText"),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}Value`),
                predicate: dataFactory.namedNode("http://schema.org/value"),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
    ];
  }
}
export class EventStub extends ThingStub {
  override readonly type: "EventStub" | "PublicationEventStub" = "EventStub";
  readonly startDate: purify.Maybe<Date>;
  superEvent: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly startDate?: Date | purify.Maybe<Date>;
      readonly superEvent?:
        | (rdfjs.BlankNode | rdfjs.NamedNode)
        | purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode>
        | string;
    } & ConstructorParameters<typeof ThingStub>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.startDate)) {
      this.startDate = parameters.startDate;
    } else if (
      typeof parameters.startDate === "object" &&
      parameters.startDate instanceof Date
    ) {
      this.startDate = purify.Maybe.of(parameters.startDate);
    } else if (typeof parameters.startDate === "undefined") {
      this.startDate = purify.Maybe.empty();
    } else {
      this.startDate = parameters.startDate as never;
    }

    if (purify.Maybe.isMaybe(parameters.superEvent)) {
      this.superEvent = parameters.superEvent;
    } else if (typeof parameters.superEvent === "object") {
      this.superEvent = purify.Maybe.of(parameters.superEvent);
    } else if (typeof parameters.superEvent === "string") {
      this.superEvent = purify.Maybe.of(
        dataFactory.namedNode(parameters.superEvent),
      );
    } else if (typeof parameters.superEvent === "undefined") {
      this.superEvent = purify.Maybe.empty();
    } else {
      this.superEvent = parameters.superEvent as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: EventStub): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.startDate,
          other.startDate,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "startDate",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $booleanEquals))(
          this.superEvent,
          other.superEvent,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "superEvent",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.startDate.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    this.superEvent.ifJust((_value0) => {
      _hasher.update(_value0.termType);
      _hasher.update(_value0.value);
    });
    return _hasher;
  }

  override toJson(): EventStubStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        startDate: this.startDate.map((_item) => _item.toISOString()).extract(),
        superEvent: this.superEvent
          .map((_item) =>
            _item.termType === "BlankNode"
              ? { "@id": `_:${_item.value}` }
              : { "@id": _item.value },
          )
          .extract(),
      } satisfies EventStubStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Event"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/startDate"),
      this.startDate.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#dateTime",
          ),
        }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/superEvent"),
      this.superEvent,
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace EventStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Event",
  );
  export type Json = {
    readonly startDate: string | undefined;
    readonly superEvent: { readonly "@id": string } | undefined;
  } & ThingStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      startDate: purify.Maybe<Date>;
      superEvent: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode>;
    } & $UnwrapR<ReturnType<typeof ThingStubStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const startDate = purify.Maybe.fromNullable(_jsonObject["startDate"]).map(
      (_item) => new Date(_item),
    );
    const superEvent = purify.Maybe.fromNullable(_jsonObject["superEvent"]).map(
      (_item) =>
        _item["@id"].startsWith("_:")
          ? dataFactory.blankNode(_item["@id"].substring(2))
          : dataFactory.namedNode(_item["@id"]),
    );
    return purify.Either.of({ ..._super0, identifier, startDate, superEvent });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, EventStub> {
    return (
      PublicationEventStub.fromJson(json) as purify.Either<
        zod.ZodError,
        EventStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map((properties) => new EventStub(properties)),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStubStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/startDate`, type: "Control" },
        { scope: `${scopePrefix}/properties/superEvent`, type: "Control" },
      ],
      label: "EventStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["EventStub", "PublicationEventStub"]),
        startDate: zod.string().datetime().optional(),
        superEvent: zod.object({ "@id": zod.string().min(1) }).optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      startDate: purify.Maybe<Date>;
      superEvent: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode>;
    } & $UnwrapR<ReturnType<typeof ThingStubStatic.propertiesFromRdf>>
  > {
    const _super0Either = ThingStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Event"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Event)`,
          predicate: dataFactory.namedNode("http://schema.org/Event"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _startDateEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/startDate"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_startDateEither.isLeft()) {
      return _startDateEither;
    }

    const startDate = _startDateEither.unsafeCoerce();
    const _superEventEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/superEvent"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toIdentifier())
        .toMaybe(),
    );
    if (_superEventEither.isLeft()) {
      return _superEventEither;
    }

    const superEvent = _superEventEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, startDate, superEvent });
  }

  export function fromRdf(
    parameters: Parameters<typeof EventStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, EventStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      PublicationEventStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        EventStub
      >
    ).altLazy(() =>
      EventStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new EventStub(properties),
      ),
    );
  }

  export const rdfProperties = [
    ...ThingStubStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/startDate") },
    { path: dataFactory.namedNode("http://schema.org/superEvent") },
  ];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        EventStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        EventStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      EventStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("eventStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "eventStub");
    return [
      ...ThingStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
      {
        object: dataFactory.variable!(`${variablePrefix}StartDate`),
        predicate: dataFactory.namedNode("http://schema.org/startDate"),
        subject,
      },
      {
        object: dataFactory.variable!(`${variablePrefix}SuperEvent`),
        predicate: dataFactory.namedNode("http://schema.org/superEvent"),
        subject,
      },
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("eventStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "eventStub");
    return [
      ...ThingStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Event"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}StartDate`),
                predicate: dataFactory.namedNode("http://schema.org/startDate"),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}SuperEvent`),
                predicate: dataFactory.namedNode(
                  "http://schema.org/superEvent",
                ),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
    ];
  }
}
export class PublicationEventStub extends EventStub {
  override readonly type = "PublicationEventStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof EventStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/PublicationEvent"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace PublicationEventStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/PublicationEvent",
  );
  export type Json = EventStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof EventStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = EventStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, PublicationEventStub> {
    return propertiesFromJson(json).map(
      (properties) => new PublicationEventStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [EventStubStatic.jsonUiSchema({ scopePrefix })],
      label: "PublicationEventStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return EventStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("PublicationEventStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof EventStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = EventStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/PublicationEvent"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/PublicationEvent)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/PublicationEvent",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof PublicationEventStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PublicationEventStub> {
    return PublicationEventStub.propertiesFromRdf(parameters).map(
      (properties) => new PublicationEventStub(properties),
    );
  }

  export const rdfProperties = [...EventStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        PublicationEventStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        PublicationEventStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      PublicationEventStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("publicationEventStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "publicationEventStub");
    return [
      ...EventStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("publicationEventStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "publicationEventStub");
    return [
      ...EventStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/PublicationEvent",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class Place extends Thing {
  override readonly type = "Place";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Place"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Place {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Place",
  );
  export type Json = ThingStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Place> {
    return propertiesFromJson(json).map((properties) => new Place(properties));
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStatic.jsonUiSchema({ scopePrefix })],
      label: "Place",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStatic.jsonZodSchema().merge(
      zod.object({ "@id": zod.string().min(1), type: zod.literal("Place") }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Place"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Place)`,
          predicate: dataFactory.namedNode("http://schema.org/Place"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof Place.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Place> {
    return Place.propertiesFromRdf(parameters).map(
      (properties) => new Place(properties),
    );
  }

  export const rdfProperties = [...ThingStatic.rdfProperties];
}
export class PlaceStub extends ThingStub {
  override readonly type = "PlaceStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Place"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace PlaceStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Place",
  );
  export type Json = ThingStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, PlaceStub> {
    return propertiesFromJson(json).map(
      (properties) => new PlaceStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStubStatic.jsonUiSchema({ scopePrefix })],
      label: "PlaceStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("PlaceStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Place"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Place)`,
          predicate: dataFactory.namedNode("http://schema.org/Place"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof PlaceStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PlaceStub> {
    return PlaceStub.propertiesFromRdf(parameters).map(
      (properties) => new PlaceStub(properties),
    );
  }

  export const rdfProperties = [...ThingStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        PlaceStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        PlaceStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      PlaceStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("placeStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "placeStub");
    return [
      ...ThingStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("placeStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "placeStub");
    return [
      ...ThingStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Place"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class Person extends Thing {
  override readonly type = "Person";
  readonly birthDate: purify.Maybe<Date>;
  readonly familyName: purify.Maybe<string>;
  readonly gender: purify.Maybe<
    rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal
  >;
  readonly givenName: purify.Maybe<string>;
  readonly hasOccupation: readonly (Occupation | Role)[];
  readonly images: readonly ImageObject[];
  readonly jobTitle: purify.Maybe<string>;
  memberOf: OrganizationStub[];
  performerIn: EventStub[];

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly birthDate?: Date | purify.Maybe<Date>;
      readonly familyName?: purify.Maybe<string> | string;
      readonly gender?:
        | (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)
        | Date
        | boolean
        | number
        | purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>
        | string;
      readonly givenName?: purify.Maybe<string> | string;
      readonly hasOccupation?: readonly (Occupation | Role)[];
      readonly images?: readonly ImageObject[];
      readonly jobTitle?: purify.Maybe<string> | string;
      readonly memberOf?: readonly OrganizationStub[];
      readonly performerIn?: readonly EventStub[];
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.birthDate)) {
      this.birthDate = parameters.birthDate;
    } else if (
      typeof parameters.birthDate === "object" &&
      parameters.birthDate instanceof Date
    ) {
      this.birthDate = purify.Maybe.of(parameters.birthDate);
    } else if (typeof parameters.birthDate === "undefined") {
      this.birthDate = purify.Maybe.empty();
    } else {
      this.birthDate = parameters.birthDate as never;
    }

    if (purify.Maybe.isMaybe(parameters.familyName)) {
      this.familyName = parameters.familyName;
    } else if (typeof parameters.familyName === "string") {
      this.familyName = purify.Maybe.of(parameters.familyName);
    } else if (typeof parameters.familyName === "undefined") {
      this.familyName = purify.Maybe.empty();
    } else {
      this.familyName = parameters.familyName as never;
    }

    if (purify.Maybe.isMaybe(parameters.gender)) {
      this.gender = parameters.gender;
    } else if (typeof parameters.gender === "boolean") {
      this.gender = purify.Maybe.of(
        rdfLiteral.toRdf(parameters.gender, { dataFactory }),
      );
    } else if (
      typeof parameters.gender === "object" &&
      parameters.gender instanceof Date
    ) {
      this.gender = purify.Maybe.of(
        rdfLiteral.toRdf(parameters.gender, { dataFactory }),
      );
    } else if (typeof parameters.gender === "number") {
      this.gender = purify.Maybe.of(
        rdfLiteral.toRdf(parameters.gender, { dataFactory }),
      );
    } else if (typeof parameters.gender === "string") {
      this.gender = purify.Maybe.of(dataFactory.literal(parameters.gender));
    } else if (typeof parameters.gender === "object") {
      this.gender = purify.Maybe.of(parameters.gender);
    } else if (typeof parameters.gender === "undefined") {
      this.gender = purify.Maybe.empty();
    } else {
      this.gender = parameters.gender as never;
    }

    if (purify.Maybe.isMaybe(parameters.givenName)) {
      this.givenName = parameters.givenName;
    } else if (typeof parameters.givenName === "string") {
      this.givenName = purify.Maybe.of(parameters.givenName);
    } else if (typeof parameters.givenName === "undefined") {
      this.givenName = purify.Maybe.empty();
    } else {
      this.givenName = parameters.givenName as never;
    }

    if (typeof parameters.hasOccupation === "undefined") {
      this.hasOccupation = [];
    } else if (Array.isArray(parameters.hasOccupation)) {
      this.hasOccupation = parameters.hasOccupation;
    } else {
      this.hasOccupation = parameters.hasOccupation as never;
    }

    if (typeof parameters.images === "undefined") {
      this.images = [];
    } else if (Array.isArray(parameters.images)) {
      this.images = parameters.images;
    } else {
      this.images = parameters.images as never;
    }

    if (purify.Maybe.isMaybe(parameters.jobTitle)) {
      this.jobTitle = parameters.jobTitle;
    } else if (typeof parameters.jobTitle === "string") {
      this.jobTitle = purify.Maybe.of(parameters.jobTitle);
    } else if (typeof parameters.jobTitle === "undefined") {
      this.jobTitle = purify.Maybe.empty();
    } else {
      this.jobTitle = parameters.jobTitle as never;
    }

    if (typeof parameters.memberOf === "undefined") {
      this.memberOf = [];
    } else if (Array.isArray(parameters.memberOf)) {
      this.memberOf = parameters.memberOf;
    } else {
      this.memberOf = parameters.memberOf as never;
    }

    if (typeof parameters.performerIn === "undefined") {
      this.performerIn = [];
    } else if (Array.isArray(parameters.performerIn)) {
      this.performerIn = parameters.performerIn;
    } else {
      this.performerIn = parameters.performerIn as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Person): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $dateEquals))(
          this.birthDate,
          other.birthDate,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "birthDate",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.familyName,
          other.familyName,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "familyName",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $booleanEquals))(
          this.gender,
          other.gender,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "gender",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.givenName,
          other.givenName,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "givenName",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(
            left,
            right,
            (left: Occupation | Role, right: Occupation | Role) => {
              if (left.type === "Occupation" && right.type === "Occupation") {
                return ((left, right) => left.equals(right))(left, right);
              }
              if (left.type === "Role" && right.type === "Role") {
                return ((left, right) => left.equals(right))(left, right);
              }

              return purify.Left({
                left,
                right,
                propertyName: "type",
                propertyValuesUnequal: {
                  left: typeof left,
                  right: typeof right,
                  type: "BooleanEquals" as const,
                },
                type: "Property" as const,
              });
            },
          ))(this.hasOccupation, other.hasOccupation).mapLeft(
          (propertyValuesUnequal) => ({
            left: this,
            right: other,
            propertyName: "hasOccupation",
            propertyValuesUnequal,
            type: "Property" as const,
          }),
        ),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.images,
          other.images,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "images",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.jobTitle,
          other.jobTitle,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "jobTitle",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.memberOf,
          other.memberOf,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "memberOf",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.performerIn,
          other.performerIn,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "performerIn",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.birthDate.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
    });
    this.familyName.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.gender.ifJust((_value0) => {
      _hasher.update(_value0.termType);
      _hasher.update(_value0.value);
    });
    this.givenName.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.hasOccupation) {
      switch (_item0.type) {
        case "Occupation": {
          _item0.hash(_hasher);
          break;
        }
        case "Role": {
          _item0.hash(_hasher);
          break;
        }
        default:
          _item0 satisfies never;
          throw new Error("unrecognized type");
      }
    }

    for (const _item0 of this.images) {
      _item0.hash(_hasher);
    }

    this.jobTitle.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.memberOf) {
      _item0.hash(_hasher);
    }

    for (const _item0 of this.performerIn) {
      _item0.hash(_hasher);
    }

    return _hasher;
  }

  override toJson(): Person.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        birthDate: this.birthDate
          .map((_item) => _item.toISOString().replace(/T.*$/, ""))
          .extract(),
        familyName: this.familyName.map((_item) => _item).extract(),
        gender: this.gender
          .map((_item) =>
            _item.termType === "Literal"
              ? {
                  "@language":
                    _item.language.length > 0 ? _item.language : undefined,
                  "@type":
                    _item.datatype.value !==
                    "http://www.w3.org/2001/XMLSchema#string"
                      ? _item.datatype.value
                      : undefined,
                  "@value": _item.value,
                  termType: "Literal" as const,
                }
              : _item.termType === "NamedNode"
                ? { "@id": _item.value, termType: "NamedNode" as const }
                : { "@id": `_:${_item.value}`, termType: "BlankNode" as const },
          )
          .extract(),
        givenName: this.givenName.map((_item) => _item).extract(),
        hasOccupation: this.hasOccupation.map((_item) =>
          _item.type === "Role" ? _item.toJson() : _item.toJson(),
        ),
        images: this.images.map((_item) => _item.toJson()),
        jobTitle: this.jobTitle.map((_item) => _item).extract(),
        memberOf: this.memberOf.map((_item) => _item.toJson()),
        performerIn: this.performerIn.map((_item) => _item.toJson()),
      } satisfies Person.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Person"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/birthDate"),
      this.birthDate.map((_value) =>
        rdfLiteral.toRdf(_value, {
          dataFactory,
          datatype: dataFactory.namedNode(
            "http://www.w3.org/2001/XMLSchema#date",
          ),
        }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/familyName"),
      this.familyName,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/gender"),
      this.gender,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/givenName"),
      this.givenName,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/hasOccupation"),
      this.hasOccupation.map((_item) =>
        _item.type === "Role"
          ? _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet })
          : _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/image"),
      this.images.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/jobTitle"),
      this.jobTitle,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/memberOf"),
      this.memberOf.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/performerIn"),
      this.performerIn.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Person {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Person",
  );
  export type Json = {
    readonly birthDate: string | undefined;
    readonly familyName: string | undefined;
    readonly gender:
      | (
          | {
              readonly "@id": string;
              readonly termType: "BlankNode" | "NamedNode";
            }
          | {
              readonly "@language": string | undefined;
              readonly "@type": string | undefined;
              readonly "@value": string;
              readonly termType: "Literal";
            }
        )
      | undefined;
    readonly givenName: string | undefined;
    readonly hasOccupation: readonly (Occupation.Json | Role.Json)[];
    readonly images: readonly ImageObject.Json[];
    readonly jobTitle: string | undefined;
    readonly memberOf: readonly OrganizationStubStatic.Json[];
    readonly performerIn: readonly EventStubStatic.Json[];
  } & ThingStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      birthDate: purify.Maybe<Date>;
      familyName: purify.Maybe<string>;
      gender: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>;
      givenName: purify.Maybe<string>;
      hasOccupation: readonly (Occupation | Role)[];
      images: readonly ImageObject[];
      jobTitle: purify.Maybe<string>;
      memberOf: OrganizationStub[];
      performerIn: EventStub[];
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const birthDate = purify.Maybe.fromNullable(_jsonObject["birthDate"]).map(
      (_item) => new Date(_item),
    );
    const familyName = purify.Maybe.fromNullable(_jsonObject["familyName"]);
    const gender = purify.Maybe.fromNullable(_jsonObject["gender"]).map(
      (_item) =>
        _item.termType === "Literal"
          ? dataFactory.literal(
              _item["@value"],
              typeof _item["@language"] !== "undefined"
                ? _item["@language"]
                : typeof _item["@type"] !== "undefined"
                  ? dataFactory.namedNode(_item["@type"])
                  : undefined,
            )
          : _item.termType === "NamedNode"
            ? dataFactory.namedNode(_item["@id"])
            : dataFactory.blankNode(_item["@id"].substring(2)),
    );
    const givenName = purify.Maybe.fromNullable(_jsonObject["givenName"]);
    const hasOccupation = _jsonObject["hasOccupation"].map((_item) =>
      _item.type === "Role"
        ? Role.fromJson(_item).unsafeCoerce()
        : Occupation.fromJson(_item).unsafeCoerce(),
    );
    const images = _jsonObject["images"].map((_item) =>
      ImageObject.fromJson(_item).unsafeCoerce(),
    );
    const jobTitle = purify.Maybe.fromNullable(_jsonObject["jobTitle"]);
    const memberOf = _jsonObject["memberOf"].map((_item) =>
      OrganizationStubStatic.fromJson(_item).unsafeCoerce(),
    );
    const performerIn = _jsonObject["performerIn"].map((_item) =>
      EventStubStatic.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      birthDate,
      familyName,
      gender,
      givenName,
      hasOccupation,
      images,
      jobTitle,
      memberOf,
      performerIn,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Person> {
    return propertiesFromJson(json).map((properties) => new Person(properties));
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/birthDate`, type: "Control" },
        { scope: `${scopePrefix}/properties/familyName`, type: "Control" },
        { scope: `${scopePrefix}/properties/gender`, type: "Control" },
        { scope: `${scopePrefix}/properties/givenName`, type: "Control" },
        { scope: `${scopePrefix}/properties/hasOccupation`, type: "Control" },
        ImageObject.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/images`,
        }),
        { scope: `${scopePrefix}/properties/jobTitle`, type: "Control" },
        OrganizationStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/memberOf`,
        }),
        EventStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/performerIn`,
        }),
      ],
      label: "Person",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Person"),
        birthDate: zod.string().date().optional(),
        familyName: zod.string().optional(),
        gender: zod
          .discriminatedUnion("termType", [
            zod.object({
              "@id": zod.string().min(1),
              termType: zod.literal("BlankNode"),
            }),
            zod.object({
              "@id": zod.string().min(1),
              termType: zod.literal("NamedNode"),
            }),
            zod.object({
              "@language": zod.string().optional(),
              "@type": zod.string().optional(),
              "@value": zod.string(),
              termType: zod.literal("Literal"),
            }),
          ])
          .optional(),
        givenName: zod.string().optional(),
        hasOccupation: zod
          .discriminatedUnion("type", [
            Occupation.jsonZodSchema(),
            Role.jsonZodSchema(),
          ])
          .array()
          .default(() => []),
        images: ImageObject.jsonZodSchema()
          .array()
          .default(() => []),
        jobTitle: zod.string().optional(),
        memberOf: OrganizationStubStatic.jsonZodSchema()
          .array()
          .default(() => []),
        performerIn: EventStubStatic.jsonZodSchema()
          .array()
          .default(() => []),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      birthDate: purify.Maybe<Date>;
      familyName: purify.Maybe<string>;
      gender: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>;
      givenName: purify.Maybe<string>;
      hasOccupation: readonly (Occupation | Role)[];
      images: readonly ImageObject[];
      jobTitle: purify.Maybe<string>;
      memberOf: OrganizationStub[];
      performerIn: EventStub[];
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromRdf>>
  > {
    const _super0Either = ThingStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Person"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Person)`,
          predicate: dataFactory.namedNode("http://schema.org/Person"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _birthDateEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<Date>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/birthDate"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toDate())
        .toMaybe(),
    );
    if (_birthDateEither.isLeft()) {
      return _birthDateEither;
    }

    const birthDate = _birthDateEither.unsafeCoerce();
    const _familyNameEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/familyName"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_familyNameEither.isLeft()) {
      return _familyNameEither;
    }

    const familyName = _familyNameEither.unsafeCoerce();
    const _genderEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/gender"), {
          unique: true,
        })
        .head()
        .chain((_value) => purify.Either.of(_value.toTerm()))
        .toMaybe(),
    );
    if (_genderEither.isLeft()) {
      return _genderEither;
    }

    const gender = _genderEither.unsafeCoerce();
    const _givenNameEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/givenName"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_givenNameEither.isLeft()) {
      return _givenNameEither;
    }

    const givenName = _givenNameEither.unsafeCoerce();
    const _hasOccupationEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly (Occupation | Role)[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/hasOccupation"), {
          unique: true,
        })
        .flatMap((_item) =>
          (
            _item
              .toValues()
              .head()
              .chain((value) => value.toResource())
              .chain((_resource) =>
                Occupation.fromRdf({
                  ..._context,
                  languageIn: _languageIn,
                  resource: _resource,
                }),
              ) as purify.Either<
              rdfjsResource.Resource.ValueError,
              Occupation | Role
            >
          )
            .altLazy(
              () =>
                _item
                  .toValues()
                  .head()
                  .chain((value) => value.toResource())
                  .chain((_resource) =>
                    Role.fromRdf({
                      ..._context,
                      languageIn: _languageIn,
                      resource: _resource,
                    }),
                  ) as purify.Either<
                  rdfjsResource.Resource.ValueError,
                  Occupation | Role
                >,
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_hasOccupationEither.isLeft()) {
      return _hasOccupationEither;
    }

    const hasOccupation = _hasOccupationEither.unsafeCoerce();
    const _imagesEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly ImageObject[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/image"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              ImageObject.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_imagesEither.isLeft()) {
      return _imagesEither;
    }

    const images = _imagesEither.unsafeCoerce();
    const _jobTitleEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/jobTitle"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_jobTitleEither.isLeft()) {
      return _jobTitleEither;
    }

    const jobTitle = _jobTitleEither.unsafeCoerce();
    const _memberOfEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      OrganizationStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/memberOf"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              OrganizationStubStatic.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_memberOfEither.isLeft()) {
      return _memberOfEither;
    }

    const memberOf = _memberOfEither.unsafeCoerce();
    const _performerInEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      EventStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/performerIn"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              EventStubStatic.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_performerInEither.isLeft()) {
      return _performerInEither;
    }

    const performerIn = _performerInEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      birthDate,
      familyName,
      gender,
      givenName,
      hasOccupation,
      images,
      jobTitle,
      memberOf,
      performerIn,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof Person.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Person> {
    return Person.propertiesFromRdf(parameters).map(
      (properties) => new Person(properties),
    );
  }

  export const rdfProperties = [
    ...ThingStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/birthDate") },
    { path: dataFactory.namedNode("http://schema.org/familyName") },
    { path: dataFactory.namedNode("http://schema.org/gender") },
    { path: dataFactory.namedNode("http://schema.org/givenName") },
    { path: dataFactory.namedNode("http://schema.org/hasOccupation") },
    { path: dataFactory.namedNode("http://schema.org/image") },
    { path: dataFactory.namedNode("http://schema.org/jobTitle") },
    { path: dataFactory.namedNode("http://schema.org/memberOf") },
    { path: dataFactory.namedNode("http://schema.org/performerIn") },
  ];
}
export class Organization extends Thing {
  override readonly type: "Organization" | "MusicGroup" | "PerformingGroup" =
    "Organization";
  members: AgentStub[];
  parentOrganizations: OrganizationStub[];
  subOrganizations: OrganizationStub[];

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly members?: readonly AgentStub[];
      readonly parentOrganizations?: readonly OrganizationStub[];
      readonly subOrganizations?: readonly OrganizationStub[];
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
    if (typeof parameters.members === "undefined") {
      this.members = [];
    } else if (Array.isArray(parameters.members)) {
      this.members = parameters.members;
    } else {
      this.members = parameters.members as never;
    }

    if (typeof parameters.parentOrganizations === "undefined") {
      this.parentOrganizations = [];
    } else if (Array.isArray(parameters.parentOrganizations)) {
      this.parentOrganizations = parameters.parentOrganizations;
    } else {
      this.parentOrganizations = parameters.parentOrganizations as never;
    }

    if (typeof parameters.subOrganizations === "undefined") {
      this.subOrganizations = [];
    } else if (Array.isArray(parameters.subOrganizations)) {
      this.subOrganizations = parameters.subOrganizations;
    } else {
      this.subOrganizations = parameters.subOrganizations as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Organization): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $arrayEquals(left, right, AgentStub.equals))(
          this.members,
          other.members,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "members",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.parentOrganizations,
          other.parentOrganizations,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "parentOrganizations",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.subOrganizations,
          other.subOrganizations,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "subOrganizations",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    for (const _item0 of this.members) {
      _item0.hash(_hasher);
    }

    for (const _item0 of this.parentOrganizations) {
      _item0.hash(_hasher);
    }

    for (const _item0 of this.subOrganizations) {
      _item0.hash(_hasher);
    }

    return _hasher;
  }

  override toJson(): OrganizationStatic.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        members: this.members.map((_item) => _item.toJson()),
        parentOrganizations: this.parentOrganizations.map((_item) =>
          _item.toJson(),
        ),
        subOrganizations: this.subOrganizations.map((_item) => _item.toJson()),
      } satisfies OrganizationStatic.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Organization"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/member"),
      this.members.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/parentOrganization"),
      this.parentOrganizations.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/subOrganization"),
      this.subOrganizations.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace OrganizationStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Organization",
  );
  export type Json = {
    readonly members: readonly (
      | OrganizationStubStatic.Json
      | PersonStub.Json
    )[];
    readonly parentOrganizations: readonly OrganizationStubStatic.Json[];
    readonly subOrganizations: readonly OrganizationStubStatic.Json[];
  } & ThingStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      members: AgentStub[];
      parentOrganizations: OrganizationStub[];
      subOrganizations: OrganizationStub[];
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const members = _jsonObject["members"].map((_item) =>
      AgentStub.fromJson(_item).unsafeCoerce(),
    );
    const parentOrganizations = _jsonObject["parentOrganizations"].map(
      (_item) => OrganizationStubStatic.fromJson(_item).unsafeCoerce(),
    );
    const subOrganizations = _jsonObject["subOrganizations"].map((_item) =>
      OrganizationStubStatic.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({
      ..._super0,
      identifier,
      members,
      parentOrganizations,
      subOrganizations,
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Organization> {
    return (
      PerformingGroupStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        Organization
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new Organization(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/members`, type: "Control" },
        OrganizationStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/parentOrganizations`,
        }),
        OrganizationStubStatic.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/subOrganizations`,
        }),
      ],
      label: "Organization",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["Organization", "MusicGroup", "PerformingGroup"]),
        members: AgentStub.jsonZodSchema()
          .array()
          .default(() => []),
        parentOrganizations: OrganizationStubStatic.jsonZodSchema()
          .array()
          .default(() => []),
        subOrganizations: OrganizationStubStatic.jsonZodSchema()
          .array()
          .default(() => []),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      members: AgentStub[];
      parentOrganizations: OrganizationStub[];
      subOrganizations: OrganizationStub[];
    } & $UnwrapR<ReturnType<typeof ThingStatic.propertiesFromRdf>>
  > {
    const _super0Either = ThingStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Organization"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Organization)`,
          predicate: dataFactory.namedNode("http://schema.org/Organization"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _membersEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      AgentStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/member"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              AgentStub.fromRdf({
                ..._context,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_membersEither.isLeft()) {
      return _membersEither;
    }

    const members = _membersEither.unsafeCoerce();
    const _parentOrganizationsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      OrganizationStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/parentOrganization"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              OrganizationStubStatic.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_parentOrganizationsEither.isLeft()) {
      return _parentOrganizationsEither;
    }

    const parentOrganizations = _parentOrganizationsEither.unsafeCoerce();
    const _subOrganizationsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      OrganizationStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/subOrganization"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              OrganizationStubStatic.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_subOrganizationsEither.isLeft()) {
      return _subOrganizationsEither;
    }

    const subOrganizations = _subOrganizationsEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      members,
      parentOrganizations,
      subOrganizations,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof OrganizationStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Organization> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      PerformingGroupStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Organization
      >
    ).altLazy(() =>
      OrganizationStatic.propertiesFromRdf(parameters).map(
        (properties) => new Organization(properties),
      ),
    );
  }

  export const rdfProperties = [
    ...ThingStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/member") },
    { path: dataFactory.namedNode("http://schema.org/parentOrganization") },
    { path: dataFactory.namedNode("http://schema.org/subOrganization") },
  ];
}
export class PerformingGroup extends Organization {
  override readonly type: "PerformingGroup" | "MusicGroup" = "PerformingGroup";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Organization>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/PerformingGroup"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace PerformingGroupStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/PerformingGroup",
  );
  export type Json = OrganizationStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof OrganizationStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = OrganizationStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, PerformingGroup> {
    return (
      MusicGroup.fromJson(json) as purify.Either<zod.ZodError, PerformingGroup>
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new PerformingGroup(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [OrganizationStatic.jsonUiSchema({ scopePrefix })],
      label: "PerformingGroup",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return OrganizationStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["PerformingGroup", "MusicGroup"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof OrganizationStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = OrganizationStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/PerformingGroup"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/PerformingGroup)`,
          predicate: dataFactory.namedNode("http://schema.org/PerformingGroup"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof PerformingGroupStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PerformingGroup> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      MusicGroup.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        PerformingGroup
      >
    ).altLazy(() =>
      PerformingGroupStatic.propertiesFromRdf(parameters).map(
        (properties) => new PerformingGroup(properties),
      ),
    );
  }

  export const rdfProperties = [...OrganizationStatic.rdfProperties];
}
export class Order extends Intangible {
  override readonly type = "Order";
  readonly partOfInvoice: purify.Maybe<InvoiceStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly partOfInvoice?: InvoiceStub | purify.Maybe<InvoiceStub>;
    } & ConstructorParameters<typeof Intangible>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.partOfInvoice)) {
      this.partOfInvoice = parameters.partOfInvoice;
    } else if (
      typeof parameters.partOfInvoice === "object" &&
      parameters.partOfInvoice instanceof InvoiceStub
    ) {
      this.partOfInvoice = purify.Maybe.of(parameters.partOfInvoice);
    } else if (typeof parameters.partOfInvoice === "undefined") {
      this.partOfInvoice = purify.Maybe.empty();
    } else {
      this.partOfInvoice = parameters.partOfInvoice as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Order): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.partOfInvoice,
          other.partOfInvoice,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "partOfInvoice",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.partOfInvoice.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): Order.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        partOfInvoice: this.partOfInvoice
          .map((_item) => _item.toJson())
          .extract(),
      } satisfies Order.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Order"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/partOfInvoice"),
      this.partOfInvoice.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Order {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Order",
  );
  export type Json = {
    readonly partOfInvoice: InvoiceStub.Json | undefined;
  } & IntangibleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      partOfInvoice: purify.Maybe<InvoiceStub>;
    } & $UnwrapR<ReturnType<typeof IntangibleStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const partOfInvoice = purify.Maybe.fromNullable(
      _jsonObject["partOfInvoice"],
    ).map((_item) => InvoiceStub.fromJson(_item).unsafeCoerce());
    return purify.Either.of({ ..._super0, identifier, partOfInvoice });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Order> {
    return propertiesFromJson(json).map((properties) => new Order(properties));
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        IntangibleStatic.jsonUiSchema({ scopePrefix }),
        InvoiceStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/partOfInvoice`,
        }),
      ],
      label: "Order",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Order"),
        partOfInvoice: InvoiceStub.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      partOfInvoice: purify.Maybe<InvoiceStub>;
    } & $UnwrapR<ReturnType<typeof IntangibleStatic.propertiesFromRdf>>
  > {
    const _super0Either = IntangibleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Order"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Order)`,
          predicate: dataFactory.namedNode("http://schema.org/Order"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _partOfInvoiceEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<InvoiceStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/partOfInvoice"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          InvoiceStub.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_partOfInvoiceEither.isLeft()) {
      return _partOfInvoiceEither;
    }

    const partOfInvoice = _partOfInvoiceEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, partOfInvoice });
  }

  export function fromRdf(
    parameters: Parameters<typeof Order.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Order> {
    return Order.propertiesFromRdf(parameters).map(
      (properties) => new Order(properties),
    );
  }

  export const rdfProperties = [
    ...IntangibleStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/partOfInvoice") },
  ];
}
export class OrderStub extends IntangibleStub {
  override readonly type = "OrderStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof IntangibleStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Order"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace OrderStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Order",
  );
  export type Json = IntangibleStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, OrderStub> {
    return propertiesFromJson(json).map(
      (properties) => new OrderStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStubStatic.jsonUiSchema({ scopePrefix })],
      label: "OrderStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("OrderStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Order"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Order)`,
          predicate: dataFactory.namedNode("http://schema.org/Order"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof OrderStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, OrderStub> {
    return OrderStub.propertiesFromRdf(parameters).map(
      (properties) => new OrderStub(properties),
    );
  }

  export const rdfProperties = [...IntangibleStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        OrderStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        OrderStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      OrderStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("orderStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "orderStub");
    return [
      ...IntangibleStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("orderStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "orderStub");
    return [
      ...IntangibleStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Order"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class MusicRecording extends CreativeWork {
  override readonly type = "MusicRecording";
  readonly byArtist: purify.Maybe<
    rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal
  >;
  readonly inAlbum: purify.Maybe<MusicAlbumStub>;
  readonly recordingOf: purify.Maybe<MusicCompositionStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly byArtist?:
        | (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)
        | Date
        | boolean
        | number
        | purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>
        | string;
      readonly inAlbum?: MusicAlbumStub | purify.Maybe<MusicAlbumStub>;
      readonly recordingOf?:
        | MusicCompositionStub
        | purify.Maybe<MusicCompositionStub>;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.byArtist)) {
      this.byArtist = parameters.byArtist;
    } else if (typeof parameters.byArtist === "boolean") {
      this.byArtist = purify.Maybe.of(
        rdfLiteral.toRdf(parameters.byArtist, { dataFactory }),
      );
    } else if (
      typeof parameters.byArtist === "object" &&
      parameters.byArtist instanceof Date
    ) {
      this.byArtist = purify.Maybe.of(
        rdfLiteral.toRdf(parameters.byArtist, { dataFactory }),
      );
    } else if (typeof parameters.byArtist === "number") {
      this.byArtist = purify.Maybe.of(
        rdfLiteral.toRdf(parameters.byArtist, { dataFactory }),
      );
    } else if (typeof parameters.byArtist === "string") {
      this.byArtist = purify.Maybe.of(dataFactory.literal(parameters.byArtist));
    } else if (typeof parameters.byArtist === "object") {
      this.byArtist = purify.Maybe.of(parameters.byArtist);
    } else if (typeof parameters.byArtist === "undefined") {
      this.byArtist = purify.Maybe.empty();
    } else {
      this.byArtist = parameters.byArtist as never;
    }

    if (purify.Maybe.isMaybe(parameters.inAlbum)) {
      this.inAlbum = parameters.inAlbum;
    } else if (
      typeof parameters.inAlbum === "object" &&
      parameters.inAlbum instanceof MusicAlbumStub
    ) {
      this.inAlbum = purify.Maybe.of(parameters.inAlbum);
    } else if (typeof parameters.inAlbum === "undefined") {
      this.inAlbum = purify.Maybe.empty();
    } else {
      this.inAlbum = parameters.inAlbum as never;
    }

    if (purify.Maybe.isMaybe(parameters.recordingOf)) {
      this.recordingOf = parameters.recordingOf;
    } else if (
      typeof parameters.recordingOf === "object" &&
      parameters.recordingOf instanceof MusicCompositionStub
    ) {
      this.recordingOf = purify.Maybe.of(parameters.recordingOf);
    } else if (typeof parameters.recordingOf === "undefined") {
      this.recordingOf = purify.Maybe.empty();
    } else {
      this.recordingOf = parameters.recordingOf as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: MusicRecording): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $booleanEquals))(
          this.byArtist,
          other.byArtist,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "byArtist",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.inAlbum,
          other.inAlbum,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "inAlbum",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.recordingOf,
          other.recordingOf,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "recordingOf",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.byArtist.ifJust((_value0) => {
      _hasher.update(_value0.termType);
      _hasher.update(_value0.value);
    });
    this.inAlbum.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    this.recordingOf.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): MusicRecording.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        byArtist: this.byArtist
          .map((_item) =>
            _item.termType === "Literal"
              ? {
                  "@language":
                    _item.language.length > 0 ? _item.language : undefined,
                  "@type":
                    _item.datatype.value !==
                    "http://www.w3.org/2001/XMLSchema#string"
                      ? _item.datatype.value
                      : undefined,
                  "@value": _item.value,
                  termType: "Literal" as const,
                }
              : _item.termType === "NamedNode"
                ? { "@id": _item.value, termType: "NamedNode" as const }
                : { "@id": `_:${_item.value}`, termType: "BlankNode" as const },
          )
          .extract(),
        inAlbum: this.inAlbum.map((_item) => _item.toJson()).extract(),
        recordingOf: this.recordingOf.map((_item) => _item.toJson()).extract(),
      } satisfies MusicRecording.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicRecording"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/byArtist"),
      this.byArtist,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/inAlbum"),
      this.inAlbum.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/recordingOf"),
      this.recordingOf.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicRecording {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicRecording",
  );
  export type Json = {
    readonly byArtist:
      | (
          | {
              readonly "@id": string;
              readonly termType: "BlankNode" | "NamedNode";
            }
          | {
              readonly "@language": string | undefined;
              readonly "@type": string | undefined;
              readonly "@value": string;
              readonly termType: "Literal";
            }
        )
      | undefined;
    readonly inAlbum: MusicAlbumStub.Json | undefined;
    readonly recordingOf: MusicCompositionStub.Json | undefined;
  } & CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      byArtist: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>;
      inAlbum: purify.Maybe<MusicAlbumStub>;
      recordingOf: purify.Maybe<MusicCompositionStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const byArtist = purify.Maybe.fromNullable(_jsonObject["byArtist"]).map(
      (_item) =>
        _item.termType === "Literal"
          ? dataFactory.literal(
              _item["@value"],
              typeof _item["@language"] !== "undefined"
                ? _item["@language"]
                : typeof _item["@type"] !== "undefined"
                  ? dataFactory.namedNode(_item["@type"])
                  : undefined,
            )
          : _item.termType === "NamedNode"
            ? dataFactory.namedNode(_item["@id"])
            : dataFactory.blankNode(_item["@id"].substring(2)),
    );
    const inAlbum = purify.Maybe.fromNullable(_jsonObject["inAlbum"]).map(
      (_item) => MusicAlbumStub.fromJson(_item).unsafeCoerce(),
    );
    const recordingOf = purify.Maybe.fromNullable(
      _jsonObject["recordingOf"],
    ).map((_item) => MusicCompositionStub.fromJson(_item).unsafeCoerce());
    return purify.Either.of({
      ..._super0,
      identifier,
      byArtist,
      inAlbum,
      recordingOf,
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicRecording> {
    return propertiesFromJson(json).map(
      (properties) => new MusicRecording(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/byArtist`, type: "Control" },
        MusicAlbumStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/inAlbum`,
        }),
        MusicCompositionStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/recordingOf`,
        }),
      ],
      label: "MusicRecording",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicRecording"),
        byArtist: zod
          .discriminatedUnion("termType", [
            zod.object({
              "@id": zod.string().min(1),
              termType: zod.literal("BlankNode"),
            }),
            zod.object({
              "@id": zod.string().min(1),
              termType: zod.literal("NamedNode"),
            }),
            zod.object({
              "@language": zod.string().optional(),
              "@type": zod.string().optional(),
              "@value": zod.string(),
              termType: zod.literal("Literal"),
            }),
          ])
          .optional(),
        inAlbum: MusicAlbumStub.jsonZodSchema().optional(),
        recordingOf: MusicCompositionStub.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      byArtist: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>;
      inAlbum: purify.Maybe<MusicAlbumStub>;
      recordingOf: purify.Maybe<MusicCompositionStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>>
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicRecording"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicRecording)`,
          predicate: dataFactory.namedNode("http://schema.org/MusicRecording"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _byArtistEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/byArtist"), {
          unique: true,
        })
        .head()
        .chain((_value) => purify.Either.of(_value.toTerm()))
        .toMaybe(),
    );
    if (_byArtistEither.isLeft()) {
      return _byArtistEither;
    }

    const byArtist = _byArtistEither.unsafeCoerce();
    const _inAlbumEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<MusicAlbumStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/inAlbum"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          MusicAlbumStub.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_inAlbumEither.isLeft()) {
      return _inAlbumEither;
    }

    const inAlbum = _inAlbumEither.unsafeCoerce();
    const _recordingOfEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<MusicCompositionStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/recordingOf"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          MusicCompositionStub.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_recordingOfEither.isLeft()) {
      return _recordingOfEither;
    }

    const recordingOf = _recordingOfEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      byArtist,
      inAlbum,
      recordingOf,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicRecording.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicRecording> {
    return MusicRecording.propertiesFromRdf(parameters).map(
      (properties) => new MusicRecording(properties),
    );
  }

  export const rdfProperties = [
    ...CreativeWorkStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/byArtist") },
    { path: dataFactory.namedNode("http://schema.org/inAlbum") },
    { path: dataFactory.namedNode("http://schema.org/recordingOf") },
  ];
}
export class MusicRecordingStub extends CreativeWorkStub {
  override readonly type = "MusicRecordingStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicRecording"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicRecordingStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicRecording",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicRecordingStub> {
    return propertiesFromJson(json).map(
      (properties) => new MusicRecordingStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "MusicRecordingStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicRecordingStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicRecording"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicRecording)`,
          predicate: dataFactory.namedNode("http://schema.org/MusicRecording"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicRecordingStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicRecordingStub> {
    return MusicRecordingStub.propertiesFromRdf(parameters).map(
      (properties) => new MusicRecordingStub(properties),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        MusicRecordingStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MusicRecordingStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      MusicRecordingStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicRecordingStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "musicRecordingStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicRecordingStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "musicRecordingStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/MusicRecording",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class OrganizationStub extends ThingStub {
  override readonly type:
    | "OrganizationStub"
    | "MusicGroupStub"
    | "PerformingGroupStub" = "OrganizationStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Organization"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace OrganizationStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Organization",
  );
  export type Json = ThingStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, OrganizationStub> {
    return (
      PerformingGroupStubStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        OrganizationStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new OrganizationStub(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStubStatic.jsonUiSchema({ scopePrefix })],
      label: "OrganizationStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "OrganizationStub",
          "MusicGroupStub",
          "PerformingGroupStub",
        ]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof ThingStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Organization"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Organization)`,
          predicate: dataFactory.namedNode("http://schema.org/Organization"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof OrganizationStubStatic.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, OrganizationStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      PerformingGroupStubStatic.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        OrganizationStub
      >
    ).altLazy(() =>
      OrganizationStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new OrganizationStub(properties),
      ),
    );
  }

  export const rdfProperties = [...ThingStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        OrganizationStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        OrganizationStubStatic.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      OrganizationStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("organizationStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "organizationStub");
    return [
      ...ThingStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("organizationStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "organizationStub");
    return [
      ...ThingStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/Organization",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class PerformingGroupStub extends OrganizationStub {
  override readonly type: "PerformingGroupStub" | "MusicGroupStub" =
    "PerformingGroupStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof OrganizationStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/PerformingGroup"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace PerformingGroupStubStatic {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/PerformingGroup",
  );
  export type Json = OrganizationStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof OrganizationStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      OrganizationStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, PerformingGroupStub> {
    return (
      MusicGroupStub.fromJson(json) as purify.Either<
        zod.ZodError,
        PerformingGroupStub
      >
    ).altLazy(() =>
      propertiesFromJson(json).map(
        (properties) => new PerformingGroupStub(properties),
      ),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [OrganizationStubStatic.jsonUiSchema({ scopePrefix })],
      label: "PerformingGroupStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return OrganizationStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["PerformingGroupStub", "MusicGroupStub"]),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof OrganizationStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = OrganizationStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/PerformingGroup"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/PerformingGroup)`,
          predicate: dataFactory.namedNode("http://schema.org/PerformingGroup"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<
      typeof PerformingGroupStubStatic.propertiesFromRdf
    >[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PerformingGroupStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      MusicGroupStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        PerformingGroupStub
      >
    ).altLazy(() =>
      PerformingGroupStubStatic.propertiesFromRdf(parameters).map(
        (properties) => new PerformingGroupStub(properties),
      ),
    );
  }

  export const rdfProperties = [...OrganizationStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        PerformingGroupStubStatic.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        PerformingGroupStubStatic.sparqlWherePatterns({
          ignoreRdfType,
          subject,
        }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      PerformingGroupStubStatic.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("performingGroupStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "performingGroupStub");
    return [
      ...OrganizationStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("performingGroupStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "performingGroupStub");
    return [
      ...OrganizationStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/PerformingGroup",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class MusicGroup extends PerformingGroup {
  override readonly type = "MusicGroup";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof PerformingGroup>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicGroup"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicGroup {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicGroup",
  );
  export type Json = PerformingGroupStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof PerformingGroupStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = PerformingGroupStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicGroup> {
    return propertiesFromJson(json).map(
      (properties) => new MusicGroup(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [PerformingGroupStatic.jsonUiSchema({ scopePrefix })],
      label: "MusicGroup",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return PerformingGroupStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicGroup"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof PerformingGroupStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = PerformingGroupStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicGroup"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicGroup)`,
          predicate: dataFactory.namedNode("http://schema.org/MusicGroup"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicGroup.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicGroup> {
    return MusicGroup.propertiesFromRdf(parameters).map(
      (properties) => new MusicGroup(properties),
    );
  }

  export const rdfProperties = [...PerformingGroupStatic.rdfProperties];
}
export class MusicGroupStub extends PerformingGroupStub {
  override readonly type = "MusicGroupStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof PerformingGroupStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicGroup"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicGroupStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicGroup",
  );
  export type Json = PerformingGroupStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof PerformingGroupStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      PerformingGroupStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicGroupStub> {
    return propertiesFromJson(json).map(
      (properties) => new MusicGroupStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [PerformingGroupStubStatic.jsonUiSchema({ scopePrefix })],
      label: "MusicGroupStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return PerformingGroupStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicGroupStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof PerformingGroupStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = PerformingGroupStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicGroup"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicGroup)`,
          predicate: dataFactory.namedNode("http://schema.org/MusicGroup"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicGroupStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicGroupStub> {
    return MusicGroupStub.propertiesFromRdf(parameters).map(
      (properties) => new MusicGroupStub(properties),
    );
  }

  export const rdfProperties = [...PerformingGroupStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        MusicGroupStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MusicGroupStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      MusicGroupStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicGroupStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "musicGroupStub");
    return [
      ...PerformingGroupStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicGroupStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "musicGroupStub");
    return [
      ...PerformingGroupStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/MusicGroup"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class MusicComposition extends CreativeWork {
  override readonly type = "MusicComposition";
  readonly recordedAs: purify.Maybe<MusicRecordingStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly recordedAs?:
        | MusicRecordingStub
        | purify.Maybe<MusicRecordingStub>;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.recordedAs)) {
      this.recordedAs = parameters.recordedAs;
    } else if (
      typeof parameters.recordedAs === "object" &&
      parameters.recordedAs instanceof MusicRecordingStub
    ) {
      this.recordedAs = purify.Maybe.of(parameters.recordedAs);
    } else if (typeof parameters.recordedAs === "undefined") {
      this.recordedAs = purify.Maybe.empty();
    } else {
      this.recordedAs = parameters.recordedAs as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: MusicComposition): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.recordedAs,
          other.recordedAs,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "recordedAs",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.recordedAs.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): MusicComposition.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        recordedAs: this.recordedAs.map((_item) => _item.toJson()).extract(),
      } satisfies MusicComposition.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicComposition"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/recordedAs"),
      this.recordedAs.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicComposition {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicComposition",
  );
  export type Json = {
    readonly recordedAs: MusicRecordingStub.Json | undefined;
  } & CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      recordedAs: purify.Maybe<MusicRecordingStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const recordedAs = purify.Maybe.fromNullable(_jsonObject["recordedAs"]).map(
      (_item) => MusicRecordingStub.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({ ..._super0, identifier, recordedAs });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicComposition> {
    return propertiesFromJson(json).map(
      (properties) => new MusicComposition(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStatic.jsonUiSchema({ scopePrefix }),
        MusicRecordingStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/recordedAs`,
        }),
      ],
      label: "MusicComposition",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicComposition"),
        recordedAs: MusicRecordingStub.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      recordedAs: purify.Maybe<MusicRecordingStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>>
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicComposition"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicComposition)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/MusicComposition",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _recordedAsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<MusicRecordingStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/recordedAs"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          MusicRecordingStub.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_recordedAsEither.isLeft()) {
      return _recordedAsEither;
    }

    const recordedAs = _recordedAsEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, recordedAs });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicComposition.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicComposition> {
    return MusicComposition.propertiesFromRdf(parameters).map(
      (properties) => new MusicComposition(properties),
    );
  }

  export const rdfProperties = [
    ...CreativeWorkStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/recordedAs") },
  ];
}
export class MusicCompositionStub extends CreativeWorkStub {
  override readonly type = "MusicCompositionStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicComposition"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicCompositionStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicComposition",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicCompositionStub> {
    return propertiesFromJson(json).map(
      (properties) => new MusicCompositionStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "MusicCompositionStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicCompositionStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicComposition"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicComposition)`,
          predicate: dataFactory.namedNode(
            "http://schema.org/MusicComposition",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicCompositionStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicCompositionStub> {
    return MusicCompositionStub.propertiesFromRdf(parameters).map(
      (properties) => new MusicCompositionStub(properties),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        MusicCompositionStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MusicCompositionStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      MusicCompositionStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicCompositionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "musicCompositionStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicCompositionStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable"
        ? subject.value
        : "musicCompositionStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/MusicComposition",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class MusicAlbum extends CreativeWork {
  override readonly type = "MusicAlbum";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicAlbum"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicAlbum {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicAlbum",
  );
  export type Json = CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicAlbum> {
    return propertiesFromJson(json).map(
      (properties) => new MusicAlbum(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStatic.jsonUiSchema({ scopePrefix })],
      label: "MusicAlbum",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicAlbum"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicAlbum"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicAlbum)`,
          predicate: dataFactory.namedNode("http://schema.org/MusicAlbum"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicAlbum.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicAlbum> {
    return MusicAlbum.propertiesFromRdf(parameters).map(
      (properties) => new MusicAlbum(properties),
    );
  }

  export const rdfProperties = [...CreativeWorkStatic.rdfProperties];
}
export class MusicAlbumStub extends CreativeWorkStub {
  override readonly type = "MusicAlbumStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MusicAlbum"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MusicAlbumStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MusicAlbum",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MusicAlbumStub> {
    return propertiesFromJson(json).map(
      (properties) => new MusicAlbumStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "MusicAlbumStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MusicAlbumStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MusicAlbum"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MusicAlbum)`,
          predicate: dataFactory.namedNode("http://schema.org/MusicAlbum"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MusicAlbumStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MusicAlbumStub> {
    return MusicAlbumStub.propertiesFromRdf(parameters).map(
      (properties) => new MusicAlbumStub(properties),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        MusicAlbumStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MusicAlbumStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      MusicAlbumStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicAlbumStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "musicAlbumStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("musicAlbumStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "musicAlbumStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/MusicAlbum"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class MonetaryAmount extends StructuredValue {
  override readonly type = "MonetaryAmount";
  readonly currency: purify.Maybe<string>;
  readonly value: purify.Maybe<number>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly currency?: purify.Maybe<string> | string;
      readonly value?: number | purify.Maybe<number>;
    } & ConstructorParameters<typeof StructuredValue>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.currency)) {
      this.currency = parameters.currency;
    } else if (typeof parameters.currency === "string") {
      this.currency = purify.Maybe.of(parameters.currency);
    } else if (typeof parameters.currency === "undefined") {
      this.currency = purify.Maybe.empty();
    } else {
      this.currency = parameters.currency as never;
    }

    if (purify.Maybe.isMaybe(parameters.value)) {
      this.value = parameters.value;
    } else if (typeof parameters.value === "number") {
      this.value = purify.Maybe.of(parameters.value);
    } else if (typeof parameters.value === "undefined") {
      this.value = purify.Maybe.empty();
    } else {
      this.value = parameters.value as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: MonetaryAmount): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.currency,
          other.currency,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "currency",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.value,
          other.value,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "value",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.currency.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.value.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    return _hasher;
  }

  override toJson(): MonetaryAmount.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        currency: this.currency.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies MonetaryAmount.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MonetaryAmount"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/currency"),
      this.currency,
    );
    _resource.add(dataFactory.namedNode("http://schema.org/value"), this.value);
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MonetaryAmount {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MonetaryAmount",
  );
  export type Json = {
    readonly currency: string | undefined;
    readonly value: number | undefined;
  } & StructuredValueStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      currency: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof StructuredValueStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = StructuredValueStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const currency = purify.Maybe.fromNullable(_jsonObject["currency"]);
    const value = purify.Maybe.fromNullable(_jsonObject["value"]);
    return purify.Either.of({ ..._super0, identifier, currency, value });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MonetaryAmount> {
    return propertiesFromJson(json).map(
      (properties) => new MonetaryAmount(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValueStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/currency`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "MonetaryAmount",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return StructuredValueStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MonetaryAmount"),
        currency: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      currency: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof StructuredValueStatic.propertiesFromRdf>>
  > {
    const _super0Either = StructuredValueStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MonetaryAmount"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MonetaryAmount)`,
          predicate: dataFactory.namedNode("http://schema.org/MonetaryAmount"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _currencyEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/currency"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_currencyEither.isLeft()) {
      return _currencyEither;
    }

    const currency = _currencyEither.unsafeCoerce();
    const _valueEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<number>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/value"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toNumber())
        .toMaybe(),
    );
    if (_valueEither.isLeft()) {
      return _valueEither;
    }

    const value = _valueEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, currency, value });
  }

  export function fromRdf(
    parameters: Parameters<typeof MonetaryAmount.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MonetaryAmount> {
    return MonetaryAmount.propertiesFromRdf(parameters).map(
      (properties) => new MonetaryAmount(properties),
    );
  }

  export const rdfProperties = [
    ...StructuredValueStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/currency") },
    { path: dataFactory.namedNode("http://schema.org/value") },
  ];
}
export class MonetaryAmountStub extends StructuredValueStub {
  override readonly type = "MonetaryAmountStub";
  readonly currency: purify.Maybe<string>;
  readonly value: purify.Maybe<number>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly currency?: purify.Maybe<string> | string;
      readonly value?: number | purify.Maybe<number>;
    } & ConstructorParameters<typeof StructuredValueStub>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.currency)) {
      this.currency = parameters.currency;
    } else if (typeof parameters.currency === "string") {
      this.currency = purify.Maybe.of(parameters.currency);
    } else if (typeof parameters.currency === "undefined") {
      this.currency = purify.Maybe.empty();
    } else {
      this.currency = parameters.currency as never;
    }

    if (purify.Maybe.isMaybe(parameters.value)) {
      this.value = parameters.value;
    } else if (typeof parameters.value === "number") {
      this.value = purify.Maybe.of(parameters.value);
    } else if (typeof parameters.value === "undefined") {
      this.value = purify.Maybe.empty();
    } else {
      this.value = parameters.value as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: MonetaryAmountStub): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.currency,
          other.currency,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "currency",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.value,
          other.value,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "value",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.currency.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.value.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    return _hasher;
  }

  override toJson(): MonetaryAmountStub.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        currency: this.currency.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies MonetaryAmountStub.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/MonetaryAmount"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/currency"),
      this.currency,
    );
    _resource.add(dataFactory.namedNode("http://schema.org/value"), this.value);
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MonetaryAmountStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MonetaryAmount",
  );
  export type Json = {
    readonly currency: string | undefined;
    readonly value: number | undefined;
  } & StructuredValueStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      currency: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<
      ReturnType<typeof StructuredValueStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      StructuredValueStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const currency = purify.Maybe.fromNullable(_jsonObject["currency"]);
    const value = purify.Maybe.fromNullable(_jsonObject["value"]);
    return purify.Either.of({ ..._super0, identifier, currency, value });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MonetaryAmountStub> {
    return propertiesFromJson(json).map(
      (properties) => new MonetaryAmountStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValueStubStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/currency`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "MonetaryAmountStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return StructuredValueStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MonetaryAmountStub"),
        currency: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      currency: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & $UnwrapR<ReturnType<typeof StructuredValueStubStatic.propertiesFromRdf>>
  > {
    const _super0Either = StructuredValueStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/MonetaryAmount"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/MonetaryAmount)`,
          predicate: dataFactory.namedNode("http://schema.org/MonetaryAmount"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _currencyEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/currency"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_currencyEither.isLeft()) {
      return _currencyEither;
    }

    const currency = _currencyEither.unsafeCoerce();
    const _valueEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<number>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/value"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toNumber())
        .toMaybe(),
    );
    if (_valueEither.isLeft()) {
      return _valueEither;
    }

    const value = _valueEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, currency, value });
  }

  export function fromRdf(
    parameters: Parameters<typeof MonetaryAmountStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MonetaryAmountStub> {
    return MonetaryAmountStub.propertiesFromRdf(parameters).map(
      (properties) => new MonetaryAmountStub(properties),
    );
  }

  export const rdfProperties = [
    ...StructuredValueStubStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/currency") },
    { path: dataFactory.namedNode("http://schema.org/value") },
  ];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        MonetaryAmountStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MonetaryAmountStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      MonetaryAmountStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("monetaryAmountStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "monetaryAmountStub");
    return [
      ...StructuredValueStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
      {
        object: dataFactory.variable!(`${variablePrefix}Currency`),
        predicate: dataFactory.namedNode("http://schema.org/currency"),
        subject,
      },
      {
        object: dataFactory.variable!(`${variablePrefix}Value`),
        predicate: dataFactory.namedNode("http://schema.org/value"),
        subject,
      },
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject =
      parameters?.subject ?? dataFactory.variable!("monetaryAmountStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "monetaryAmountStub");
    return [
      ...StructuredValueStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode(
                    "http://schema.org/MonetaryAmount",
                  ),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}Currency`),
                predicate: dataFactory.namedNode("http://schema.org/currency"),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}Value`),
                predicate: dataFactory.namedNode("http://schema.org/value"),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
    ];
  }
}
export class Message extends CreativeWork {
  override readonly type = "Message";
  readonly sender: purify.Maybe<AgentStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly sender?: AgentStub | purify.Maybe<AgentStub>;
    } & ConstructorParameters<typeof CreativeWork>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.sender)) {
      this.sender = parameters.sender;
    } else if (typeof parameters.sender === "object") {
      this.sender = purify.Maybe.of(parameters.sender);
    } else if (typeof parameters.sender === "undefined") {
      this.sender = purify.Maybe.empty();
    } else {
      this.sender = parameters.sender as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Message): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, AgentStub.equals))(
          this.sender,
          other.sender,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "sender",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.sender.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): Message.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        sender: this.sender.map((_item) => _item.toJson()).extract(),
      } satisfies Message.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Message"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/sender"),
      this.sender.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Message {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Message",
  );
  export type Json = {
    readonly sender:
      | (OrganizationStubStatic.Json | PersonStub.Json)
      | undefined;
  } & CreativeWorkStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      sender: purify.Maybe<AgentStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const sender = purify.Maybe.fromNullable(_jsonObject["sender"]).map(
      (_item) => AgentStub.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({ ..._super0, identifier, sender });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Message> {
    return propertiesFromJson(json).map(
      (properties) => new Message(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/sender`, type: "Control" },
      ],
      label: "Message",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Message"),
        sender: AgentStub.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      sender: purify.Maybe<AgentStub>;
    } & $UnwrapR<ReturnType<typeof CreativeWorkStatic.propertiesFromRdf>>
  > {
    const _super0Either = CreativeWorkStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Message"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Message)`,
          predicate: dataFactory.namedNode("http://schema.org/Message"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _senderEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<AgentStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/sender"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          AgentStub.fromRdf({
            ..._context,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_senderEither.isLeft()) {
      return _senderEither;
    }

    const sender = _senderEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, sender });
  }

  export function fromRdf(
    parameters: Parameters<typeof Message.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Message> {
    return Message.propertiesFromRdf(parameters).map(
      (properties) => new Message(properties),
    );
  }

  export const rdfProperties = [
    ...CreativeWorkStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/sender") },
  ];
}
export class MessageStub extends CreativeWorkStub {
  override readonly type = "MessageStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWorkStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Message"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace MessageStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Message",
  );
  export type Json = CreativeWorkStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either =
      CreativeWorkStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MessageStub> {
    return propertiesFromJson(json).map(
      (properties) => new MessageStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWorkStubStatic.jsonUiSchema({ scopePrefix })],
      label: "MessageStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return CreativeWorkStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MessageStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof CreativeWorkStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Message"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Message)`,
          predicate: dataFactory.namedNode("http://schema.org/Message"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof MessageStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MessageStub> {
    return MessageStub.propertiesFromRdf(parameters).map(
      (properties) => new MessageStub(properties),
    );
  }

  export const rdfProperties = [...CreativeWorkStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        MessageStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MessageStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      MessageStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("messageStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "messageStub");
    return [
      ...CreativeWorkStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("messageStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "messageStub");
    return [
      ...CreativeWorkStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Message"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class Invoice extends Intangible {
  override readonly type = "Invoice";
  readonly category: purify.Maybe<string>;
  readonly provider: purify.Maybe<AgentStub>;
  readonly referencesOrder: readonly OrderStub[];
  readonly totalPaymentDue: purify.Maybe<MonetaryAmountStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly category?: purify.Maybe<string> | string;
      readonly provider?: AgentStub | purify.Maybe<AgentStub>;
      readonly referencesOrder?: readonly OrderStub[];
      readonly totalPaymentDue?:
        | MonetaryAmountStub
        | purify.Maybe<MonetaryAmountStub>;
    } & ConstructorParameters<typeof Intangible>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.category)) {
      this.category = parameters.category;
    } else if (typeof parameters.category === "string") {
      this.category = purify.Maybe.of(parameters.category);
    } else if (typeof parameters.category === "undefined") {
      this.category = purify.Maybe.empty();
    } else {
      this.category = parameters.category as never;
    }

    if (purify.Maybe.isMaybe(parameters.provider)) {
      this.provider = parameters.provider;
    } else if (typeof parameters.provider === "object") {
      this.provider = purify.Maybe.of(parameters.provider);
    } else if (typeof parameters.provider === "undefined") {
      this.provider = purify.Maybe.empty();
    } else {
      this.provider = parameters.provider as never;
    }

    if (typeof parameters.referencesOrder === "undefined") {
      this.referencesOrder = [];
    } else if (Array.isArray(parameters.referencesOrder)) {
      this.referencesOrder = parameters.referencesOrder;
    } else {
      this.referencesOrder = parameters.referencesOrder as never;
    }

    if (purify.Maybe.isMaybe(parameters.totalPaymentDue)) {
      this.totalPaymentDue = parameters.totalPaymentDue;
    } else if (
      typeof parameters.totalPaymentDue === "object" &&
      parameters.totalPaymentDue instanceof MonetaryAmountStub
    ) {
      this.totalPaymentDue = purify.Maybe.of(parameters.totalPaymentDue);
    } else if (typeof parameters.totalPaymentDue === "undefined") {
      this.totalPaymentDue = purify.Maybe.empty();
    } else {
      this.totalPaymentDue = parameters.totalPaymentDue as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: Invoice): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.category,
          other.category,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "category",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, AgentStub.equals))(
          this.provider,
          other.provider,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "provider",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.referencesOrder,
          other.referencesOrder,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "referencesOrder",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) =>
          $maybeEquals(left, right, (left, right) => left.equals(right)))(
          this.totalPaymentDue,
          other.totalPaymentDue,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "totalPaymentDue",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.category.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.provider.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    for (const _item0 of this.referencesOrder) {
      _item0.hash(_hasher);
    }

    this.totalPaymentDue.ifJust((_value0) => {
      _value0.hash(_hasher);
    });
    return _hasher;
  }

  override toJson(): Invoice.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        category: this.category.map((_item) => _item).extract(),
        provider: this.provider.map((_item) => _item.toJson()).extract(),
        referencesOrder: this.referencesOrder.map((_item) => _item.toJson()),
        totalPaymentDue: this.totalPaymentDue
          .map((_item) => _item.toJson())
          .extract(),
      } satisfies Invoice.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Invoice"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/category"),
      this.category,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/provider"),
      this.provider.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/referencesOrder"),
      this.referencesOrder.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/totalPaymentDue"),
      this.totalPaymentDue.map((_value) =>
        _value.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Invoice {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Invoice",
  );
  export type Json = {
    readonly category: string | undefined;
    readonly provider:
      | (OrganizationStubStatic.Json | PersonStub.Json)
      | undefined;
    readonly referencesOrder: readonly OrderStub.Json[];
    readonly totalPaymentDue: MonetaryAmountStub.Json | undefined;
  } & IntangibleStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      category: purify.Maybe<string>;
      provider: purify.Maybe<AgentStub>;
      referencesOrder: readonly OrderStub[];
      totalPaymentDue: purify.Maybe<MonetaryAmountStub>;
    } & $UnwrapR<ReturnType<typeof IntangibleStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const category = purify.Maybe.fromNullable(_jsonObject["category"]);
    const provider = purify.Maybe.fromNullable(_jsonObject["provider"]).map(
      (_item) => AgentStub.fromJson(_item).unsafeCoerce(),
    );
    const referencesOrder = _jsonObject["referencesOrder"].map((_item) =>
      OrderStub.fromJson(_item).unsafeCoerce(),
    );
    const totalPaymentDue = purify.Maybe.fromNullable(
      _jsonObject["totalPaymentDue"],
    ).map((_item) => MonetaryAmountStub.fromJson(_item).unsafeCoerce());
    return purify.Either.of({
      ..._super0,
      identifier,
      category,
      provider,
      referencesOrder,
      totalPaymentDue,
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, Invoice> {
    return propertiesFromJson(json).map(
      (properties) => new Invoice(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        IntangibleStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/category`, type: "Control" },
        { scope: `${scopePrefix}/properties/provider`, type: "Control" },
        OrderStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/referencesOrder`,
        }),
        MonetaryAmountStub.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/totalPaymentDue`,
        }),
      ],
      label: "Invoice",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Invoice"),
        category: zod.string().optional(),
        provider: AgentStub.jsonZodSchema().optional(),
        referencesOrder: OrderStub.jsonZodSchema()
          .array()
          .default(() => []),
        totalPaymentDue: MonetaryAmountStub.jsonZodSchema().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      category: purify.Maybe<string>;
      provider: purify.Maybe<AgentStub>;
      referencesOrder: readonly OrderStub[];
      totalPaymentDue: purify.Maybe<MonetaryAmountStub>;
    } & $UnwrapR<ReturnType<typeof IntangibleStatic.propertiesFromRdf>>
  > {
    const _super0Either = IntangibleStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Invoice"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Invoice)`,
          predicate: dataFactory.namedNode("http://schema.org/Invoice"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _categoryEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/category"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_categoryEither.isLeft()) {
      return _categoryEither;
    }

    const category = _categoryEither.unsafeCoerce();
    const _providerEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<AgentStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/provider"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          AgentStub.fromRdf({
            ..._context,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_providerEither.isLeft()) {
      return _providerEither;
    }

    const provider = _providerEither.unsafeCoerce();
    const _referencesOrderEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly OrderStub[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/referencesOrder"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((value) => value.toResource())
            .chain((_resource) =>
              OrderStub.fromRdf({
                ..._context,
                ignoreRdfType: true,
                languageIn: _languageIn,
                resource: _resource,
              }),
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_referencesOrderEither.isLeft()) {
      return _referencesOrderEither;
    }

    const referencesOrder = _referencesOrderEither.unsafeCoerce();
    const _totalPaymentDueEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<MonetaryAmountStub>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/totalPaymentDue"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          MonetaryAmountStub.fromRdf({
            ..._context,
            ignoreRdfType: true,
            languageIn: _languageIn,
            resource: _resource,
          }),
        )
        .toMaybe(),
    );
    if (_totalPaymentDueEither.isLeft()) {
      return _totalPaymentDueEither;
    }

    const totalPaymentDue = _totalPaymentDueEither.unsafeCoerce();
    return purify.Either.of({
      ..._super0,
      identifier,
      category,
      provider,
      referencesOrder,
      totalPaymentDue,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof Invoice.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Invoice> {
    return Invoice.propertiesFromRdf(parameters).map(
      (properties) => new Invoice(properties),
    );
  }

  export const rdfProperties = [
    ...IntangibleStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/category") },
    { path: dataFactory.namedNode("http://schema.org/provider") },
    { path: dataFactory.namedNode("http://schema.org/referencesOrder") },
    { path: dataFactory.namedNode("http://schema.org/totalPaymentDue") },
  ];
}
export class InvoiceStub extends IntangibleStub {
  override readonly type = "InvoiceStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof IntangibleStub>[0],
  ) {
    super(parameters);
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Invoice"),
      );
    }

    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace InvoiceStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Invoice",
  );
  export type Json = IntangibleStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, InvoiceStub> {
    return propertiesFromJson(json).map(
      (properties) => new InvoiceStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStubStatic.jsonUiSchema({ scopePrefix })],
      label: "InvoiceStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return IntangibleStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("InvoiceStub"),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & $UnwrapR<
      ReturnType<typeof IntangibleStubStatic.propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(
        dataFactory.namedNode("http://schema.org/Invoice"),
      )
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Invoice)`,
          predicate: dataFactory.namedNode("http://schema.org/Invoice"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof InvoiceStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, InvoiceStub> {
    return InvoiceStub.propertiesFromRdf(parameters).map(
      (properties) => new InvoiceStub(properties),
    );
  }

  export const rdfProperties = [...IntangibleStubStatic.rdfProperties];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        InvoiceStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        InvoiceStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      InvoiceStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("invoiceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "invoiceStub");
    return [
      ...IntangibleStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("invoiceStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "invoiceStub");
    return [
      ...IntangibleStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Invoice"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
    ];
  }
}
export class PersonStub extends ThingStub {
  override readonly type = "PersonStub";
  readonly jobTitle: purify.Maybe<string>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly jobTitle?: purify.Maybe<string> | string;
    } & ConstructorParameters<typeof ThingStub>[0],
  ) {
    super(parameters);
    if (purify.Maybe.isMaybe(parameters.jobTitle)) {
      this.jobTitle = parameters.jobTitle;
    } else if (typeof parameters.jobTitle === "string") {
      this.jobTitle = purify.Maybe.of(parameters.jobTitle);
    } else if (typeof parameters.jobTitle === "undefined") {
      this.jobTitle = purify.Maybe.empty();
    } else {
      this.jobTitle = parameters.jobTitle as never;
    }
  }

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  override equals(other: PersonStub): $EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => $maybeEquals(left, right, $strictEquals))(
          this.jobTitle,
          other.jobTitle,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "jobTitle",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      );
  }

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    this.hashShaclProperties(_hasher);
    return _hasher;
  }

  protected override hashShaclProperties<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hashShaclProperties(_hasher);
    this.jobTitle.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    return _hasher;
  }

  override toJson(): PersonStub.Json {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        jobTitle: this.jobTitle.map((_item) => _item).extract(),
      } satisfies PersonStub.Json),
    );
  }

  override toRdf({
    ignoreRdfType,
    mutateGraph,
    resourceSet,
  }: {
    ignoreRdfType?: boolean;
    mutateGraph?: rdfjsResource.MutableResource.MutateGraph;
    resourceSet: rdfjsResource.MutableResourceSet;
  }): rdfjsResource.MutableResource {
    const _resource = super.toRdf({
      ignoreRdfType: true,
      mutateGraph,
      resourceSet,
    });
    if (!ignoreRdfType) {
      _resource.add(
        _resource.dataFactory.namedNode(
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        ),
        _resource.dataFactory.namedNode("http://schema.org/Person"),
      );
    }

    _resource.add(
      dataFactory.namedNode("http://schema.org/jobTitle"),
      this.jobTitle,
    );
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace PersonStub {
  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Person",
  );
  export type Json = {
    readonly jobTitle: string | undefined;
  } & ThingStubStatic.Json;

  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      jobTitle: purify.Maybe<string>;
    } & $UnwrapR<ReturnType<typeof ThingStubStatic.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = jsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStubStatic.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const jobTitle = purify.Maybe.fromNullable(_jsonObject["jobTitle"]);
    return purify.Either.of({ ..._super0, identifier, jobTitle });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, PersonStub> {
    return propertiesFromJson(json).map(
      (properties) => new PersonStub(properties),
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(jsonZodSchema());
  }

  export function jsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStubStatic.jsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/jobTitle`, type: "Control" },
      ],
      label: "PersonStub",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return ThingStubStatic.jsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("PersonStub"),
        jobTitle: zod.string().optional(),
      }),
    );
  }

  export function propertiesFromRdf({
    ignoreRdfType: _ignoreRdfType,
    languageIn: _languageIn,
    resource: _resource,
    // @ts-ignore
    ..._context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    languageIn?: readonly string[];
    resource: rdfjsResource.Resource;
  }): purify.Either<
    rdfjsResource.Resource.ValueError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      jobTitle: purify.Maybe<string>;
    } & $UnwrapR<ReturnType<typeof ThingStubStatic.propertiesFromRdf>>
  > {
    const _super0Either = ThingStubStatic.propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Person"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type (expected http://schema.org/Person)`,
          predicate: dataFactory.namedNode("http://schema.org/Person"),
        }),
      );
    }

    const identifier = _resource.identifier;
    const _jobTitleEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      purify.Maybe<string>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/jobTitle"), {
          unique: true,
        })
        .head()
        .chain((_value) => _value.toString())
        .toMaybe(),
    );
    if (_jobTitleEither.isLeft()) {
      return _jobTitleEither;
    }

    const jobTitle = _jobTitleEither.unsafeCoerce();
    return purify.Either.of({ ..._super0, identifier, jobTitle });
  }

  export function fromRdf(
    parameters: Parameters<typeof PersonStub.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PersonStub> {
    return PersonStub.propertiesFromRdf(parameters).map(
      (properties) => new PersonStub(properties),
    );
  }

  export const rdfProperties = [
    ...ThingStubStatic.rdfProperties,
    { path: dataFactory.namedNode("http://schema.org/jobTitle") },
  ];

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        PersonStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        PersonStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      PersonStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters?: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    const subject = parameters?.subject ?? dataFactory.variable!("personStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "personStub");
    return [
      ...ThingStubStatic.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              subject,
              predicate: dataFactory.namedNode(
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              ),
              object: dataFactory.variable!(`${variablePrefix}RdfType`),
            },
          ]),
      {
        object: dataFactory.variable!(`${variablePrefix}JobTitle`),
        predicate: dataFactory.namedNode("http://schema.org/jobTitle"),
        subject,
      },
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    const subject = parameters?.subject ?? dataFactory.variable!("personStub");
    const variablePrefix =
      parameters?.variablePrefix ??
      (subject.termType === "Variable" ? subject.value : "personStub");
    return [
      ...ThingStubStatic.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
      ...(parameters?.ignoreRdfType
        ? []
        : [
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.namedNode("http://schema.org/Person"),
                },
              ],
              type: "bgp" as const,
            },
            {
              triples: [
                {
                  subject,
                  predicate: dataFactory.namedNode(
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  ),
                  object: dataFactory.variable!(`${variablePrefix}RdfType`),
                },
              ],
              type: "bgp" as const,
            },
          ]),
      {
        patterns: [
          {
            triples: [
              {
                object: dataFactory.variable!(`${variablePrefix}JobTitle`),
                predicate: dataFactory.namedNode("http://schema.org/jobTitle"),
                subject,
              },
            ],
            type: "bgp",
          },
        ],
        type: "optional",
      },
    ];
  }
}
export type AgentStub = OrganizationStub | PersonStub;

export namespace AgentStub {
  export function equals(left: AgentStub, right: AgentStub): $EqualsResult {
    return $strictEquals(left.type, right.type).chain(() => {
      switch (left.type) {
        case "OrganizationStub":
        case "MusicGroupStub":
        case "PerformingGroupStub":
          return left.equals(right as unknown as OrganizationStub);
        case "PersonStub":
          return left.equals(right as unknown as PersonStub);
        default:
          left satisfies never;
          throw new Error("unrecognized type");
      }
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, AgentStub> {
    return (
      OrganizationStubStatic.fromJson(json) as purify.Either<
        zod.ZodError,
        AgentStub
      >
    ).altLazy(
      () => PersonStub.fromJson(json) as purify.Either<zod.ZodError, AgentStub>,
    );
  }

  export function fromRdf({
    ignoreRdfType,
    resource,
    ...context
  }: {
    [_index: string]: any;
    ignoreRdfType?: boolean;
    resource: rdfjsResource.Resource;
  }): purify.Either<rdfjsResource.Resource.ValueError, AgentStub> {
    return (
      OrganizationStubStatic.fromRdf({ ...context, resource }) as purify.Either<
        rdfjsResource.Resource.ValueError,
        AgentStub
      >
    ).altLazy(
      () =>
        PersonStub.fromRdf({ ...context, resource }) as purify.Either<
          rdfjsResource.Resource.ValueError,
          AgentStub
        >,
    );
  }

  export function hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_agentStub: AgentStub, _hasher: HasherT): HasherT {
    switch (_agentStub.type) {
      case "OrganizationStub":
      case "MusicGroupStub":
      case "PerformingGroupStub":
        return _agentStub.hash(_hasher);
      case "PersonStub":
        return _agentStub.hash(_hasher);
      default:
        _agentStub satisfies never;
        throw new Error("unrecognized type");
    }
  }

  export type Json = OrganizationStubStatic.Json | PersonStub.Json;

  export function jsonZodSchema() {
    return zod.discriminatedUnion("type", [
      OrganizationStubStatic.jsonZodSchema(),
      PersonStub.jsonZodSchema(),
    ]);
  }

  export function sparqlConstructQuery(
    parameters?: {
      ignoreRdfType?: boolean;
      prefixes?: { [prefix: string]: string };
      subject?: sparqljs.Triple["subject"];
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type">,
  ): sparqljs.ConstructQuery {
    const { ignoreRdfType, subject, ...queryParameters } = parameters ?? {};

    return {
      ...queryParameters,
      prefixes: parameters?.prefixes ?? {},
      queryType: "CONSTRUCT",
      template: (queryParameters.template ?? []).concat(
        AgentStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        AgentStub.sparqlWherePatterns({ ignoreRdfType, subject }),
      ),
    };
  }

  export function sparqlConstructQueryString(
    parameters?: {
      ignoreRdfType?: boolean;
      subject?: sparqljs.Triple["subject"];
      variablePrefix?: string;
    } & Omit<sparqljs.ConstructQuery, "prefixes" | "queryType" | "type"> &
      sparqljs.GeneratorOptions,
  ): string {
    return new sparqljs.Generator(parameters).stringify(
      AgentStub.sparqlConstructQuery(parameters),
    );
  }

  export function sparqlConstructTemplateTriples(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Triple[] {
    return [
      ...OrganizationStubStatic.sparqlConstructTemplateTriples({
        subject:
          parameters.subject ??
          dataFactory.variable!("agentStubOrganizationStub"),
        variablePrefix: parameters?.variablePrefix
          ? `${parameters.variablePrefix}OrganizationStub`
          : "agentStubOrganizationStub",
      }).concat(),
      ...PersonStub.sparqlConstructTemplateTriples({
        subject:
          parameters.subject ?? dataFactory.variable!("agentStubPersonStub"),
        variablePrefix: parameters?.variablePrefix
          ? `${parameters.variablePrefix}PersonStub`
          : "agentStubPersonStub",
      }).concat(),
    ];
  }

  export function sparqlWherePatterns(parameters: {
    ignoreRdfType?: boolean;
    subject?: sparqljs.Triple["subject"];
    variablePrefix?: string;
  }): readonly sparqljs.Pattern[] {
    return [
      {
        patterns: [
          {
            patterns: OrganizationStubStatic.sparqlWherePatterns({
              subject:
                parameters.subject ??
                dataFactory.variable!("agentStubOrganizationStub"),
              variablePrefix: parameters?.variablePrefix
                ? `${parameters.variablePrefix}OrganizationStub`
                : "agentStubOrganizationStub",
            }).concat(),
            type: "group",
          },
          {
            patterns: PersonStub.sparqlWherePatterns({
              subject:
                parameters.subject ??
                dataFactory.variable!("agentStubPersonStub"),
              variablePrefix: parameters?.variablePrefix
                ? `${parameters.variablePrefix}PersonStub`
                : "agentStubPersonStub",
            }).concat(),
            type: "group",
          },
        ],
        type: "union",
      },
    ];
  }

  export function toJson(
    _agentStub: AgentStub,
  ): OrganizationStubStatic.Json | PersonStub.Json {
    switch (_agentStub.type) {
      case "OrganizationStub":
      case "MusicGroupStub":
      case "PerformingGroupStub":
        return _agentStub.toJson();
      case "PersonStub":
        return _agentStub.toJson();
      default:
        _agentStub satisfies never;
        throw new Error("unrecognized type");
    }
  }

  export function toRdf(
    _agentStub: AgentStub,
    _parameters: {
      mutateGraph: rdfjsResource.MutableResource.MutateGraph;
      resourceSet: rdfjsResource.MutableResourceSet;
    },
  ): rdfjsResource.MutableResource {
    switch (_agentStub.type) {
      case "OrganizationStub":
      case "MusicGroupStub":
      case "PerformingGroupStub":
        return _agentStub.toRdf(_parameters);
      case "PersonStub":
        return _agentStub.toRdf(_parameters);
      default:
        _agentStub satisfies never;
        throw new Error("unrecognized type");
    }
  }
}

export const $ObjectTypes = {
    Action: ActionStatic,
    ActionStub: ActionStubStatic,
    Article: ArticleStatic,
    ArticleStub: ArticleStubStatic,
    AssessAction: AssessActionStatic,
    AssessActionStub: AssessActionStubStatic,
    BroadcastEvent,
    BroadcastService: BroadcastServiceStatic,
    BroadcastServiceStub: BroadcastServiceStubStatic,
    ChooseAction: ChooseActionStatic,
    ChooseActionStub: ChooseActionStubStatic,
    CreativeWork: CreativeWorkStatic,
    CreativeWorkSeries: CreativeWorkSeriesStatic,
    CreativeWorkSeriesStub: CreativeWorkSeriesStubStatic,
    CreativeWorkStub: CreativeWorkStubStatic,
    Enumeration: EnumerationStatic,
    Episode: EpisodeStatic,
    EpisodeStub: EpisodeStubStatic,
    Event: EventStatic,
    EventStub: EventStubStatic,
    GenderType,
    ImageObject,
    Intangible: IntangibleStatic,
    IntangibleStub: IntangibleStubStatic,
    Invoice,
    InvoiceStub,
    MediaObject: MediaObjectStatic,
    MediaObjectStub: MediaObjectStubStatic,
    Message,
    MessageStub,
    Model: ModelStatic,
    MonetaryAmount,
    MonetaryAmountStub,
    MusicAlbum,
    MusicAlbumStub,
    MusicComposition,
    MusicCompositionStub,
    MusicGroup,
    MusicGroupStub,
    MusicRecording,
    MusicRecordingStub,
    Occupation,
    Order,
    OrderStub,
    Organization: OrganizationStatic,
    OrganizationStub: OrganizationStubStatic,
    PerformingGroup: PerformingGroupStatic,
    PerformingGroupStub: PerformingGroupStubStatic,
    Person,
    PersonStub,
    Place,
    PlaceStub,
    PublicationEvent: PublicationEventStatic,
    PublicationEventStub,
    QuantitativeValue,
    QuantitativeValueStub,
    RadioBroadcastService,
    RadioBroadcastServiceStub,
    RadioEpisode,
    RadioEpisodeStub,
    RadioSeries,
    RadioSeriesStub,
    Report,
    ReportStub,
    Role,
    Service: ServiceStatic,
    ServiceStub: ServiceStubStatic,
    StructuredValue: StructuredValueStatic,
    StructuredValueStub: StructuredValueStubStatic,
    TextObject,
    TextObjectStub,
    Thing: ThingStatic,
    ThingStub: ThingStubStatic,
    VoteAction,
    VoteActionStub,
  },
  $ObjectUnionTypes = { AgentStub },
  $Types = { ...$ObjectTypes, ...$ObjectUnionTypes };
