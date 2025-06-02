import type * as rdfjs from "@rdfjs/types";
import { sha256 } from "js-sha256";
import { DataFactory as dataFactory } from "n3";
import * as purify from "purify-ts";
import * as rdfLiteral from "rdf-literal";
import * as rdfjsResource from "rdfjs-resource";
import * as sparqljs from "sparqljs";
import { z as zod } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
export type EqualsResult = purify.Either<EqualsResult.Unequal, true>;

export namespace EqualsResult {
  export const Equal: EqualsResult = purify.Either.of<Unequal, true>(true);

  export function fromBooleanEqualsResult(
    left: any,
    right: any,
    equalsResult: boolean | EqualsResult,
  ): EqualsResult {
    if (typeof equalsResult !== "boolean") {
      return equalsResult;
    }

    if (equalsResult) {
      return Equal;
    }
    return purify.Left({
      left,
      right,
      type: "BooleanEquals",
    });
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
 * Compare two objects with equals(other: T): boolean methods and return an EqualsResult.
 */
export function booleanEquals<T extends { equals: (other: T) => boolean }>(
  left: T,
  right: T,
): EqualsResult {
  return EqualsResult.fromBooleanEqualsResult(left, right, left.equals(right));
}
/**
 * Compare two values for strict equality (===), returning an EqualsResult rather than a boolean.
 */
export function strictEquals<T extends bigint | boolean | number | string>(
  left: T,
  right: T,
): EqualsResult {
  return EqualsResult.fromBooleanEqualsResult(left, right, left === right);
}
export function maybeEquals<T>(
  leftMaybe: purify.Maybe<T>,
  rightMaybe: purify.Maybe<T>,
  valueEquals: (left: T, right: T) => boolean | EqualsResult,
): EqualsResult {
  if (leftMaybe.isJust()) {
    if (rightMaybe.isJust()) {
      return EqualsResult.fromBooleanEqualsResult(
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

  return EqualsResult.Equal;
}
export function arrayEquals<T>(
  leftArray: readonly T[],
  rightArray: readonly T[],
  elementEquals: (left: T, right: T) => boolean | EqualsResult,
): EqualsResult {
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

    const rightUnequals: EqualsResult.Unequal[] = [];
    for (
      let rightElementIndex = 0;
      rightElementIndex < rightArray.length;
      rightElementIndex++
    ) {
      const rightElement = rightArray[rightElementIndex];

      const leftElementEqualsRightElement =
        EqualsResult.fromBooleanEqualsResult(
          leftElement,
          rightElement,
          elementEquals(leftElement, rightElement),
        );
      if (leftElementEqualsRightElement.isRight()) {
        break; // left element === right element, break out of the right iteration
      }
      rightUnequals.push(
        leftElementEqualsRightElement.extract() as EqualsResult.Unequal,
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

  return EqualsResult.Equal;
}
type UnwrapR<T> = T extends purify.Either<any, infer R> ? R : never;
/**
 * Compare two Dates and return an EqualsResult.
 */
export function dateEquals(left: Date, right: Date): EqualsResult {
  return EqualsResult.fromBooleanEqualsResult(
    left,
    right,
    left.getTime() === right.getTime(),
  );
}
export abstract class Thing {
  abstract readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract readonly type:
    | "Action"
    | "Article"
    | "AssessAction"
    | "ChooseAction"
    | "Event"
    | "GenderType"
    | "ImageObject"
    | "Invoice"
    | "Message"
    | "MonetaryAmount"
    | "Occupation"
    | "Order"
    | "Organization"
    | "Person"
    | "Place"
    | "QuantitativeValue"
    | "Report"
    | "Role"
    | "TextObject"
    | "VoteAction";
  readonly description: purify.Maybe<string>;
  readonly identifiers: readonly string[];
  readonly name: purify.Maybe<string>;
  readonly order: purify.Maybe<number>;
  readonly sameAs: readonly rdfjs.NamedNode[];
  readonly subjectOf: readonly (CreativeWorkStub | EventStub)[];
  readonly url: purify.Maybe<rdfjs.NamedNode>;

  constructor(parameters: {
    readonly description?: purify.Maybe<string> | string;
    readonly identifiers?: readonly string[];
    readonly name?: purify.Maybe<string> | string;
    readonly order?: number | purify.Maybe<number>;
    readonly sameAs?: readonly rdfjs.NamedNode[];
    readonly subjectOf?: readonly (CreativeWorkStub | EventStub)[];
    readonly url?: rdfjs.NamedNode | purify.Maybe<rdfjs.NamedNode> | string;
  }) {
    if (purify.Maybe.isMaybe(parameters.description)) {
      this.description = parameters.description;
    } else if (typeof parameters.description === "string") {
      this.description = purify.Maybe.of(parameters.description);
    } else if (typeof parameters.description === "undefined") {
      this.description = purify.Maybe.empty();
    } else {
      this.description = parameters.description as never;
    }

    if (typeof parameters.identifiers === "undefined") {
      this.identifiers = [];
    } else if (Array.isArray(parameters.identifiers)) {
      this.identifiers = parameters.identifiers;
    } else {
      this.identifiers = parameters.identifiers as never;
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

  equals(other: Thing): EqualsResult {
    return booleanEquals(this.identifier, other.identifier)
      .mapLeft((propertyValuesUnequal) => ({
        left: this,
        right: other,
        propertyName: "identifier",
        propertyValuesUnequal,
        type: "Property" as const,
      }))
      .chain(() =>
        strictEquals(this.type, other.type).mapLeft(
          (propertyValuesUnequal) => ({
            left: this,
            right: other,
            propertyName: "type",
            propertyValuesUnequal,
            type: "Property" as const,
          }),
        ),
      )
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => arrayEquals(left, right, strictEquals))(
          this.identifiers,
          other.identifiers,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "identifiers",
          propertyValuesUnequal,
          type: "Property" as const,
        })),
      )
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => arrayEquals(left, right, booleanEquals))(
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
          arrayEquals(
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
              if (left.type === "EventStub" && right.type === "EventStub") {
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
        ((left, right) => maybeEquals(left, right, booleanEquals))(
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
    this.description.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.identifiers) {
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
        case "CreativeWorkStub": {
          _item0.hash(_hasher);
          break;
        }
        case "EventStub": {
          _item0.hash(_hasher);
          break;
        }
      }
    }

    this.url.ifJust((_value0) => {
      _hasher.update(_value0.termType);
      _hasher.update(_value0.value);
    });
    return _hasher;
  }

  toJson(): {
    readonly "@id": string;
    readonly type:
      | "Action"
      | "Article"
      | "AssessAction"
      | "ChooseAction"
      | "Event"
      | "GenderType"
      | "ImageObject"
      | "Invoice"
      | "Message"
      | "MonetaryAmount"
      | "Occupation"
      | "Order"
      | "Organization"
      | "Person"
      | "Place"
      | "QuantitativeValue"
      | "Report"
      | "Role"
      | "TextObject"
      | "VoteAction";
    readonly description: string | undefined;
    readonly identifiers: readonly string[];
    readonly name: string | undefined;
    readonly order: number | undefined;
    readonly sameAs: readonly { readonly "@id": string }[];
    readonly subjectOf: readonly (
      | ReturnType<CreativeWorkStub["toJson"]>
      | ReturnType<EventStub["toJson"]>
    )[];
    readonly url: { readonly "@id": string } | undefined;
  } {
    return JSON.parse(
      JSON.stringify({
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        type: this.type,
        description: this.description.map((_item) => _item).extract(),
        identifiers: this.identifiers.map((_item) => _item),
        name: this.name.map((_item) => _item).extract(),
        order: this.order.map((_item) => _item).extract(),
        sameAs: this.sameAs.map((_item) => ({ "@id": _item.value })),
        subjectOf: this.subjectOf.map((_item) =>
          _item.type === "EventStub" ? _item.toJson() : _item.toJson(),
        ),
        url: this.url.map((_item) => ({ "@id": _item.value })).extract(),
      } satisfies ReturnType<Thing["toJson"]>),
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
    _resource.add(
      dataFactory.namedNode("http://schema.org/description"),
      this.description,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/identifier"),
      this.identifiers.map((_item) => _item),
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
        _item.type === "EventStub"
          ? _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet })
          : _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
    );
    _resource.add(dataFactory.namedNode("http://schema.org/url"), this.url);
    return _resource;
  }

  toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Thing {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      description: purify.Maybe<string>;
      identifiers: readonly string[];
      name: purify.Maybe<string>;
      order: purify.Maybe<number>;
      sameAs: readonly rdfjs.NamedNode[];
      subjectOf: readonly (CreativeWorkStub | EventStub)[];
      url: purify.Maybe<rdfjs.NamedNode>;
    }
  > {
    const _jsonSafeParseResult = thingJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const description = purify.Maybe.fromNullable(_jsonObject["description"]);
    const identifiers = _jsonObject["identifiers"];
    const name = purify.Maybe.fromNullable(_jsonObject["name"]);
    const order = purify.Maybe.fromNullable(_jsonObject["order"]);
    const sameAs = _jsonObject["sameAs"].map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    const subjectOf = _jsonObject["subjectOf"].map((_item) =>
      _item.type === "EventStub"
        ? EventStub.fromJson(_item).unsafeCoerce()
        : CreativeWorkStub.fromJson(_item).unsafeCoerce(),
    );
    const url = purify.Maybe.fromNullable(_jsonObject["url"]).map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    return purify.Either.of({
      identifier,
      description,
      identifiers,
      name,
      order,
      sameAs,
      subjectOf,
      url,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Thing> {
    return (Action.fromJson(json) as purify.Either<zod.ZodError, Thing>)
      .altLazy(
        () => CreativeWork.fromJson(json) as purify.Either<zod.ZodError, Thing>,
      )
      .altLazy(() => Event.fromJson(json) as purify.Either<zod.ZodError, Thing>)
      .altLazy(
        () => Organization.fromJson(json) as purify.Either<zod.ZodError, Thing>,
      )
      .altLazy(
        () => Person.fromJson(json) as purify.Either<zod.ZodError, Thing>,
      )
      .altLazy(() => Place.fromJson(json) as purify.Either<zod.ZodError, Thing>)
      .altLazy(
        () => Intangible.fromJson(json) as purify.Either<zod.ZodError, Thing>,
      );
  }

  export function _propertiesFromRdf({
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
      identifiers: readonly string[];
      name: purify.Maybe<string>;
      order: purify.Maybe<number>;
      sameAs: readonly rdfjs.NamedNode[];
      subjectOf: readonly (CreativeWorkStub | EventStub)[];
      url: purify.Maybe<rdfjs.NamedNode>;
    }
  > {
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
    const _identifiersEither: purify.Either<
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
    if (_identifiersEither.isLeft()) {
      return _identifiersEither;
    }

    const identifiers = _identifiersEither.unsafeCoerce();
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
                CreativeWorkStub.fromRdf({
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
                    EventStub.fromRdf({
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
      identifier,
      description,
      identifiers,
      name,
      order,
      sameAs,
      subjectOf,
      url,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof Thing._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Thing> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      Action.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Thing
      >
    )
      .altLazy(
        () =>
          CreativeWork.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(
        () =>
          Event.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      )
      .altLazy(
        () =>
          Organization.fromRdf(otherParameters) as purify.Either<
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
      .altLazy(
        () =>
          Intangible.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Thing
          >,
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(thingJsonZodSchema());
  }

  export function thingJsonUiSchema(parameters?: { scopePrefix?: string }) {
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
              schema: { const: "Thing" },
              scope: `${scopePrefix}/properties/type`,
            },
            effect: "HIDE",
          },
          scope: `${scopePrefix}/properties/type`,
          type: "Control",
        },
        { scope: `${scopePrefix}/properties/description`, type: "Control" },
        { scope: `${scopePrefix}/properties/identifiers`, type: "Control" },
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

  export function thingJsonZodSchema() {
    return zod.object({
      "@id": zod.string().min(1),
      type: zod.enum([
        "Action",
        "Article",
        "AssessAction",
        "ChooseAction",
        "Event",
        "GenderType",
        "ImageObject",
        "Invoice",
        "Message",
        "MonetaryAmount",
        "Occupation",
        "Order",
        "Organization",
        "Person",
        "Place",
        "QuantitativeValue",
        "Report",
        "Role",
        "TextObject",
        "VoteAction",
      ]),
      description: zod.string().optional(),
      identifiers: zod.string().array(),
      name: zod.string().optional(),
      order: zod.number().optional(),
      sameAs: zod.object({ "@id": zod.string().min(1) }).array(),
      subjectOf: zod
        .discriminatedUnion("type", [
          CreativeWorkStub.creativeWorkStubJsonZodSchema(),
          EventStub.eventStubJsonZodSchema(),
        ])
        .array(),
      url: zod.object({ "@id": zod.string().min(1) }).optional(),
    });
  }
}
export abstract class Intangible extends Thing {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type:
    | "GenderType"
    | "Invoice"
    | "MonetaryAmount"
    | "Occupation"
    | "Order"
    | "QuantitativeValue"
    | "Role";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(parameters: ConstructorParameters<typeof Thing>[0]) {
    super(parameters);
  }

  override toRdf({
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
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Intangible {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = intangibleJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing._propertiesFromJson(_jsonObject);
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
          Enumeration.fromJson(json) as purify.Either<zod.ZodError, Intangible>,
      )
      .altLazy(
        () =>
          StructuredValue.fromJson(json) as purify.Either<
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
      );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing._propertiesFromRdf>
    >
  > {
    const _super0Either = Thing._propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof Intangible._propertiesFromRdf>[0],
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
          Enumeration.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            Intangible
          >,
      )
      .altLazy(
        () =>
          StructuredValue.fromRdf(otherParameters) as purify.Either<
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
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(intangibleJsonZodSchema());
  }

  export function intangibleJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Thing.thingJsonUiSchema({ scopePrefix })],
      label: "Intangible",
      type: "Group",
    };
  }

  export function intangibleJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "GenderType",
          "Invoice",
          "MonetaryAmount",
          "Occupation",
          "Order",
          "QuantitativeValue",
          "Role",
        ]),
      }),
    );
  }
}
export class Role extends Intangible {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: Role): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, dateEquals))(
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
        ((left, right) => maybeEquals(left, right, booleanEquals))(
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
        ((left, right) => maybeEquals(left, right, dateEquals))(
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

  override toJson(): {
    readonly endDate: string | undefined;
    readonly roleName: { readonly "@id": string } | undefined;
    readonly startDate: string | undefined;
  } & ReturnType<Intangible["toJson"]> {
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
      } satisfies ReturnType<Role["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      endDate: purify.Maybe<Date>;
      roleName: purify.Maybe<rdfjs.NamedNode>;
      startDate: purify.Maybe<Date>;
    } & UnwrapR<ReturnType<typeof Intangible._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = roleJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible._propertiesFromJson(_jsonObject);
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
    return Role._propertiesFromJson(json).map(
      (properties) => new Role(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Intangible._propertiesFromRdf>>
  > {
    const _super0Either = Intangible._propertiesFromRdf({
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
    parameters: Parameters<typeof Role._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Role> {
    return Role._propertiesFromRdf(parameters).map(
      (properties) => new Role(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Role",
  );

  export function jsonSchema() {
    return zodToJsonSchema(roleJsonZodSchema());
  }

  export function roleJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Intangible.intangibleJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/endDate`, type: "Control" },
        { scope: `${scopePrefix}/properties/roleName`, type: "Control" },
        { scope: `${scopePrefix}/properties/startDate`, type: "Control" },
      ],
      label: "Role",
      type: "Group",
    };
  }

  export function roleJsonZodSchema() {
    return Intangible.intangibleJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Role"),
        endDate: zod.string().date().optional(),
        roleName: zod.object({ "@id": zod.string().min(1) }).optional(),
        startDate: zod.string().date().optional(),
      }),
    );
  }
}
export class Occupation extends Intangible {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "Occupation";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Intangible>[0],
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = occupationJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible._propertiesFromJson(_jsonObject);
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
    return Occupation._propertiesFromJson(json).map(
      (properties) => new Occupation(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible._propertiesFromRdf>
    >
  > {
    const _super0Either = Intangible._propertiesFromRdf({
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
    parameters: Parameters<typeof Occupation._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Occupation> {
    return Occupation._propertiesFromRdf(parameters).map(
      (properties) => new Occupation(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Occupation",
  );

  export function jsonSchema() {
    return zodToJsonSchema(occupationJsonZodSchema());
  }

  export function occupationJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Intangible.intangibleJsonUiSchema({ scopePrefix })],
      label: "Occupation",
      type: "Group",
    };
  }

  export function occupationJsonZodSchema() {
    return Intangible.intangibleJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Occupation"),
      }),
    );
  }
}
export abstract class StructuredValue extends Intangible {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type: "MonetaryAmount" | "QuantitativeValue";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(parameters: ConstructorParameters<typeof Intangible>[0]) {
    super(parameters);
  }

  override toRdf({
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
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace StructuredValue {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      structuredValueJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible._propertiesFromJson(_jsonObject);
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
    ).altLazy(
      () =>
        QuantitativeValue.fromJson(json) as purify.Either<
          zod.ZodError,
          StructuredValue
        >,
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible._propertiesFromRdf>
    >
  > {
    const _super0Either = Intangible._propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof StructuredValue._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, StructuredValue> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      MonetaryAmount.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        StructuredValue
      >
    ).altLazy(
      () =>
        QuantitativeValue.fromRdf(otherParameters) as purify.Either<
          rdfjsResource.Resource.ValueError,
          StructuredValue
        >,
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(structuredValueJsonZodSchema());
  }

  export function structuredValueJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Intangible.intangibleJsonUiSchema({ scopePrefix })],
      label: "StructuredValue",
      type: "Group",
    };
  }

  export function structuredValueJsonZodSchema() {
    return Intangible.intangibleJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["MonetaryAmount", "QuantitativeValue"]),
      }),
    );
  }
}
export abstract class CreativeWork extends Thing {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type:
    | "Article"
    | "ImageObject"
    | "Message"
    | "Report"
    | "TextObject";
  readonly about: readonly ThingStub[];
  readonly authors: readonly AgentStub[];
  readonly datePublished: purify.Maybe<Date>;
  readonly isBasedOn: readonly rdfjs.NamedNode[];

  constructor(
    parameters: {
      readonly about?: readonly ThingStub[];
      readonly authors?: readonly AgentStub[];
      readonly datePublished?: Date | purify.Maybe<Date>;
      readonly isBasedOn?: readonly rdfjs.NamedNode[];
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
  }

  override equals(other: CreativeWork): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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
        ((left, right) => arrayEquals(left, right, AgentStub.equals))(
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
        ((left, right) => maybeEquals(left, right, dateEquals))(
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
        ((left, right) => arrayEquals(left, right, booleanEquals))(
          this.isBasedOn,
          other.isBasedOn,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "isBasedOn",
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

    return _hasher;
  }

  override toJson(): {
    readonly about: readonly ReturnType<ThingStub["toJson"]>[];
    readonly authors: readonly (
      | ReturnType<OrganizationStub["toJson"]>
      | ReturnType<PersonStub["toJson"]>
    )[];
    readonly datePublished: string | undefined;
    readonly isBasedOn: readonly { readonly "@id": string }[];
  } & ReturnType<Thing["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        about: this.about.map((_item) => _item.toJson()),
        authors: this.authors.map((_item) => _item.toJson()),
        datePublished: this.datePublished
          .map((_item) => _item.toISOString())
          .extract(),
        isBasedOn: this.isBasedOn.map((_item) => ({ "@id": _item.value })),
      } satisfies ReturnType<CreativeWork["toJson"]>),
    );
  }

  override toRdf({
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
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace CreativeWork {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      about: readonly ThingStub[];
      authors: readonly AgentStub[];
      datePublished: purify.Maybe<Date>;
      isBasedOn: readonly rdfjs.NamedNode[];
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = creativeWorkJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing._propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const about = _jsonObject["about"].map((_item) =>
      ThingStub.fromJson(_item).unsafeCoerce(),
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
    return purify.Either.of({
      ..._super0,
      identifier,
      about,
      authors,
      datePublished,
      isBasedOn,
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, CreativeWork> {
    return (Article.fromJson(json) as purify.Either<zod.ZodError, CreativeWork>)
      .altLazy(
        () =>
          MediaObject.fromJson(json) as purify.Either<
            zod.ZodError,
            CreativeWork
          >,
      )
      .altLazy(
        () =>
          Message.fromJson(json) as purify.Either<zod.ZodError, CreativeWork>,
      );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromRdf>>
  > {
    const _super0Either = Thing._propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
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
              ThingStub.fromRdf({
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
    return purify.Either.of({
      ..._super0,
      identifier,
      about,
      authors,
      datePublished,
      isBasedOn,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof CreativeWork._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, CreativeWork> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      Article.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        CreativeWork
      >
    )
      .altLazy(
        () =>
          MediaObject.fromRdf(otherParameters) as purify.Either<
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
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(creativeWorkJsonZodSchema());
  }

  export function creativeWorkJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Thing.thingJsonUiSchema({ scopePrefix }),
        ThingStub.thingStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/about`,
        }),
        { scope: `${scopePrefix}/properties/authors`, type: "Control" },
        { scope: `${scopePrefix}/properties/datePublished`, type: "Control" },
        { scope: `${scopePrefix}/properties/isBasedOn`, type: "Control" },
      ],
      label: "CreativeWork",
      type: "Group",
    };
  }

  export function creativeWorkJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "Article",
          "ImageObject",
          "Message",
          "Report",
          "TextObject",
        ]),
        about: ThingStub.thingStubJsonZodSchema().array(),
        authors: AgentStub.jsonZodSchema().array(),
        datePublished: zod.string().datetime().optional(),
        isBasedOn: zod.object({ "@id": zod.string().min(1) }).array(),
      }),
    );
  }
}
export abstract class MediaObject extends CreativeWork {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type: "ImageObject" | "TextObject";
  readonly contentUrl: purify.Maybe<rdfjs.NamedNode>;
  readonly encodingFormat: purify.Maybe<string>;
  readonly height: purify.Maybe<QuantitativeValue>;
  readonly width: purify.Maybe<QuantitativeValue>;

  constructor(
    parameters: {
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

  override equals(other: MediaObject): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, booleanEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
          maybeEquals(left, right, (left, right) => left.equals(right)))(
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
          maybeEquals(left, right, (left, right) => left.equals(right)))(
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

  override toJson(): {
    readonly contentUrl: { readonly "@id": string } | undefined;
    readonly encodingFormat: string | undefined;
    readonly height: ReturnType<QuantitativeValue["toJson"]> | undefined;
    readonly width: ReturnType<QuantitativeValue["toJson"]> | undefined;
  } & ReturnType<CreativeWork["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        contentUrl: this.contentUrl
          .map((_item) => ({ "@id": _item.value }))
          .extract(),
        encodingFormat: this.encodingFormat.map((_item) => _item).extract(),
        height: this.height.map((_item) => _item.toJson()).extract(),
        width: this.width.map((_item) => _item.toJson()).extract(),
      } satisfies ReturnType<MediaObject["toJson"]>),
    );
  }

  override toRdf({
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

export namespace MediaObject {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      contentUrl: purify.Maybe<rdfjs.NamedNode>;
      encodingFormat: purify.Maybe<string>;
      height: purify.Maybe<QuantitativeValue>;
      width: purify.Maybe<QuantitativeValue>;
    } & UnwrapR<ReturnType<typeof CreativeWork._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = mediaObjectJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWork._propertiesFromJson(_jsonObject);
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
    ).altLazy(
      () =>
        ImageObject.fromJson(json) as purify.Either<zod.ZodError, MediaObject>,
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof CreativeWork._propertiesFromRdf>>
  > {
    const _super0Either = CreativeWork._propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
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
    parameters: Parameters<typeof MediaObject._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MediaObject> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      TextObject.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        MediaObject
      >
    ).altLazy(
      () =>
        ImageObject.fromRdf(otherParameters) as purify.Either<
          rdfjsResource.Resource.ValueError,
          MediaObject
        >,
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(mediaObjectJsonZodSchema());
  }

  export function mediaObjectJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWork.creativeWorkJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/contentUrl`, type: "Control" },
        { scope: `${scopePrefix}/properties/encodingFormat`, type: "Control" },
        QuantitativeValue.quantitativeValueJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/height`,
        }),
        QuantitativeValue.quantitativeValueJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/width`,
        }),
      ],
      label: "MediaObject",
      type: "Group",
    };
  }

  export function mediaObjectJsonZodSchema() {
    return CreativeWork.creativeWorkJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["ImageObject", "TextObject"]),
        contentUrl: zod.object({ "@id": zod.string().min(1) }).optional(),
        encodingFormat: zod.string().optional(),
        height: QuantitativeValue.quantitativeValueJsonZodSchema().optional(),
        width: QuantitativeValue.quantitativeValueJsonZodSchema().optional(),
      }),
    );
  }
}
export class ImageObject extends MediaObject {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "ImageObject";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof MediaObject>[0],
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObject._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = imageObjectJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = MediaObject._propertiesFromJson(_jsonObject);
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
    return ImageObject._propertiesFromJson(json).map(
      (properties) => new ImageObject(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObject._propertiesFromRdf>
    >
  > {
    const _super0Either = MediaObject._propertiesFromRdf({
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
    parameters: Parameters<typeof ImageObject._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ImageObject> {
    return ImageObject._propertiesFromRdf(parameters).map(
      (properties) => new ImageObject(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/ImageObject",
  );

  export function jsonSchema() {
    return zodToJsonSchema(imageObjectJsonZodSchema());
  }

  export function imageObjectJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [MediaObject.mediaObjectJsonUiSchema({ scopePrefix })],
      label: "ImageObject",
      type: "Group",
    };
  }

  export function imageObjectJsonZodSchema() {
    return MediaObject.mediaObjectJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("ImageObject"),
      }),
    );
  }
}
export abstract class Enumeration extends Intangible {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type: "GenderType";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(parameters: ConstructorParameters<typeof Intangible>[0]) {
    super(parameters);
  }

  override toRdf({
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
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Enumeration {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = enumerationJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible._propertiesFromJson(_jsonObject);
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
    return GenderType.fromJson(json) as purify.Either<
      zod.ZodError,
      Enumeration
    >;
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible._propertiesFromRdf>
    >
  > {
    const _super0Either = Intangible._propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof Enumeration._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Enumeration> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return GenderType.fromRdf(otherParameters) as purify.Either<
      rdfjsResource.Resource.ValueError,
      Enumeration
    >;
  }

  export function jsonSchema() {
    return zodToJsonSchema(enumerationJsonZodSchema());
  }

  export function enumerationJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Intangible.intangibleJsonUiSchema({ scopePrefix })],
      label: "Enumeration",
      type: "Group",
    };
  }

  export function enumerationJsonZodSchema() {
    return Intangible.intangibleJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("GenderType"),
      }),
    );
  }
}
export class GenderType extends Enumeration {
  readonly identifier: rdfjs.NamedNode<
    "http://schema.org/Female" | "http://schema.org/Male"
  >;
  override readonly type = "GenderType";

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
    if (typeof parameters.identifier === "object") {
      this.identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this.identifier = dataFactory.namedNode(parameters.identifier);
    } else {
      this.identifier = parameters.identifier as never;
    }
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.NamedNode<
        "http://schema.org/Female" | "http://schema.org/Male"
      >;
    } & UnwrapR<ReturnType<typeof Enumeration._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = genderTypeJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Enumeration._propertiesFromJson(_jsonObject);
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
    return GenderType._propertiesFromJson(json).map(
      (properties) => new GenderType(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Enumeration._propertiesFromRdf>>
  > {
    const _super0Either = Enumeration._propertiesFromRdf({
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
    parameters: Parameters<typeof GenderType._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, GenderType> {
    return GenderType._propertiesFromRdf(parameters).map(
      (properties) => new GenderType(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/GenderType",
  );

  export function jsonSchema() {
    return zodToJsonSchema(genderTypeJsonZodSchema());
  }

  export function genderTypeJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Enumeration.enumerationJsonUiSchema({ scopePrefix })],
      label: "GenderType",
      type: "Group",
    };
  }

  export function genderTypeJsonZodSchema() {
    return Enumeration.enumerationJsonZodSchema().merge(
      zod.object({
        "@id": zod.enum(["http://schema.org/Female", "http://schema.org/Male"]),
        type: zod.literal("GenderType"),
      }),
    );
  }
}
export class Action extends Thing {
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: Action): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => arrayEquals(left, right, AgentStub.equals))(
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
        ((left, right) => maybeEquals(left, right, dateEquals))(
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
        ((left, right) => arrayEquals(left, right, AgentStub.equals))(
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
        ((left, right) => maybeEquals(left, right, dateEquals))(
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

  override toJson(): {
    readonly agents: readonly (
      | ReturnType<OrganizationStub["toJson"]>
      | ReturnType<PersonStub["toJson"]>
    )[];
    readonly endTime: string | undefined;
    readonly participants: readonly (
      | ReturnType<OrganizationStub["toJson"]>
      | ReturnType<PersonStub["toJson"]>
    )[];
    readonly startTime: string | undefined;
  } & ReturnType<Thing["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        agents: this.agents.map((_item) => _item.toJson()),
        endTime: this.endTime.map((_item) => _item.toISOString()).extract(),
        participants: this.participants.map((_item) => _item.toJson()),
        startTime: this.startTime.map((_item) => _item.toISOString()).extract(),
      } satisfies ReturnType<Action["toJson"]>),
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

export namespace Action {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      agents: readonly AgentStub[];
      endTime: purify.Maybe<Date>;
      participants: readonly AgentStub[];
      startTime: purify.Maybe<Date>;
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = actionJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing._propertiesFromJson(_jsonObject);
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
      AssessAction.fromJson(json) as purify.Either<zod.ZodError, Action>
    ).altLazy(() =>
      Action._propertiesFromJson(json).map(
        (properties) => new Action(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromRdf>>
  > {
    const _super0Either = Thing._propertiesFromRdf({
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
    parameters: Parameters<typeof Action._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Action> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      AssessAction.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Action
      >
    ).altLazy(() =>
      Action._propertiesFromRdf(parameters).map(
        (properties) => new Action(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Action",
  );

  export function jsonSchema() {
    return zodToJsonSchema(actionJsonZodSchema());
  }

  export function actionJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Thing.thingJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/agents`, type: "Control" },
        { scope: `${scopePrefix}/properties/endTime`, type: "Control" },
        { scope: `${scopePrefix}/properties/participants`, type: "Control" },
        { scope: `${scopePrefix}/properties/startTime`, type: "Control" },
      ],
      label: "Action",
      type: "Group",
    };
  }

  export function actionJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "Action",
          "AssessAction",
          "ChooseAction",
          "VoteAction",
        ]),
        agents: AgentStub.jsonZodSchema().array(),
        endTime: zod.string().datetime().optional(),
        participants: AgentStub.jsonZodSchema().array(),
        startTime: zod.string().datetime().optional(),
      }),
    );
  }
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

