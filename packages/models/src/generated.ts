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
    | "Event"
    | "GenderType"
    | "ImageObject"
    | "Occupation"
    | "Organization"
    | "Person"
    | "QuantitiveValue"
    | "Role";
  readonly about: readonly (rdfjs.BlankNode | rdfjs.NamedNode)[];
  readonly description: purify.Maybe<string>;
  readonly identifiers: readonly string[];
  readonly locations: readonly (
    | rdfjs.BlankNode
    | rdfjs.NamedNode
    | rdfjs.Literal
  )[];
  readonly name: purify.Maybe<string>;
  readonly sameAs: readonly rdfjs.NamedNode[];
  readonly url: purify.Maybe<rdfjs.NamedNode>;

  constructor(parameters: {
    readonly about?: readonly (rdfjs.BlankNode | rdfjs.NamedNode)[];
    readonly description?: purify.Maybe<string> | string;
    readonly identifiers?: readonly string[];
    readonly locations?: readonly (
      | rdfjs.BlankNode
      | rdfjs.NamedNode
      | rdfjs.Literal
    )[];
    readonly name?: purify.Maybe<string> | string;
    readonly sameAs?: readonly rdfjs.NamedNode[];
    readonly url?: rdfjs.NamedNode | purify.Maybe<rdfjs.NamedNode> | string;
  }) {
    if (typeof parameters.about === "undefined") {
      this.about = [];
    } else if (Array.isArray(parameters.about)) {
      this.about = parameters.about;
    } else {
      this.about = parameters.about as never;
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

    if (typeof parameters.identifiers === "undefined") {
      this.identifiers = [];
    } else if (Array.isArray(parameters.identifiers)) {
      this.identifiers = parameters.identifiers;
    } else {
      this.identifiers = parameters.identifiers as never;
    }

    if (typeof parameters.locations === "undefined") {
      this.locations = [];
    } else if (Array.isArray(parameters.locations)) {
      this.locations = parameters.locations;
    } else {
      this.locations = parameters.locations as never;
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

    if (typeof parameters.sameAs === "undefined") {
      this.sameAs = [];
    } else if (Array.isArray(parameters.sameAs)) {
      this.sameAs = parameters.sameAs;
    } else {
      this.sameAs = parameters.sameAs as never;
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
        ((left, right) => arrayEquals(left, right, booleanEquals))(
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
        ((left, right) => arrayEquals(left, right, booleanEquals))(
          this.locations,
          other.locations,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "locations",
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
    for (const _item0 of this.about) {
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
    }

    this.description.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.identifiers) {
      _hasher.update(_item0);
    }

    for (const _item0 of this.locations) {
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
    }

    this.name.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.sameAs) {
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
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
      | "Event"
      | "GenderType"
      | "ImageObject"
      | "Occupation"
      | "Organization"
      | "Person"
      | "QuantitiveValue"
      | "Role";
    readonly about: readonly { readonly "@id": string }[];
    readonly description: string | undefined;
    readonly identifiers: readonly string[];
    readonly locations: readonly (
      | { readonly "@id": string; readonly termType: "BlankNode" | "NamedNode" }
      | {
          readonly "@language": string | undefined;
          readonly "@type": string | undefined;
          readonly "@value": string;
          readonly termType: "Literal";
        }
    )[];
    readonly name: string | undefined;
    readonly sameAs: readonly { readonly "@id": string }[];
    readonly url: { readonly "@id": string } | undefined;
  } {
    return JSON.parse(
      JSON.stringify({
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        type: this.type,
        about: this.about.map((_item) =>
          _item.termType === "BlankNode"
            ? { "@id": `_:${_item.value}` }
            : { "@id": _item.value },
        ),
        description: this.description.map((_item) => _item).extract(),
        identifiers: this.identifiers.map((_item) => _item),
        locations: this.locations.map((_item) =>
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
        ),
        name: this.name.map((_item) => _item).extract(),
        sameAs: this.sameAs.map((_item) => ({ "@id": _item.value })),
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
      dataFactory.namedNode("http://schema.org/about"),
      this.about.map((_item) => _item),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/description"),
      this.description,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/identifier"),
      this.identifiers.map((_item) => _item),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/location"),
      this.locations.map((_item) => _item),
    );
    _resource.add(dataFactory.namedNode("http://schema.org/name"), this.name);
    _resource.add(
      dataFactory.namedNode("http://schema.org/sameAs"),
      this.sameAs.map((_item) => _item),
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
      about: readonly (rdfjs.BlankNode | rdfjs.NamedNode)[];
      description: purify.Maybe<string>;
      identifiers: readonly string[];
      locations: readonly (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)[];
      name: purify.Maybe<string>;
      sameAs: readonly rdfjs.NamedNode[];
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
    const about = _jsonObject["about"].map((_item) =>
      _item["@id"].startsWith("_:")
        ? dataFactory.blankNode(_item["@id"].substring(2))
        : dataFactory.namedNode(_item["@id"]),
    );
    const description = purify.Maybe.fromNullable(_jsonObject["description"]);
    const identifiers = _jsonObject["identifiers"];
    const locations = _jsonObject["locations"].map((_item) =>
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
    const name = purify.Maybe.fromNullable(_jsonObject["name"]);
    const sameAs = _jsonObject["sameAs"].map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    const url = purify.Maybe.fromNullable(_jsonObject["url"]).map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    return purify.Either.of({
      identifier,
      about,
      description,
      identifiers,
      locations,
      name,
      sameAs,
      url,
    });
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
      about: readonly (rdfjs.BlankNode | rdfjs.NamedNode)[];
      description: purify.Maybe<string>;
      identifiers: readonly string[];
      locations: readonly (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)[];
      name: purify.Maybe<string>;
      sameAs: readonly rdfjs.NamedNode[];
      url: purify.Maybe<rdfjs.NamedNode>;
    }
  > {
    const identifier = _resource.identifier;
    const _aboutEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly (rdfjs.BlankNode | rdfjs.NamedNode)[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/about"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((_value) => _value.toIdentifier())
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_aboutEither.isLeft()) {
      return _aboutEither;
    }

    const about = _aboutEither.unsafeCoerce();
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
    const _locationsEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/location"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .head()
            .chain((_value) => purify.Either.of(_value.toTerm()))
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_locationsEither.isLeft()) {
      return _locationsEither;
    }

    const locations = _locationsEither.unsafeCoerce();
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
      about,
      description,
      identifiers,
      locations,
      name,
      sameAs,
      url,
    });
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
        { scope: `${scopePrefix}/properties/about`, type: "Control" },
        { scope: `${scopePrefix}/properties/description`, type: "Control" },
        { scope: `${scopePrefix}/properties/identifiers`, type: "Control" },
        { scope: `${scopePrefix}/properties/locations`, type: "Control" },
        { scope: `${scopePrefix}/properties/name`, type: "Control" },
        { scope: `${scopePrefix}/properties/sameAs`, type: "Control" },
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
        "Event",
        "GenderType",
        "ImageObject",
        "Occupation",
        "Organization",
        "Person",
        "QuantitiveValue",
        "Role",
      ]),
      about: zod.object({ "@id": zod.string().min(1) }).array(),
      description: zod.string().optional(),
      identifiers: zod.string().array(),
      locations: zod
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
        .array(),
      name: zod.string().optional(),
      sameAs: zod.object({ "@id": zod.string().min(1) }).array(),
      url: zod.object({ "@id": zod.string().min(1) }).optional(),
    });
  }
}
export abstract class Intangible extends Thing {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type:
    | "GenderType"
    | "Occupation"
    | "QuantitiveValue"
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
        type: zod.enum(["GenderType", "Occupation", "QuantitiveValue", "Role"]),
      }),
    );
  }
}
export abstract class StructuredValue extends Intangible {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type: "QuantitiveValue";

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
        type: zod.literal("QuantitiveValue"),
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
export class QuantitiveValue extends StructuredValue {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "QuantitiveValue";
  readonly value: purify.Maybe<number>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
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