export namespace AssessAction {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Action._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = assessActionJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Action._propertiesFromJson(_jsonObject);
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
      ChooseAction.fromJson(json) as purify.Either<zod.ZodError, AssessAction>
    ).altLazy(() =>
      AssessAction._propertiesFromJson(json).map(
        (properties) => new AssessAction(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Action._propertiesFromRdf>
    >
  > {
    const _super0Either = Action._propertiesFromRdf({
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
    parameters: Parameters<typeof AssessAction._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, AssessAction> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ChooseAction.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        AssessAction
      >
    ).altLazy(() =>
      AssessAction._propertiesFromRdf(parameters).map(
        (properties) => new AssessAction(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/AssessAction",
  );

  export function jsonSchema() {
    return zodToJsonSchema(assessActionJsonZodSchema());
  }

  export function assessActionJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Action.actionJsonUiSchema({ scopePrefix })],
      label: "AssessAction",
      type: "Group",
    };
  }

  export function assessActionJsonZodSchema() {
    return Action.actionJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["AssessAction", "ChooseAction", "VoteAction"]),
      }),
    );
  }
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

export namespace ChooseAction {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof AssessAction._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = chooseActionJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = AssessAction._propertiesFromJson(_jsonObject);
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
      ChooseAction._propertiesFromJson(json).map(
        (properties) => new ChooseAction(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof AssessAction._propertiesFromRdf>
    >
  > {
    const _super0Either = AssessAction._propertiesFromRdf({
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
    parameters: Parameters<typeof ChooseAction._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ChooseAction> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      VoteAction.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ChooseAction
      >
    ).altLazy(() =>
      ChooseAction._propertiesFromRdf(parameters).map(
        (properties) => new ChooseAction(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/ChooseAction",
  );

  export function jsonSchema() {
    return zodToJsonSchema(chooseActionJsonZodSchema());
  }

  export function chooseActionJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [AssessAction.assessActionJsonUiSchema({ scopePrefix })],
      label: "ChooseAction",
      type: "Group",
    };
  }

  export function chooseActionJsonZodSchema() {
    return AssessAction.assessActionJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["ChooseAction", "VoteAction"]),
      }),
    );
  }
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ChooseAction._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = voteActionJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ChooseAction._propertiesFromJson(_jsonObject);
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
    return VoteAction._propertiesFromJson(json).map(
      (properties) => new VoteAction(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ChooseAction._propertiesFromRdf>
    >
  > {
    const _super0Either = ChooseAction._propertiesFromRdf({
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
    parameters: Parameters<typeof VoteAction._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, VoteAction> {
    return VoteAction._propertiesFromRdf(parameters).map(
      (properties) => new VoteAction(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/VoteAction",
  );

  export function jsonSchema() {
    return zodToJsonSchema(voteActionJsonZodSchema());
  }

  export function voteActionJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ChooseAction.chooseActionJsonUiSchema({ scopePrefix })],
      label: "VoteAction",
      type: "Group",
    };
  }

  export function voteActionJsonZodSchema() {
    return ChooseAction.chooseActionJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("VoteAction"),
      }),
    );
  }
}
export abstract class ThingStub {
  abstract readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract readonly type:
    | "ActionStub"
    | "ArticleStub"
    | "AssessActionStub"
    | "ChooseActionStub"
    | "CreativeWorkStub"
    | "EventStub"
    | "InvoiceStub"
    | "MediaObjectStub"
    | "MessageStub"
    | "MonetaryAmountStub"
    | "OrderStub"
    | "OrganizationStub"
    | "PersonStub"
    | "PlaceStub"
    | "QuantitativeValueStub"
    | "ReportStub"
    | "TextObjectStub"
    | "VoteActionStub";
  readonly name: purify.Maybe<string>;
  readonly order: purify.Maybe<number>;