  override equals(other: QuantitiveValue): EqualsResult {
    return super
      .equals(other)
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
    this.value.ifJust((_value0) => {
      _hasher.update(_value0.toString());
    });
    return _hasher;
  }

  override toJson(): { readonly value: number | undefined } & ReturnType<
    StructuredValue["toJson"]
  > {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        value: this.value.map((_item) => _item).extract(),
      } satisfies ReturnType<QuantitiveValue["toJson"]>),
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

    _resource.add(dataFactory.namedNode("http://schema.org/value"), this.value);
    return _resource;
  }

  override toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace QuantitiveValue {
  export function _propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      value: purify.Maybe<number>;
    } & UnwrapR<ReturnType<typeof StructuredValue._propertiesFromJson>>
  > {
    const _jsonSafeParseResult =
      quantitiveValueJsonZodSchema().safeParse(_json);
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
    const value = purify.Maybe.fromNullable(_jsonObject["value"]);
    return purify.Either.of({ ..._super0, identifier, value });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, QuantitiveValue> {
    return QuantitiveValue._propertiesFromJson(json).map(
      (properties) => new QuantitiveValue(properties),
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode(
            "http://schema.org/QuantitativeValue",
          ),
        }),
      );
    }

    const identifier = _resource.identifier;
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
    return purify.Either.of({ ..._super0, identifier, value });
  }

  export function fromRdf(
    parameters: Parameters<typeof QuantitiveValue._propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, QuantitiveValue> {
    return QuantitiveValue._propertiesFromRdf(parameters).map(
      (properties) => new QuantitiveValue(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/QuantitativeValue",
  );

  export function jsonSchema() {
    return zodToJsonSchema(quantitiveValueJsonZodSchema());
  }

  export function quantitiveValueJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        StructuredValue.structuredValueJsonUiSchema({ scopePrefix }),
        { scope: `${scopePrefix}/properties/value`, type: "Control" },
      ],
      label: "QuantitiveValue",
      type: "Group",
    };
  }

  export function quantitiveValueJsonZodSchema() {
    return StructuredValue.structuredValueJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.literal("QuantitiveValue"),
        value: zod.number().optional(),
      }),
    );
  }
}
export abstract class CreativeWork extends Thing {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type: "ImageObject";
  readonly isBasedOn: readonly rdfjs.NamedNode[];