  constructor(parameters: {
    readonly name?: purify.Maybe<string> | string;
    readonly order?: number | purify.Maybe<number>;
  }) {
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

  equals(other: ThingStub): EqualsResult {
    return booleanEquals(this.identifier, other.identifier)
      .mapLeft((propertyValuesUnequal) => ({
        left: this,
        right: other,
        propertyName: "identifier",
        propertyValuesUnequal,
        type: "Property" as const,
      }))
      .chain(() =>
        strictEquals(this.type, other.type).mapLeft(
          (propertyValuesUnequal) => ({
            left: this,
            right: other,
            propertyName: "type",
            propertyValuesUnequal,
            type: "Property" as const,
          }),
        ),
      )
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
    this.name.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    this.order.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    return _hasher;
  }

  toJson(): {
    readonly "@id": string;
    readonly type:
      | "ActionStub"
      | "ArticleStub"
      | "AssessActionStub"
      | "ChooseActionStub"
      | "CreativeWorkStub"
      | "EventStub"
      | "InvoiceStub"
      | "MediaObjectStub"
      | "MessageStub"
      | "MonetaryAmountStub"
      | "OrderStub"
      | "OrganizationStub"
      | "PersonStub"
      | "PlaceStub"
      | "QuantitativeValueStub"
      | "ReportStub"
      | "TextObjectStub"
      | "VoteActionStub";
    readonly name: string | undefined;
    readonly order: number | undefined;
  } {
    return JSON.parse(
      JSON.stringify({
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        type: this.type,
        name: this.name.map((_item) => _item).extract(),
        order: this.order.map((_item) => _item).extract(),
      } satisfies ReturnType<ThingStub["toJson"]>),
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
    _resource.add(dataFactory.namedNode("http://schema.org/name"), this.name);
    _resource.add(
      dataFactory.namedNode("http://www.w3.org/ns/shacl#order"),
      this.order,
    );
    return _resource;
  }

  toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace ThingStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      name: purify.Maybe<string>;
      order: purify.Maybe<number>;
    }
  > {
    const _jsonSafeParseResult = thingStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const name = purify.Maybe.fromNullable(_jsonObject["name"]);
    const order = purify.Maybe.fromNullable(_jsonObject["order"]);
    return purify.Either.of({ identifier, name, order });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, ThingStub> {
    return (ActionStub.fromJson(json) as purify.Either<zod.ZodError, ThingStub>)
      .altLazy(
        () =>
          OrganizationStub.fromJson(json) as purify.Either<
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
          CreativeWorkStub.fromJson(json) as purify.Either<
            zod.ZodError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          EventStub.fromJson(json) as purify.Either<zod.ZodError, ThingStub>,
      )
      .altLazy(
        () =>
          IntangibleStub.fromJson(json) as purify.Either<
            zod.ZodError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          PlaceStub.fromJson(json) as purify.Either<zod.ZodError, ThingStub>,
      );
  }

  export function _propertiesFromRdf({
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
    }
  > {
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
    return purify.Either.of({ identifier, name, order });
  }

  export function fromRdf(
    parameters: Parameters<typeof ThingStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ThingStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ActionStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ThingStub
      >
    )
      .altLazy(
        () =>
          OrganizationStub.fromRdf(otherParameters) as purify.Either<
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
          CreativeWorkStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          EventStub.fromRdf(otherParameters) as purify.Either<
            rdfjsResource.Resource.ValueError,
            ThingStub
          >,
      )
      .altLazy(
        () =>
          IntangibleStub.fromRdf(otherParameters) as purify.Either<
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
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(thingStubJsonZodSchema());
  }

  export function thingStubJsonUiSchema(parameters?: { scopePrefix?: string }) {
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
              schema: { const: "ThingStub" },
              scope: `${scopePrefix}/properties/type`,
            },
            effect: "HIDE",
          },
          scope: `${scopePrefix}/properties/type`,
          type: "Control",
        },
        { scope: `${scopePrefix}/properties/name`, type: "Control" },
        { scope: `${scopePrefix}/properties/order`, type: "Control" },
      ],
      label: "ThingStub",
      type: "Group",
    };
  }

  export function thingStubJsonZodSchema() {
    return zod.object({
      "@id": zod.string().min(1),
      type: zod.enum([
        "ActionStub",
        "ArticleStub",
        "AssessActionStub",
        "ChooseActionStub",
        "CreativeWorkStub",
        "EventStub",
        "InvoiceStub",
        "MediaObjectStub",
        "MessageStub",
        "MonetaryAmountStub",
        "OrderStub",
        "OrganizationStub",
        "PersonStub",
        "PlaceStub",
        "QuantitativeValueStub",
        "ReportStub",
        "TextObjectStub",
        "VoteActionStub",
      ]),
      name: zod.string().optional(),
      order: zod.number().optional(),
    });
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
        ThingStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ThingStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      ThingStub.sparqlConstructQuery(parameters),
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
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type:
    | "ActionStub"
    | "AssessActionStub"
    | "ChooseActionStub"
    | "VoteActionStub" = "ActionStub";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
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

export namespace ActionStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = actionStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStub._propertiesFromJson(_jsonObject);
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
      AssessActionStub.fromJson(json) as purify.Either<zod.ZodError, ActionStub>
    ).altLazy(() =>
      ActionStub._propertiesFromJson(json).map(
        (properties) => new ActionStub(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStub._propertiesFromRdf({
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
    parameters: Parameters<typeof ActionStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ActionStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      AssessActionStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ActionStub
      >
    ).altLazy(() =>
      ActionStub._propertiesFromRdf(parameters).map(
        (properties) => new ActionStub(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Action",
  );

  export function jsonSchema() {
    return zodToJsonSchema(actionStubJsonZodSchema());
  }

  export function actionStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStub.thingStubJsonUiSchema({ scopePrefix })],
      label: "ActionStub",
      type: "Group",
    };
  }

  export function actionStubJsonZodSchema() {
    return ThingStub.thingStubJsonZodSchema().merge(
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
        ActionStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ActionStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      ActionStub.sparqlConstructQuery(parameters),
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
      ...ThingStub.sparqlConstructTemplateTriples({
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
      ...ThingStub.sparqlWherePatterns({
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

export namespace AssessActionStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ActionStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      assessActionStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ActionStub._propertiesFromJson(_jsonObject);
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
      ChooseActionStub.fromJson(json) as purify.Either<
        zod.ZodError,
        AssessActionStub
      >
    ).altLazy(() =>
      AssessActionStub._propertiesFromJson(json).map(
        (properties) => new AssessActionStub(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ActionStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ActionStub._propertiesFromRdf({
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
    parameters: Parameters<typeof AssessActionStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, AssessActionStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ChooseActionStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        AssessActionStub
      >
    ).altLazy(() =>
      AssessActionStub._propertiesFromRdf(parameters).map(
        (properties) => new AssessActionStub(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/AssessAction",
  );

  export function jsonSchema() {
    return zodToJsonSchema(assessActionStubJsonZodSchema());
  }

  export function assessActionStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ActionStub.actionStubJsonUiSchema({ scopePrefix })],
      label: "AssessActionStub",
      type: "Group",
    };
  }

  export function assessActionStubJsonZodSchema() {
    return ActionStub.actionStubJsonZodSchema().merge(
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
        AssessActionStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        AssessActionStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      AssessActionStub.sparqlConstructQuery(parameters),
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
      ...ActionStub.sparqlConstructTemplateTriples({
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
      ...ActionStub.sparqlWherePatterns({
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

export namespace ChooseActionStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof AssessActionStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      chooseActionStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = AssessActionStub._propertiesFromJson(_jsonObject);
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
      ChooseActionStub._propertiesFromJson(json).map(
        (properties) => new ChooseActionStub(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof AssessActionStub._propertiesFromRdf>
    >
  > {
    const _super0Either = AssessActionStub._propertiesFromRdf({
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
    parameters: Parameters<typeof ChooseActionStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ChooseActionStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      VoteActionStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ChooseActionStub
      >
    ).altLazy(() =>
      ChooseActionStub._propertiesFromRdf(parameters).map(
        (properties) => new ChooseActionStub(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/ChooseAction",
  );

  export function jsonSchema() {
    return zodToJsonSchema(chooseActionStubJsonZodSchema());
  }

  export function chooseActionStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        AssessActionStub.assessActionStubJsonUiSchema({ scopePrefix }),
      ],
      label: "ChooseActionStub",
      type: "Group",
    };
  }

  export function chooseActionStubJsonZodSchema() {
    return AssessActionStub.assessActionStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["ChooseActionStub", "VoteActionStub"]),
      }),
    );
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
        ChooseActionStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ChooseActionStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      ChooseActionStub.sparqlConstructQuery(parameters),
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
      ...AssessActionStub.sparqlConstructTemplateTriples({
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
      ...AssessActionStub.sparqlWherePatterns({
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ChooseActionStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = voteActionStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ChooseActionStub._propertiesFromJson(_jsonObject);
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
    return VoteActionStub._propertiesFromJson(json).map(
      (properties) => new VoteActionStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ChooseActionStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ChooseActionStub._propertiesFromRdf({
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
    parameters: Parameters<typeof VoteActionStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, VoteActionStub> {
    return VoteActionStub._propertiesFromRdf(parameters).map(
      (properties) => new VoteActionStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/VoteAction",
  );

  export function jsonSchema() {
    return zodToJsonSchema(voteActionStubJsonZodSchema());
  }

  export function voteActionStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ChooseActionStub.chooseActionStubJsonUiSchema({ scopePrefix }),
      ],
      label: "VoteActionStub",
      type: "Group",
    };
  }

  export function voteActionStubJsonZodSchema() {
    return ChooseActionStub.chooseActionStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("VoteActionStub"),
      }),
    );
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
      ...ChooseActionStub.sparqlConstructTemplateTriples({
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
      ...ChooseActionStub.sparqlWherePatterns({
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
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "TextObject";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof MediaObject>[0],
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

export namespace TextObject {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObject._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = textObjectJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = MediaObject._propertiesFromJson(_jsonObject);
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
  ): purify.Either<zod.ZodError, TextObject> {
    return TextObject._propertiesFromJson(json).map(
      (properties) => new TextObject(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObject._propertiesFromRdf>
    >
  > {
    const _super0Either = MediaObject._propertiesFromRdf({
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
    parameters: Parameters<typeof TextObject._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, TextObject> {
    return TextObject._propertiesFromRdf(parameters).map(
      (properties) => new TextObject(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/TextObject",
  );

  export function jsonSchema() {
    return zodToJsonSchema(textObjectJsonZodSchema());
  }

  export function textObjectJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [MediaObject.mediaObjectJsonUiSchema({ scopePrefix })],
      label: "TextObject",
      type: "Group",
    };
  }

  export function textObjectJsonZodSchema() {
    return MediaObject.mediaObjectJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("TextObject"),
      }),
    );
  }
}
export class CreativeWorkStub extends ThingStub {
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type:
    | "ArticleStub"
    | "CreativeWorkStub"
    | "MediaObjectStub"
    | "MessageStub"
    | "ReportStub"
    | "TextObjectStub" = "CreativeWorkStub";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
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

export namespace CreativeWorkStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      creativeWorkStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStub._propertiesFromJson(_jsonObject);
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
      ArticleStub.fromJson(json) as purify.Either<
        zod.ZodError,
        CreativeWorkStub
      >
    )
      .altLazy(
        () =>
          MediaObjectStub.fromJson(json) as purify.Either<
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
      .altLazy(() =>
        CreativeWorkStub._propertiesFromJson(json).map(
          (properties) => new CreativeWorkStub(properties),
        ),
      );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStub._propertiesFromRdf({
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
    parameters: Parameters<typeof CreativeWorkStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, CreativeWorkStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ArticleStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        CreativeWorkStub
      >
    )
      .altLazy(
        () =>
          MediaObjectStub.fromRdf(otherParameters) as purify.Either<
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
      .altLazy(() =>
        CreativeWorkStub._propertiesFromRdf(parameters).map(
          (properties) => new CreativeWorkStub(properties),
        ),
      );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/CreativeWork",
  );

  export function jsonSchema() {
    return zodToJsonSchema(creativeWorkStubJsonZodSchema());
  }

  export function creativeWorkStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStub.thingStubJsonUiSchema({ scopePrefix })],
      label: "CreativeWorkStub",
      type: "Group",
    };
  }

  export function creativeWorkStubJsonZodSchema() {
    return ThingStub.thingStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "ArticleStub",
          "CreativeWorkStub",
          "MediaObjectStub",
          "MessageStub",
          "ReportStub",
          "TextObjectStub",
        ]),
      }),
    );
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
        CreativeWorkStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        CreativeWorkStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      CreativeWorkStub.sparqlConstructQuery(parameters),
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
      ...ThingStub.sparqlConstructTemplateTriples({
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
      ...ThingStub.sparqlWherePatterns({
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

export namespace MediaObjectStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWorkStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      mediaObjectStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStub._propertiesFromJson(_jsonObject);
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
      MediaObjectStub._propertiesFromJson(json).map(
        (properties) => new MediaObjectStub(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWorkStub._propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStub._propertiesFromRdf({
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
    parameters: Parameters<typeof MediaObjectStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MediaObjectStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      TextObjectStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        MediaObjectStub
      >
    ).altLazy(() =>
      MediaObjectStub._propertiesFromRdf(parameters).map(
        (properties) => new MediaObjectStub(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MediaObject",
  );

  export function jsonSchema() {
    return zodToJsonSchema(mediaObjectStubJsonZodSchema());
  }

  export function mediaObjectStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStub.creativeWorkStubJsonUiSchema({ scopePrefix }),
      ],
      label: "MediaObjectStub",
      type: "Group",
    };
  }

  export function mediaObjectStubJsonZodSchema() {
    return CreativeWorkStub.creativeWorkStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["MediaObjectStub", "TextObjectStub"]),
      }),
    );
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
        MediaObjectStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        MediaObjectStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      MediaObjectStub.sparqlConstructQuery(parameters),
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
      ...CreativeWorkStub.sparqlConstructTemplateTriples({
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
      ...CreativeWorkStub.sparqlWherePatterns({
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObjectStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = textObjectStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = MediaObjectStub._propertiesFromJson(_jsonObject);
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
    return TextObjectStub._propertiesFromJson(json).map(
      (properties) => new TextObjectStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObjectStub._propertiesFromRdf>
    >
  > {
    const _super0Either = MediaObjectStub._propertiesFromRdf({
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
    parameters: Parameters<typeof TextObjectStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, TextObjectStub> {
    return TextObjectStub._propertiesFromRdf(parameters).map(
      (properties) => new TextObjectStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/TextObject",
  );

  export function jsonSchema() {
    return zodToJsonSchema(textObjectStubJsonZodSchema());
  }

  export function textObjectStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [MediaObjectStub.mediaObjectStubJsonUiSchema({ scopePrefix })],
      label: "TextObjectStub",
      type: "Group",
    };
  }

  export function textObjectStubJsonZodSchema() {
    return MediaObjectStub.mediaObjectStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("TextObjectStub"),
      }),
    );
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
      ...MediaObjectStub.sparqlConstructTemplateTriples({
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
      ...MediaObjectStub.sparqlWherePatterns({
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
export class Article extends CreativeWork {
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type: "Article" | "Report" = "Article";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof CreativeWork>[0],
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

export namespace Article {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWork._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = articleJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWork._propertiesFromJson(_jsonObject);
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
      Article._propertiesFromJson(json).map(
        (properties) => new Article(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWork._propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWork._propertiesFromRdf({
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
    parameters: Parameters<typeof Article._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Article> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      Report.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        Article
      >
    ).altLazy(() =>
      Article._propertiesFromRdf(parameters).map(
        (properties) => new Article(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Article",
  );

  export function jsonSchema() {
    return zodToJsonSchema(articleJsonZodSchema());
  }

  export function articleJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [CreativeWork.creativeWorkJsonUiSchema({ scopePrefix })],
      label: "Article",
      type: "Group",
    };
  }

  export function articleJsonZodSchema() {
    return CreativeWork.creativeWorkJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["Article", "Report"]),
      }),
    );
  }
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Article._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = reportJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Article._propertiesFromJson(_jsonObject);
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
    return Report._propertiesFromJson(json).map(
      (properties) => new Report(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Article._propertiesFromRdf>
    >
  > {
    const _super0Either = Article._propertiesFromRdf({
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
    parameters: Parameters<typeof Report._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Report> {
    return Report._propertiesFromRdf(parameters).map(
      (properties) => new Report(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Report",
  );

  export function jsonSchema() {
    return zodToJsonSchema(reportJsonZodSchema());
  }

  export function reportJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Article.articleJsonUiSchema({ scopePrefix })],
      label: "Report",
      type: "Group",
    };
  }

  export function reportJsonZodSchema() {
    return Article.articleJsonZodSchema().merge(
      zod.object({ "@id": zod.string().min(1), type: zod.literal("Report") }),
    );
  }
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

export namespace ArticleStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWorkStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = articleStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStub._propertiesFromJson(_jsonObject);
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
      ArticleStub._propertiesFromJson(json).map(
        (properties) => new ArticleStub(properties),
      ),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWorkStub._propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStub._propertiesFromRdf({
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
    parameters: Parameters<typeof ArticleStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ArticleStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      ReportStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        ArticleStub
      >
    ).altLazy(() =>
      ArticleStub._propertiesFromRdf(parameters).map(
        (properties) => new ArticleStub(properties),
      ),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Article",
  );

  export function jsonSchema() {
    return zodToJsonSchema(articleStubJsonZodSchema());
  }

  export function articleStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStub.creativeWorkStubJsonUiSchema({ scopePrefix }),
      ],
      label: "ArticleStub",
      type: "Group",
    };
  }

  export function articleStubJsonZodSchema() {
    return CreativeWorkStub.creativeWorkStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["ArticleStub", "ReportStub"]),
      }),
    );
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
        ArticleStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        ArticleStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      ArticleStub.sparqlConstructQuery(parameters),
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
      ...CreativeWorkStub.sparqlConstructTemplateTriples({
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
      ...CreativeWorkStub.sparqlWherePatterns({
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ArticleStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = reportStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ArticleStub._propertiesFromJson(_jsonObject);
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
    return ReportStub._propertiesFromJson(json).map(
      (properties) => new ReportStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ArticleStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ArticleStub._propertiesFromRdf({
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
    parameters: Parameters<typeof ReportStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ReportStub> {
    return ReportStub._propertiesFromRdf(parameters).map(
      (properties) => new ReportStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Report",
  );

  export function jsonSchema() {
    return zodToJsonSchema(reportStubJsonZodSchema());
  }

  export function reportStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ArticleStub.articleStubJsonUiSchema({ scopePrefix })],
      label: "ReportStub",
      type: "Group",
    };
  }

  export function reportStubJsonZodSchema() {
    return ArticleStub.articleStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("ReportStub"),
      }),
    );
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
      ...ArticleStub.sparqlConstructTemplateTriples({
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
      ...ArticleStub.sparqlWherePatterns({
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
export class QuantitativeValue extends StructuredValue {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: QuantitativeValue): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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

  override toJson(): {
    readonly unitText: string | undefined;
    readonly value: number | undefined;
  } & ReturnType<StructuredValue["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        unitText: this.unitText.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies ReturnType<QuantitativeValue["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      unitText: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & UnwrapR<ReturnType<typeof StructuredValue._propertiesFromJson>>
  > {
    const _jsonSafeParseResult =
      quantitativeValueJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = StructuredValue._propertiesFromJson(_jsonObject);
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
    return QuantitativeValue._propertiesFromJson(json).map(
      (properties) => new QuantitativeValue(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof StructuredValue._propertiesFromRdf>>
  > {
    const _super0Either = StructuredValue._propertiesFromRdf({
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
    parameters: Parameters<typeof QuantitativeValue._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, QuantitativeValue> {
    return QuantitativeValue._propertiesFromRdf(parameters).map(
      (properties) => new QuantitativeValue(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/QuantitativeValue",
  );

  export function jsonSchema() {
    return zodToJsonSchema(quantitativeValueJsonZodSchema());
  }

  export function quantitativeValueJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValue.structuredValueJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/unitText`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "QuantitativeValue",
      type: "Group",
    };
  }

  export function quantitativeValueJsonZodSchema() {
    return StructuredValue.structuredValueJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("QuantitativeValue"),
        unitText: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
  }
}
export abstract class IntangibleStub extends ThingStub {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type:
    | "InvoiceStub"
    | "MonetaryAmountStub"
    | "OrderStub"
    | "QuantitativeValueStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(parameters: ConstructorParameters<typeof ThingStub>[0]) {
    super(parameters);
  }

  override toRdf({
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
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace IntangibleStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = intangibleStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStub._propertiesFromJson(_jsonObject);
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
      InvoiceStub.fromJson(json) as purify.Either<zod.ZodError, IntangibleStub>
    )
      .altLazy(
        () =>
          StructuredValueStub.fromJson(json) as purify.Either<
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
      );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStub._propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof IntangibleStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, IntangibleStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      InvoiceStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        IntangibleStub
      >
    )
      .altLazy(
        () =>
          StructuredValueStub.fromRdf(otherParameters) as purify.Either<
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
      );
  }

  export function jsonSchema() {
    return zodToJsonSchema(intangibleStubJsonZodSchema());
  }

  export function intangibleStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStub.thingStubJsonUiSchema({ scopePrefix })],
      label: "IntangibleStub",
      type: "Group",
    };
  }

  export function intangibleStubJsonZodSchema() {
    return ThingStub.thingStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum([
          "InvoiceStub",
          "MonetaryAmountStub",
          "OrderStub",
          "QuantitativeValueStub",
        ]),
      }),
    );
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
        IntangibleStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        IntangibleStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      IntangibleStub.sparqlConstructQuery(parameters),
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
      ...ThingStub.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
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
      ...ThingStub.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
    ];
  }
}
export abstract class StructuredValueStub extends IntangibleStub {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type:
    | "MonetaryAmountStub"
    | "QuantitativeValueStub";

  // biome-ignore lint/complexity/noUselessConstructor: Always have a constructor
  constructor(parameters: ConstructorParameters<typeof IntangibleStub>[0]) {
    super(parameters);
  }

  override toRdf({
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
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace StructuredValueStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof IntangibleStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      structuredValueStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStub._propertiesFromJson(_jsonObject);
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
    ).altLazy(
      () =>
        QuantitativeValueStub.fromJson(json) as purify.Either<
          zod.ZodError,
          StructuredValueStub
        >,
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof IntangibleStub._propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStub._propertiesFromRdf({
      ..._context,
      ignoreRdfType: true,
      languageIn: _languageIn,
      resource: _resource,
    });
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof StructuredValueStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, StructuredValueStub> {
    const { ignoreRdfType: _ignoreRdfType, ...otherParameters } = parameters;
    return (
      MonetaryAmountStub.fromRdf(otherParameters) as purify.Either<
        rdfjsResource.Resource.ValueError,
        StructuredValueStub
      >
    ).altLazy(
      () =>
        QuantitativeValueStub.fromRdf(otherParameters) as purify.Either<
          rdfjsResource.Resource.ValueError,
          StructuredValueStub
        >,
    );
  }

  export function jsonSchema() {
    return zodToJsonSchema(structuredValueStubJsonZodSchema());
  }

  export function structuredValueStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStub.intangibleStubJsonUiSchema({ scopePrefix })],
      label: "StructuredValueStub",
      type: "Group",
    };
  }

  export function structuredValueStubJsonZodSchema() {
    return IntangibleStub.intangibleStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["MonetaryAmountStub", "QuantitativeValueStub"]),
      }),
    );
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
        StructuredValueStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        StructuredValueStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      StructuredValueStub.sparqlConstructQuery(parameters),
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
      ...IntangibleStub.sparqlConstructTemplateTriples({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
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
      ...IntangibleStub.sparqlWherePatterns({
        ignoreRdfType: true,
        subject,
        variablePrefix,
      }),
    ];
  }
}
export class QuantitativeValueStub extends StructuredValueStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: QuantitativeValueStub): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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

  override toJson(): {
    readonly unitText: string | undefined;
    readonly value: number | undefined;
  } & ReturnType<StructuredValueStub["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        unitText: this.unitText.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies ReturnType<QuantitativeValueStub["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      unitText: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & UnwrapR<ReturnType<typeof StructuredValueStub._propertiesFromJson>>
  > {
    const _jsonSafeParseResult =
      quantitativeValueStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = StructuredValueStub._propertiesFromJson(_jsonObject);
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
    return QuantitativeValueStub._propertiesFromJson(json).map(
      (properties) => new QuantitativeValueStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof StructuredValueStub._propertiesFromRdf>>
  > {
    const _super0Either = StructuredValueStub._propertiesFromRdf({
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
    parameters: Parameters<typeof QuantitativeValueStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, QuantitativeValueStub> {
    return QuantitativeValueStub._propertiesFromRdf(parameters).map(
      (properties) => new QuantitativeValueStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/QuantitativeValue",
  );

  export function jsonSchema() {
    return zodToJsonSchema(quantitativeValueStubJsonZodSchema());
  }

  export function quantitativeValueStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValueStub.structuredValueStubJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/unitText`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "QuantitativeValueStub",
      type: "Group",
    };
  }

  export function quantitativeValueStubJsonZodSchema() {
    return StructuredValueStub.structuredValueStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("QuantitativeValueStub"),
        unitText: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
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
      ...StructuredValueStub.sparqlConstructTemplateTriples({
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
      ...StructuredValueStub.sparqlWherePatterns({
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
export class Place extends Thing {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "Place";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Thing>[0],
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = placeJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing._propertiesFromJson(_jsonObject);
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
    return Place._propertiesFromJson(json).map(
      (properties) => new Place(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing._propertiesFromRdf>
    >
  > {
    const _super0Either = Thing._propertiesFromRdf({
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
    parameters: Parameters<typeof Place._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Place> {
    return Place._propertiesFromRdf(parameters).map(
      (properties) => new Place(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Place",
  );

  export function jsonSchema() {
    return zodToJsonSchema(placeJsonZodSchema());
  }

  export function placeJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Thing.thingJsonUiSchema({ scopePrefix })],
      label: "Place",
      type: "Group",
    };
  }

  export function placeJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({ "@id": zod.string().min(1), type: zod.literal("Place") }),
    );
  }
}
export class PlaceStub extends ThingStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "PlaceStub";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = placeStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStub._propertiesFromJson(_jsonObject);
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
    return PlaceStub._propertiesFromJson(json).map(
      (properties) => new PlaceStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStub._propertiesFromRdf({
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
    parameters: Parameters<typeof PlaceStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PlaceStub> {
    return PlaceStub._propertiesFromRdf(parameters).map(
      (properties) => new PlaceStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Place",
  );

  export function jsonSchema() {
    return zodToJsonSchema(placeStubJsonZodSchema());
  }

  export function placeStubJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStub.thingStubJsonUiSchema({ scopePrefix })],
      label: "PlaceStub",
      type: "Group",
    };
  }

  export function placeStubJsonZodSchema() {
    return ThingStub.thingStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("PlaceStub"),
      }),
    );
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
      ...ThingStub.sparqlConstructTemplateTriples({
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
      ...ThingStub.sparqlWherePatterns({
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
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: Person): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, dateEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, booleanEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
          arrayEquals(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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

  override toJson(): {
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
    readonly hasOccupation: readonly (
      | ReturnType<Occupation["toJson"]>
      | ReturnType<Role["toJson"]>
    )[];
    readonly images: readonly ReturnType<ImageObject["toJson"]>[];
    readonly jobTitle: string | undefined;
    readonly memberOf: readonly ReturnType<OrganizationStub["toJson"]>[];
    readonly performerIn: readonly ReturnType<EventStub["toJson"]>[];
  } & ReturnType<Thing["toJson"]> {
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
      } satisfies ReturnType<Person["toJson"]>),
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
  export function _propertiesFromJson(
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
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = personJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing._propertiesFromJson(_jsonObject);
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
      OrganizationStub.fromJson(_item).unsafeCoerce(),
    );
    const performerIn = _jsonObject["performerIn"].map((_item) =>
      EventStub.fromJson(_item).unsafeCoerce(),
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
    return Person._propertiesFromJson(json).map(
      (properties) => new Person(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromRdf>>
  > {
    const _super0Either = Thing._propertiesFromRdf({
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
              OrganizationStub.fromRdf({
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
              EventStub.fromRdf({
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
    parameters: Parameters<typeof Person._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Person> {
    return Person._propertiesFromRdf(parameters).map(
      (properties) => new Person(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Person",
  );

  export function jsonSchema() {
    return zodToJsonSchema(personJsonZodSchema());
  }

  export function personJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Thing.thingJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/birthDate`, type: "Control" },
        { scope: `${scopePrefix}/properties/familyName`, type: "Control" },
        { scope: `${scopePrefix}/properties/gender`, type: "Control" },
        { scope: `${scopePrefix}/properties/givenName`, type: "Control" },
        { scope: `${scopePrefix}/properties/hasOccupation`, type: "Control" },
        ImageObject.imageObjectJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/images`,
        }),
        { scope: `${scopePrefix}/properties/jobTitle`, type: "Control" },
        OrganizationStub.organizationStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/memberOf`,
        }),
        EventStub.eventStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/performerIn`,
        }),
      ],
      label: "Person",
      type: "Group",
    };
  }

  export function personJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
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
            Occupation.occupationJsonZodSchema(),
            Role.roleJsonZodSchema(),
          ])
          .array(),
        images: ImageObject.imageObjectJsonZodSchema().array(),
        jobTitle: zod.string().optional(),
        memberOf: OrganizationStub.organizationStubJsonZodSchema().array(),
        performerIn: EventStub.eventStubJsonZodSchema().array(),
      }),
    );
  }
}
export class Organization extends Thing {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "Organization";
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: Organization): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => arrayEquals(left, right, AgentStub.equals))(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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

  override toJson(): {
    readonly members: readonly (
      | ReturnType<OrganizationStub["toJson"]>
      | ReturnType<PersonStub["toJson"]>
    )[];
    readonly parentOrganizations: readonly ReturnType<
      OrganizationStub["toJson"]
    >[];
    readonly subOrganizations: readonly ReturnType<
      OrganizationStub["toJson"]
    >[];
  } & ReturnType<Thing["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        members: this.members.map((_item) => _item.toJson()),
        parentOrganizations: this.parentOrganizations.map((_item) =>
          _item.toJson(),
        ),
        subOrganizations: this.subOrganizations.map((_item) => _item.toJson()),
      } satisfies ReturnType<Organization["toJson"]>),
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

export namespace Organization {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      members: AgentStub[];
      parentOrganizations: OrganizationStub[];
      subOrganizations: OrganizationStub[];
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = organizationJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing._propertiesFromJson(_jsonObject);
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
      (_item) => OrganizationStub.fromJson(_item).unsafeCoerce(),
    );
    const subOrganizations = _jsonObject["subOrganizations"].map((_item) =>
      OrganizationStub.fromJson(_item).unsafeCoerce(),
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
    return Organization._propertiesFromJson(json).map(
      (properties) => new Organization(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromRdf>>
  > {
    const _super0Either = Thing._propertiesFromRdf({
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
              OrganizationStub.fromRdf({
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
              OrganizationStub.fromRdf({
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
    parameters: Parameters<typeof Organization._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Organization> {
    return Organization._propertiesFromRdf(parameters).map(
      (properties) => new Organization(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Organization",
  );

  export function jsonSchema() {
    return zodToJsonSchema(organizationJsonZodSchema());
  }

  export function organizationJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Thing.thingJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/members`, type: "Control" },
        OrganizationStub.organizationStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/parentOrganizations`,
        }),
        OrganizationStub.organizationStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/subOrganizations`,
        }),
      ],
      label: "Organization",
      type: "Group",
    };
  }

  export function organizationJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Organization"),
        members: AgentStub.jsonZodSchema().array(),
        parentOrganizations:
          OrganizationStub.organizationStubJsonZodSchema().array(),
        subOrganizations:
          OrganizationStub.organizationStubJsonZodSchema().array(),
      }),
    );
  }
}
export class Order extends Intangible {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "Order";
  readonly partOfInvoice: purify.Maybe<InvoiceStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly partOfInvoice?: InvoiceStub | purify.Maybe<InvoiceStub>;
    } & ConstructorParameters<typeof Intangible>[0],
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

  override equals(other: Order): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          maybeEquals(left, right, (left, right) => left.equals(right)))(
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

  override toJson(): {
    readonly partOfInvoice: ReturnType<InvoiceStub["toJson"]> | undefined;
  } & ReturnType<Intangible["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        partOfInvoice: this.partOfInvoice
          .map((_item) => _item.toJson())
          .extract(),
      } satisfies ReturnType<Order["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      partOfInvoice: purify.Maybe<InvoiceStub>;
    } & UnwrapR<ReturnType<typeof Intangible._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = orderJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible._propertiesFromJson(_jsonObject);
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
    return Order._propertiesFromJson(json).map(
      (properties) => new Order(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Intangible._propertiesFromRdf>>
  > {
    const _super0Either = Intangible._propertiesFromRdf({
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
    parameters: Parameters<typeof Order._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Order> {
    return Order._propertiesFromRdf(parameters).map(
      (properties) => new Order(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Order",
  );

  export function jsonSchema() {
    return zodToJsonSchema(orderJsonZodSchema());
  }

  export function orderJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Intangible.intangibleJsonUiSchema({ scopePrefix }),
        InvoiceStub.invoiceStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/partOfInvoice`,
        }),
      ],
      label: "Order",
      type: "Group",
    };
  }

  export function orderJsonZodSchema() {
    return Intangible.intangibleJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Order"),
        partOfInvoice: InvoiceStub.invoiceStubJsonZodSchema().optional(),
      }),
    );
  }
}
export class OrderStub extends IntangibleStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "OrderStub";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof IntangibleStub>[0],
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof IntangibleStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = orderStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStub._propertiesFromJson(_jsonObject);
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
    return OrderStub._propertiesFromJson(json).map(
      (properties) => new OrderStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof IntangibleStub._propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStub._propertiesFromRdf({
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
    parameters: Parameters<typeof OrderStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, OrderStub> {
    return OrderStub._propertiesFromRdf(parameters).map(
      (properties) => new OrderStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Order",
  );

  export function jsonSchema() {
    return zodToJsonSchema(orderStubJsonZodSchema());
  }

  export function orderStubJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStub.intangibleStubJsonUiSchema({ scopePrefix })],
      label: "OrderStub",
      type: "Group",
    };
  }

  export function orderStubJsonZodSchema() {
    return IntangibleStub.intangibleStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("OrderStub"),
      }),
    );
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
      ...IntangibleStub.sparqlConstructTemplateTriples({
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
      ...IntangibleStub.sparqlWherePatterns({
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
export class MonetaryAmount extends StructuredValue {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: MonetaryAmount): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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

  override toJson(): {
    readonly currency: string | undefined;
    readonly value: number | undefined;
  } & ReturnType<StructuredValue["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        currency: this.currency.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies ReturnType<MonetaryAmount["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      currency: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & UnwrapR<ReturnType<typeof StructuredValue._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = monetaryAmountJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = StructuredValue._propertiesFromJson(_jsonObject);
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
    return MonetaryAmount._propertiesFromJson(json).map(
      (properties) => new MonetaryAmount(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof StructuredValue._propertiesFromRdf>>
  > {
    const _super0Either = StructuredValue._propertiesFromRdf({
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
    parameters: Parameters<typeof MonetaryAmount._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MonetaryAmount> {
    return MonetaryAmount._propertiesFromRdf(parameters).map(
      (properties) => new MonetaryAmount(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MonetaryAmount",
  );

  export function jsonSchema() {
    return zodToJsonSchema(monetaryAmountJsonZodSchema());
  }

  export function monetaryAmountJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValue.structuredValueJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/currency`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "MonetaryAmount",
      type: "Group",
    };
  }

  export function monetaryAmountJsonZodSchema() {
    return StructuredValue.structuredValueJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MonetaryAmount"),
        currency: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
  }
}
export class MonetaryAmountStub extends StructuredValueStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: MonetaryAmountStub): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, strictEquals))(
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

  override toJson(): {
    readonly currency: string | undefined;
    readonly value: number | undefined;
  } & ReturnType<StructuredValueStub["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        currency: this.currency.map((_item) => _item).extract(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies ReturnType<MonetaryAmountStub["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      currency: purify.Maybe<string>;
      value: purify.Maybe<number>;
    } & UnwrapR<ReturnType<typeof StructuredValueStub._propertiesFromJson>>
  > {
    const _jsonSafeParseResult =
      monetaryAmountStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = StructuredValueStub._propertiesFromJson(_jsonObject);
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
    return MonetaryAmountStub._propertiesFromJson(json).map(
      (properties) => new MonetaryAmountStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof StructuredValueStub._propertiesFromRdf>>
  > {
    const _super0Either = StructuredValueStub._propertiesFromRdf({
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
    parameters: Parameters<typeof MonetaryAmountStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MonetaryAmountStub> {
    return MonetaryAmountStub._propertiesFromRdf(parameters).map(
      (properties) => new MonetaryAmountStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MonetaryAmount",
  );

  export function jsonSchema() {
    return zodToJsonSchema(monetaryAmountStubJsonZodSchema());
  }

  export function monetaryAmountStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValueStub.structuredValueStubJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/currency`, type: "Control" },
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "MonetaryAmountStub",
      type: "Group",
    };
  }

  export function monetaryAmountStubJsonZodSchema() {
    return StructuredValueStub.structuredValueStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MonetaryAmountStub"),
        currency: zod.string().optional(),
        value: zod.number().optional(),
      }),
    );
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
      ...StructuredValueStub.sparqlConstructTemplateTriples({
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
      ...StructuredValueStub.sparqlWherePatterns({
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
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "Message";
  readonly sender: purify.Maybe<AgentStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly sender?: AgentStub | purify.Maybe<AgentStub>;
    } & ConstructorParameters<typeof CreativeWork>[0],
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

  override equals(other: Message): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, AgentStub.equals))(
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

  override toJson(): {
    readonly sender:
      | (
          | ReturnType<OrganizationStub["toJson"]>
          | ReturnType<PersonStub["toJson"]>
        )
      | undefined;
  } & ReturnType<CreativeWork["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        sender: this.sender.map((_item) => _item.toJson()).extract(),
      } satisfies ReturnType<Message["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      sender: purify.Maybe<AgentStub>;
    } & UnwrapR<ReturnType<typeof CreativeWork._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = messageJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWork._propertiesFromJson(_jsonObject);
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
    return Message._propertiesFromJson(json).map(
      (properties) => new Message(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof CreativeWork._propertiesFromRdf>>
  > {
    const _super0Either = CreativeWork._propertiesFromRdf({
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
    parameters: Parameters<typeof Message._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Message> {
    return Message._propertiesFromRdf(parameters).map(
      (properties) => new Message(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Message",
  );

  export function jsonSchema() {
    return zodToJsonSchema(messageJsonZodSchema());
  }

  export function messageJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWork.creativeWorkJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/sender`, type: "Control" },
      ],
      label: "Message",
      type: "Group",
    };
  }

  export function messageJsonZodSchema() {
    return CreativeWork.creativeWorkJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Message"),
        sender: AgentStub.jsonZodSchema().optional(),
      }),
    );
  }
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWorkStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = messageStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWorkStub._propertiesFromJson(_jsonObject);
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
    return MessageStub._propertiesFromJson(json).map(
      (properties) => new MessageStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof CreativeWorkStub._propertiesFromRdf>
    >
  > {
    const _super0Either = CreativeWorkStub._propertiesFromRdf({
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
    parameters: Parameters<typeof MessageStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MessageStub> {
    return MessageStub._propertiesFromRdf(parameters).map(
      (properties) => new MessageStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Message",
  );

  export function jsonSchema() {
    return zodToJsonSchema(messageStubJsonZodSchema());
  }

  export function messageStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        CreativeWorkStub.creativeWorkStubJsonUiSchema({ scopePrefix }),
      ],
      label: "MessageStub",
      type: "Group",
    };
  }

  export function messageStubJsonZodSchema() {
    return CreativeWorkStub.creativeWorkStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("MessageStub"),
      }),
    );
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
      ...CreativeWorkStub.sparqlConstructTemplateTriples({
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
      ...CreativeWorkStub.sparqlWherePatterns({
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
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: Invoice): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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
        ((left, right) => maybeEquals(left, right, AgentStub.equals))(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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
          maybeEquals(left, right, (left, right) => left.equals(right)))(
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

  override toJson(): {
    readonly category: string | undefined;
    readonly provider:
      | (
          | ReturnType<OrganizationStub["toJson"]>
          | ReturnType<PersonStub["toJson"]>
        )
      | undefined;
    readonly referencesOrder: readonly ReturnType<OrderStub["toJson"]>[];
    readonly totalPaymentDue:
      | ReturnType<MonetaryAmountStub["toJson"]>
      | undefined;
  } & ReturnType<Intangible["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        category: this.category.map((_item) => _item).extract(),
        provider: this.provider.map((_item) => _item.toJson()).extract(),
        referencesOrder: this.referencesOrder.map((_item) => _item.toJson()),
        totalPaymentDue: this.totalPaymentDue
          .map((_item) => _item.toJson())
          .extract(),
      } satisfies ReturnType<Invoice["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      category: purify.Maybe<string>;
      provider: purify.Maybe<AgentStub>;
      referencesOrder: readonly OrderStub[];
      totalPaymentDue: purify.Maybe<MonetaryAmountStub>;
    } & UnwrapR<ReturnType<typeof Intangible._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = invoiceJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible._propertiesFromJson(_jsonObject);
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
    return Invoice._propertiesFromJson(json).map(
      (properties) => new Invoice(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Intangible._propertiesFromRdf>>
  > {
    const _super0Either = Intangible._propertiesFromRdf({
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
    parameters: Parameters<typeof Invoice._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Invoice> {
    return Invoice._propertiesFromRdf(parameters).map(
      (properties) => new Invoice(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Invoice",
  );

  export function jsonSchema() {
    return zodToJsonSchema(invoiceJsonZodSchema());
  }

  export function invoiceJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Intangible.intangibleJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/category`, type: "Control" },
        { scope: `${scopePrefix}/properties/provider`, type: "Control" },
        OrderStub.orderStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/referencesOrder`,
        }),
        MonetaryAmountStub.monetaryAmountStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/totalPaymentDue`,
        }),
      ],
      label: "Invoice",
      type: "Group",
    };
  }

  export function invoiceJsonZodSchema() {
    return Intangible.intangibleJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Invoice"),
        category: zod.string().optional(),
        provider: AgentStub.jsonZodSchema().optional(),
        referencesOrder: OrderStub.orderStubJsonZodSchema().array(),
        totalPaymentDue:
          MonetaryAmountStub.monetaryAmountStubJsonZodSchema().optional(),
      }),
    );
  }
}
export class InvoiceStub extends IntangibleStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "InvoiceStub";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof IntangibleStub>[0],
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof IntangibleStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = invoiceStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = IntangibleStub._propertiesFromJson(_jsonObject);
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
    return InvoiceStub._propertiesFromJson(json).map(
      (properties) => new InvoiceStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof IntangibleStub._propertiesFromRdf>
    >
  > {
    const _super0Either = IntangibleStub._propertiesFromRdf({
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
    parameters: Parameters<typeof InvoiceStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, InvoiceStub> {
    return InvoiceStub._propertiesFromRdf(parameters).map(
      (properties) => new InvoiceStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Invoice",
  );

  export function jsonSchema() {
    return zodToJsonSchema(invoiceStubJsonZodSchema());
  }

  export function invoiceStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [IntangibleStub.intangibleStubJsonUiSchema({ scopePrefix })],
      label: "InvoiceStub",
      type: "Group",
    };
  }

  export function invoiceStubJsonZodSchema() {
    return IntangibleStub.intangibleStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("InvoiceStub"),
      }),
    );
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
      ...IntangibleStub.sparqlConstructTemplateTriples({
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
      ...IntangibleStub.sparqlWherePatterns({
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
export class Event extends Thing {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "Event";
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
    }

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

  override equals(other: Event): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) =>
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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
        ((left, right) => maybeEquals(left, right, dateEquals))(
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
          maybeEquals(left, right, (left, right) => left.equals(right)))(
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
        ((left, right) => arrayEquals(left, right, AgentStub.equals))(
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
        ((left, right) => arrayEquals(left, right, AgentStub.equals))(
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
        ((left, right) => maybeEquals(left, right, dateEquals))(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
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
          maybeEquals(left, right, (left, right) => left.equals(right)))(
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

  override toJson(): {
    readonly about: readonly ReturnType<ThingStub["toJson"]>[];
    readonly endDate: string | undefined;
    readonly location: ReturnType<PlaceStub["toJson"]> | undefined;
    readonly organizers: readonly (
      | ReturnType<OrganizationStub["toJson"]>
      | ReturnType<PersonStub["toJson"]>
    )[];
    readonly performers: readonly (
      | ReturnType<OrganizationStub["toJson"]>
      | ReturnType<PersonStub["toJson"]>
    )[];
    readonly startDate: string | undefined;
    readonly subEvents: readonly ReturnType<EventStub["toJson"]>[];
    readonly superEvent: ReturnType<EventStub["toJson"]> | undefined;
  } & ReturnType<Thing["toJson"]> {
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
      } satisfies ReturnType<Event["toJson"]>),
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

export namespace Event {
  export function _propertiesFromJson(
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
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = eventJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing._propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const about = _jsonObject["about"].map((_item) =>
      ThingStub.fromJson(_item).unsafeCoerce(),
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
      EventStub.fromJson(_item).unsafeCoerce(),
    );
    const superEvent = purify.Maybe.fromNullable(_jsonObject["superEvent"]).map(
      (_item) => EventStub.fromJson(_item).unsafeCoerce(),
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
    return Event._propertiesFromJson(json).map(
      (properties) => new Event(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof Thing._propertiesFromRdf>>
  > {
    const _super0Either = Thing._propertiesFromRdf({
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
              ThingStub.fromRdf({
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
              EventStub.fromRdf({
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
          EventStub.fromRdf({
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
    parameters: Parameters<typeof Event._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Event> {
    return Event._propertiesFromRdf(parameters).map(
      (properties) => new Event(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Event",
  );

  export function jsonSchema() {
    return zodToJsonSchema(eventJsonZodSchema());
  }

  export function eventJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        Thing.thingJsonUiSchema({ scopePrefix }),
        ThingStub.thingStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/about`,
        }),
        { scope: `${scopePrefix}/properties/endDate`, type: "Control" },
        PlaceStub.placeStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/location`,
        }),
        { scope: `${scopePrefix}/properties/organizers`, type: "Control" },
        { scope: `${scopePrefix}/properties/performers`, type: "Control" },
        { scope: `${scopePrefix}/properties/startDate`, type: "Control" },
        EventStub.eventStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/subEvents`,
        }),
        EventStub.eventStubJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/superEvent`,
        }),
      ],
      label: "Event",
      type: "Group",
    };
  }

  export function eventJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("Event"),
        about: ThingStub.thingStubJsonZodSchema().array(),
        endDate: zod.string().datetime().optional(),
        location: PlaceStub.placeStubJsonZodSchema().optional(),
        organizers: AgentStub.jsonZodSchema().array(),
        performers: AgentStub.jsonZodSchema().array(),
        startDate: zod.string().datetime().optional(),
        subEvents: EventStub.eventStubJsonZodSchema().array(),
        superEvent: EventStub.eventStubJsonZodSchema().optional(),
      }),
    );
  }
}
export class EventStub extends ThingStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "EventStub";
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
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else if (typeof parameters.identifier === "undefined") {
    } else {
      this._identifier = parameters.identifier as never;
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

  override equals(other: EventStub): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, dateEquals))(
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
        ((left, right) => maybeEquals(left, right, booleanEquals))(
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

  override toJson(): {
    readonly startDate: string | undefined;
    readonly superEvent: { readonly "@id": string } | undefined;
  } & ReturnType<ThingStub["toJson"]> {
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
      } satisfies ReturnType<EventStub["toJson"]>),
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

export namespace EventStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      startDate: purify.Maybe<Date>;
      superEvent: purify.Maybe<rdfjs.BlankNode | rdfjs.NamedNode>;
    } & UnwrapR<ReturnType<typeof ThingStub._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = eventStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStub._propertiesFromJson(_jsonObject);
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
    return EventStub._propertiesFromJson(json).map(
      (properties) => new EventStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof ThingStub._propertiesFromRdf>>
  > {
    const _super0Either = ThingStub._propertiesFromRdf({
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
    parameters: Parameters<typeof EventStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, EventStub> {
    return EventStub._propertiesFromRdf(parameters).map(
      (properties) => new EventStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Event",
  );

  export function jsonSchema() {
    return zodToJsonSchema(eventStubJsonZodSchema());
  }

  export function eventStubJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStub.thingStubJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/startDate`, type: "Control" },
        { scope: `${scopePrefix}/properties/superEvent`, type: "Control" },
      ],
      label: "EventStub",
      type: "Group",
    };
  }

  export function eventStubJsonZodSchema() {
    return ThingStub.thingStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("EventStub"),
        startDate: zod.string().datetime().optional(),
        superEvent: zod.object({ "@id": zod.string().min(1) }).optional(),
      }),
    );
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
        EventStub.sparqlConstructTemplateTriples({ ignoreRdfType, subject }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        EventStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      EventStub.sparqlConstructQuery(parameters),
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
      ...ThingStub.sparqlConstructTemplateTriples({
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
      ...ThingStub.sparqlWherePatterns({
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
export class PersonStub extends ThingStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "PersonStub";
  readonly jobTitle: purify.Maybe<string>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly jobTitle?: purify.Maybe<string> | string;
    } & ConstructorParameters<typeof ThingStub>[0],
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

  override equals(other: PersonStub): EqualsResult {
    return super
      .equals(other)
      .chain(() =>
        ((left, right) => maybeEquals(left, right, strictEquals))(
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

  override toJson(): { readonly jobTitle: string | undefined } & ReturnType<
    ThingStub["toJson"]
  > {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        jobTitle: this.jobTitle.map((_item) => _item).extract(),
      } satisfies ReturnType<PersonStub["toJson"]>),
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
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      jobTitle: purify.Maybe<string>;
    } & UnwrapR<ReturnType<typeof ThingStub._propertiesFromJson>>
  > {
    const _jsonSafeParseResult = personStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStub._propertiesFromJson(_jsonObject);
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
    return PersonStub._propertiesFromJson(json).map(
      (properties) => new PersonStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    } & UnwrapR<ReturnType<typeof ThingStub._propertiesFromRdf>>
  > {
    const _super0Either = ThingStub._propertiesFromRdf({
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
    parameters: Parameters<typeof PersonStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, PersonStub> {
    return PersonStub._propertiesFromRdf(parameters).map(
      (properties) => new PersonStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Person",
  );

  export function jsonSchema() {
    return zodToJsonSchema(personStubJsonZodSchema());
  }

  export function personStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        ThingStub.thingStubJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/jobTitle`, type: "Control" },
      ],
      label: "PersonStub",
      type: "Group",
    };
  }

  export function personStubJsonZodSchema() {
    return ThingStub.thingStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("PersonStub"),
        jobTitle: zod.string().optional(),
      }),
    );
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
      ...ThingStub.sparqlConstructTemplateTriples({
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
      ...ThingStub.sparqlWherePatterns({
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
export class OrganizationStub extends ThingStub {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "OrganizationStub";

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof ThingStub>[0],
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

export namespace OrganizationStub {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      organizationStubJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = ThingStub._propertiesFromJson(_jsonObject);
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
    return OrganizationStub._propertiesFromJson(json).map(
      (properties) => new OrganizationStub(properties),
    );
  }

  export function _propertiesFromRdf({
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof ThingStub._propertiesFromRdf>
    >
  > {
    const _super0Either = ThingStub._propertiesFromRdf({
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
    parameters: Parameters<typeof OrganizationStub._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, OrganizationStub> {
    return OrganizationStub._propertiesFromRdf(parameters).map(
      (properties) => new OrganizationStub(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Organization",
  );

  export function jsonSchema() {
    return zodToJsonSchema(organizationStubJsonZodSchema());
  }

  export function organizationStubJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [ThingStub.thingStubJsonUiSchema({ scopePrefix })],
      label: "OrganizationStub",
      type: "Group",
    };
  }

  export function organizationStubJsonZodSchema() {
    return ThingStub.thingStubJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("OrganizationStub"),
      }),
    );
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
        OrganizationStub.sparqlConstructTemplateTriples({
          ignoreRdfType,
          subject,
        }),
      ),
      type: "query",
      where: (queryParameters.where ?? []).concat(
        OrganizationStub.sparqlWherePatterns({ ignoreRdfType, subject }),
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
      OrganizationStub.sparqlConstructQuery(parameters),
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
      ...ThingStub.sparqlConstructTemplateTriples({
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
      ...ThingStub.sparqlWherePatterns({
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
export type AgentStub = OrganizationStub | PersonStub;

export namespace AgentStub {
  export function equals(left: AgentStub, right: AgentStub): EqualsResult {
    return strictEquals(left.type, right.type).chain(() => {
      switch (left.type) {
        case "OrganizationStub":
          return left.equals(right as unknown as OrganizationStub);
        case "PersonStub":
          return left.equals(right as unknown as PersonStub);
      }
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, AgentStub> {
    return (
      OrganizationStub.fromJson(json) as purify.Either<zod.ZodError, AgentStub>
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
      OrganizationStub.fromRdf({ ...context, resource }) as purify.Either<
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
        return _agentStub.hash(_hasher);
      case "PersonStub":
        return _agentStub.hash(_hasher);
    }
  }

  export function jsonZodSchema() {
    return zod.discriminatedUnion("type", [
      OrganizationStub.organizationStubJsonZodSchema(),
      PersonStub.personStubJsonZodSchema(),
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
      ...OrganizationStub.sparqlConstructTemplateTriples({
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
            patterns: OrganizationStub.sparqlWherePatterns({
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
  ): ReturnType<OrganizationStub["toJson"]> | ReturnType<PersonStub["toJson"]> {
    switch (_agentStub.type) {
      case "OrganizationStub":
        return _agentStub.toJson();
      case "PersonStub":
        return _agentStub.toJson();
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
        return _agentStub.toRdf(_parameters);
      case "PersonStub":
        return _agentStub.toRdf(_parameters);
    }
  }
}