  constructor(
    parameters: {
      readonly isBasedOn?: readonly rdfjs.NamedNode[];
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
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
    for (const _item0 of this.isBasedOn) {
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
    }

    return _hasher;
  }

  override toJson(): {
    readonly isBasedOn: readonly { readonly "@id": string }[];
  } & ReturnType<Thing["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
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
    const isBasedOn = _jsonObject["isBasedOn"].map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    return purify.Either.of({ ..._super0, identifier, isBasedOn });
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
    return purify.Either.of({ ..._super0, identifier, isBasedOn });
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
        type: zod.literal("ImageObject"),
        isBasedOn: zod.object({ "@id": zod.string().min(1) }).array(),
      }),
    );
  }
}
export abstract class MediaObject extends CreativeWork {
  abstract override readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract override readonly type: "ImageObject";
  readonly contentUrl: purify.Maybe<rdfjs.NamedNode>;
  readonly encodingFormat: purify.Maybe<string>;
  readonly height: purify.Maybe<QuantitiveValue>;
  readonly width: purify.Maybe<QuantitiveValue>;

  constructor(
    parameters: {
      readonly contentUrl?:
        | rdfjs.NamedNode
        | purify.Maybe<rdfjs.NamedNode>
        | string;
      readonly encodingFormat?: purify.Maybe<string> | string;
      readonly height?: QuantitiveValue | purify.Maybe<QuantitiveValue>;
      readonly width?: QuantitiveValue | purify.Maybe<QuantitiveValue>;
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
      parameters.height instanceof QuantitiveValue
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
      parameters.width instanceof QuantitiveValue
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
    readonly height: ReturnType<QuantitiveValue["toJson"]> | undefined;
    readonly width: ReturnType<QuantitiveValue["toJson"]> | undefined;
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
      height: purify.Maybe<QuantitiveValue>;
      width: purify.Maybe<QuantitiveValue>;
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
      (_item) => QuantitiveValue.fromJson(_item).unsafeCoerce(),
    );
    const width = purify.Maybe.fromNullable(_jsonObject["width"]).map((_item) =>
      QuantitiveValue.fromJson(_item).unsafeCoerce(),
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
      height: purify.Maybe<QuantitiveValue>;
      width: purify.Maybe<QuantitiveValue>;
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
      purify.Maybe<QuantitiveValue>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/height"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          QuantitiveValue.fromRdf({
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
      purify.Maybe<QuantitiveValue>
    > = purify.Either.of(
      _resource
        .values(dataFactory.namedNode("http://schema.org/width"), {
          unique: true,
        })
        .head()
        .chain((value) => value.toResource())
        .chain((_resource) =>
          QuantitiveValue.fromRdf({
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
        QuantitiveValue.quantitiveValueJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/height`,
        }),
        QuantitiveValue.quantitiveValueJsonUiSchema({
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
        type: zod.literal("ImageObject"),
        contentUrl: zod.object({ "@id": zod.string().min(1) }).optional(),
        encodingFormat: zod.string().optional(),
        height: QuantitiveValue.quantitiveValueJsonZodSchema().optional(),
        width: QuantitiveValue.quantitiveValueJsonZodSchema().optional(),
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
                  ignoreRdfType: true,
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
                      ignoreRdfType: true,
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
export abstract class ThingStub {
  abstract readonly identifier: rdfjs.BlankNode | rdfjs.NamedNode;
  abstract readonly type: "EventStub" | "OrganizationStub" | "PersonStub";
  readonly name: purify.Maybe<string>;

  constructor(parameters: { readonly name?: purify.Maybe<string> | string }) {
    if (purify.Maybe.isMaybe(parameters.name)) {
      this.name = parameters.name;
    } else if (typeof parameters.name === "string") {
      this.name = purify.Maybe.of(parameters.name);
    } else if (typeof parameters.name === "undefined") {
      this.name = purify.Maybe.empty();
    } else {
      this.name = parameters.name as never;
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
    return _hasher;
  }

  toJson(): {
    readonly "@id": string;
    readonly type: "EventStub" | "OrganizationStub" | "PersonStub";
    readonly name: string | undefined;
  } {
    return JSON.parse(
      JSON.stringify({
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        type: this.type,
        name: this.name.map((_item) => _item).extract(),
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
    return purify.Either.of({ identifier, name });
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
    return purify.Either.of({ identifier, name });
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
      ],
      label: "ThingStub",
      type: "Group",
    };
  }

  export function thingStubJsonZodSchema() {
    return zod.object({
      "@id": zod.string().min(1),
      type: zod.enum(["EventStub", "OrganizationStub", "PersonStub"]),
      name: zod.string().optional(),
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
    ];
  }
}
export class Event extends Thing {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  override readonly type = "Event";
  readonly endDate: purify.Maybe<Date>;
  readonly organizers: readonly AgentStub[];
  readonly performers: readonly AgentStub[];
  readonly startDate: purify.Maybe<Date>;
  subEvents: EventStub[];
  superEvent: purify.Maybe<EventStub>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly endDate?: Date | purify.Maybe<Date>;
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
    this.endDate.ifJust((_value0) => {
      _hasher.update(_value0.toISOString());
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
    readonly endDate: string | undefined;
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
        endDate: this.endDate.map((_item) => _item.toISOString()).extract(),
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
      endDate: purify.Maybe<Date>;
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
    const endDate = purify.Maybe.fromNullable(_jsonObject["endDate"]).map(
      (_item) => new Date(_item),
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
      endDate,
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
      endDate: purify.Maybe<Date>;
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode("http://schema.org/Event"),
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
      endDate,
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
        { scope: `${scopePrefix}/properties/endDate`, type: "Control" },
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
        endDate: zod.string().datetime().optional(),
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
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
