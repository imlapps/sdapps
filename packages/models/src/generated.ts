import type * as rdfjs from "@rdfjs/types";
import { DataFactory as dataFactory } from "n3";
import * as purify from "purify-ts";
import * as rdfjsResource from "rdfjs-resource";
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
export class schema_Image {
  private _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  readonly type = "schema_Image";

  constructor(parameters: {
    readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
  }) {
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else {
      this._identifier = parameters.identifier as never;
    }
  }

  get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  equals(other: schema_Image): EqualsResult {
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
      );
  }

  hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    _hasher.update(this.identifier.value);
    return _hasher;
  }

  toJson(): { readonly "@id": string; readonly type: "schema_Image" } {
    return JSON.parse(
      JSON.stringify({
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        type: this.type,
      } satisfies ReturnType<schema_Image["toJson"]>),
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

export namespace schema_Image {
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

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, schema_Image> {
    return schema_Image
      .propertiesFromJson(json)
      .map((properties) => new schema_Image(properties));
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
    parameters: Parameters<typeof schema_Image.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, schema_Image> {
    return schema_Image
      .propertiesFromRdf(parameters)
      .map((properties) => new schema_Image(properties));
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
              schema: { const: "schema_Image" },
              scope: `${scopePrefix}/properties/type`,
            },
            effect: "HIDE",
          },
          scope: `${scopePrefix}/properties/type`,
          type: "Control",
        },
      ],
      label: "schema_Image",
      type: "Group",
    };
  }

  export function jsonZodSchema() {
    return zod.object({
      "@id": zod.string().min(1),
      type: zod.literal("schema_Image"),
    });
  }
}
export class Thing {
  readonly description: purify.Maybe<string>;
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  readonly images: readonly schema_Image[];
  readonly name: purify.Maybe<string>;
  readonly sameAs: readonly rdfjs.NamedNode[];
  readonly type:
    | "CreativeWork"
    | "Enumeration"
    | "GenderType"
    | "ImageObject"
    | "Intangible"
    | "MediaObject"
    | "Occupation"
    | "Person"
    | "QuantitiveValue"
    | "StructuredValue"
    | "Thing" = "Thing";
  readonly url: purify.Maybe<rdfjs.NamedNode>;

  constructor(parameters: {
    readonly description?: purify.Maybe<string> | string;
    readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    readonly images?: readonly schema_Image[];
    readonly name?: purify.Maybe<string> | string;
    readonly sameAs?: readonly rdfjs.NamedNode[];
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

    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
    } else {
      this._identifier = parameters.identifier as never;
    }

    if (typeof parameters.images === "undefined") {
      this.images = [];
    } else if (Array.isArray(parameters.images)) {
      this.images = parameters.images;
    } else {
      this.images = parameters.images as never;
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

  get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
  }

  equals(other: Thing): EqualsResult {
    return ((left, right) => maybeEquals(left, right, strictEquals))(
      this.description,
      other.description,
    )
      .mapLeft((propertyValuesUnequal) => ({
        left: this,
        right: other,
        propertyName: "description",
        propertyValuesUnequal,
        type: "Property" as const,
      }))
      .chain(() =>
        booleanEquals(this.identifier, other.identifier).mapLeft(
          (propertyValuesUnequal) => ({
            left: this,
            right: other,
            propertyName: "identifier",
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
    this.description.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    _hasher.update(this.identifier.value);
    for (const _item0 of this.images) {
      _item0.hash(_hasher);
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
    readonly description: string | undefined;
    readonly "@id": string;
    readonly images: readonly ReturnType<schema_Image["toJson"]>[];
    readonly name: string | undefined;
    readonly sameAs: readonly { readonly "@id": string }[];
    readonly type:
      | "CreativeWork"
      | "Enumeration"
      | "GenderType"
      | "ImageObject"
      | "Intangible"
      | "MediaObject"
      | "Occupation"
      | "Person"
      | "QuantitiveValue"
      | "StructuredValue"
      | "Thing";
    readonly url: { readonly "@id": string } | undefined;
  } {
    return JSON.parse(
      JSON.stringify({
        description: this.description.map((_item) => _item).extract(),
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        images: this.images.map((_item) => _item.toJson()),
        name: this.name.map((_item) => _item).extract(),
        sameAs: this.sameAs.map((_item) => ({ "@id": _item.value })),
        type: this.type,
        url: this.url.map((_item) => ({ "@id": _item.value })).extract(),
      } satisfies ReturnType<Thing["toJson"]>),
    );
  }

  toRdf({
    ignoreRdfType,
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
      dataFactory.namedNode("http://schema.org/image"),
      this.images.map((_item) =>
        _item.toRdf({ mutateGraph: mutateGraph, resourceSet: resourceSet }),
      ),
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
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      description: purify.Maybe<string>;
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      images: readonly schema_Image[];
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
    const description = purify.Maybe.fromNullable(_jsonObject["description"]);
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const images = _jsonObject["images"].map((_item) =>
      schema_Image.fromJson(_item).unsafeCoerce(),
    );
    const name = purify.Maybe.fromNullable(_jsonObject["name"]);
    const sameAs = _jsonObject["sameAs"].map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    const url = purify.Maybe.fromNullable(_jsonObject["url"]).map((_item) =>
      dataFactory.namedNode(_item["@id"]),
    );
    return purify.Either.of({
      description,
      identifier,
      images,
      name,
      sameAs,
      url,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Thing> {
    return Thing.propertiesFromJson(json).map(
      (properties) => new Thing(properties),
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
      description: purify.Maybe<string>;
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      images: readonly schema_Image[];
      name: purify.Maybe<string>;
      sameAs: readonly rdfjs.NamedNode[];
      url: purify.Maybe<rdfjs.NamedNode>;
    }
  > {
    if (
      !_ignoreRdfType &&
      !_resource.isInstanceOf(dataFactory.namedNode("http://schema.org/Thing"))
    ) {
      return purify.Left(
        new rdfjsResource.Resource.ValueError({
          focusResource: _resource,
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode("http://schema.org/Thing"),
        }),
      );
    }

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
    const identifier = _resource.identifier;
    const _imagesEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly schema_Image[]
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
              schema_Image.fromRdf({
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
      description,
      identifier,
      images,
      name,
      sameAs,
      url,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof Thing.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Thing> {
    return Thing.propertiesFromRdf(parameters).map(
      (properties) => new Thing(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Thing",
  );

  export function jsonSchema() {
    return zodToJsonSchema(thingJsonZodSchema());
  }

  export function thingJsonUiSchema(parameters?: { scopePrefix?: string }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [
        { scope: `${scopePrefix}/properties/description`, type: "Control" },
        {
          label: "Identifier",
          scope: `${scopePrefix}/properties/@id`,
          type: "Control",
        },
        schema_Image.jsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/images`,
        }),
        { scope: `${scopePrefix}/properties/name`, type: "Control" },
        { scope: `${scopePrefix}/properties/sameAs`, type: "Control" },
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
        { scope: `${scopePrefix}/properties/url`, type: "Control" },
      ],
      label: "Thing",
      type: "Group",
    };
  }

  export function thingJsonZodSchema() {
    return zod.object({
      description: zod.string().optional(),
      "@id": zod.string().min(1),
      images: schema_Image.jsonZodSchema().array(),
      name: zod.string().optional(),
      sameAs: zod.object({ "@id": zod.string().min(1) }).array(),
      type: zod.enum([
        "CreativeWork",
        "Enumeration",
        "GenderType",
        "ImageObject",
        "Intangible",
        "MediaObject",
        "Occupation",
        "Person",
        "QuantitiveValue",
        "StructuredValue",
        "Thing",
      ]),
      url: zod.object({ "@id": zod.string().min(1) }).optional(),
    });
  }
}
export class Intangible extends Thing {
  override readonly type:
    | "Enumeration"
    | "GenderType"
    | "Intangible"
    | "Occupation"
    | "QuantitiveValue"
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

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
    return _hasher;
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

export namespace Intangible {
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = intangibleJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing.propertiesFromJson(_jsonObject);
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
    return Intangible.propertiesFromJson(json).map(
      (properties) => new Intangible(properties),
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing.propertiesFromRdf>
    >
  > {
    const _super0Either = Thing.propertiesFromRdf({
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode("http://schema.org/Intangible"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof Intangible.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Intangible> {
    return Intangible.propertiesFromRdf(parameters).map(
      (properties) => new Intangible(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Intangible",
  );

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
          "Enumeration",
          "GenderType",
          "Intangible",
          "Occupation",
          "QuantitiveValue",
          "StructuredValue",
        ]),
      }),
    );
  }
}
export class StructuredValue extends Intangible {
  override readonly type: "QuantitiveValue" | "StructuredValue" =
    "StructuredValue";

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

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
    return _hasher;
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

export namespace StructuredValue {
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult =
      structuredValueJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible.propertiesFromJson(_jsonObject);
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
    return StructuredValue.propertiesFromJson(json).map(
      (properties) => new StructuredValue(properties),
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible.propertiesFromRdf>
    >
  > {
    const _super0Either = Intangible.propertiesFromRdf({
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode("http://schema.org/StructuredValue"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof StructuredValue.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, StructuredValue> {
    return StructuredValue.propertiesFromRdf(parameters).map(
      (properties) => new StructuredValue(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/StructuredValue",
  );

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
        type: zod.enum(["QuantitiveValue", "StructuredValue"]),
      }),
    );
  }
}
export class Person extends Thing {
  readonly birthDate: readonly rdfjs.Literal[];
  readonly familyName: purify.Maybe<string>;
  readonly gender: readonly (
    | rdfjs.BlankNode
    | rdfjs.NamedNode
    | rdfjs.Literal
  )[];
  readonly givenName: purify.Maybe<string>;
  readonly hasOccupation: readonly Occupation[];
  override readonly type = "Person";

  constructor(
    parameters: {
      readonly birthDate?: readonly rdfjs.Literal[];
      readonly familyName?: purify.Maybe<string> | string;
      readonly gender?: readonly (
        | rdfjs.BlankNode
        | rdfjs.NamedNode
        | rdfjs.Literal
      )[];
      readonly givenName?: purify.Maybe<string> | string;
      readonly hasOccupation?: readonly Occupation[];
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    } & ConstructorParameters<typeof Thing>[0],
  ) {
    super(parameters);
    if (typeof parameters.birthDate === "undefined") {
      this.birthDate = [];
    } else if (Array.isArray(parameters.birthDate)) {
      this.birthDate = parameters.birthDate;
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

    if (typeof parameters.gender === "undefined") {
      this.gender = [];
    } else if (Array.isArray(parameters.gender)) {
      this.gender = parameters.gender;
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
        ((left, right) => arrayEquals(left, right, booleanEquals))(
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
        ((left, right) => arrayEquals(left, right, booleanEquals))(
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
          arrayEquals(left, right, (left, right) => left.equals(right)))(
          this.hasOccupation,
          other.hasOccupation,
        ).mapLeft((propertyValuesUnequal) => ({
          left: this,
          right: other,
          propertyName: "hasOccupation",
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
    super.hash(_hasher);
    for (const _item0 of this.birthDate) {
      _hasher.update(_item0.datatype.value);
      _hasher.update(_item0.language);
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
    }

    this.familyName.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.gender) {
      _hasher.update(_item0.termType);
      _hasher.update(_item0.value);
    }

    this.givenName.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    for (const _item0 of this.hasOccupation) {
      _item0.hash(_hasher);
    }

    _hasher.update(this.identifier.value);
    return _hasher;
  }

  override toJson(): {
    readonly birthDate: readonly {
      readonly "@language": string | undefined;
      readonly "@type": string | undefined;
      readonly "@value": string;
    }[];
    readonly familyName: string | undefined;
    readonly gender: readonly (
      | { readonly "@id": string; readonly termType: "BlankNode" | "NamedNode" }
      | {
          readonly "@language": string | undefined;
          readonly "@type": string | undefined;
          readonly "@value": string;
          readonly termType: "Literal";
        }
    )[];
    readonly givenName: string | undefined;
    readonly hasOccupation: readonly ReturnType<Occupation["toJson"]>[];
  } & ReturnType<Thing["toJson"]> {
    return JSON.parse(
      JSON.stringify({
        ...super.toJson(),
        birthDate: this.birthDate.map((_item) => ({
          "@language": _item.language.length > 0 ? _item.language : undefined,
          "@type":
            _item.datatype.value !== "http://www.w3.org/2001/XMLSchema#string"
              ? _item.datatype.value
              : undefined,
          "@value": _item.value,
        })),
        familyName: this.familyName.map((_item) => _item).extract(),
        gender: this.gender.map((_item) =>
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
        givenName: this.givenName.map((_item) => _item).extract(),
        hasOccupation: this.hasOccupation.map((_item) => _item.toJson()),
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
      this.birthDate.map((_item) => _item),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/familyName"),
      this.familyName,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/gender"),
      this.gender.map((_item) => _item),
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/givenName"),
      this.givenName,
    );
    _resource.add(
      dataFactory.namedNode("http://schema.org/hasOccupation"),
      this.hasOccupation.map((_item) =>
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
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      birthDate: readonly rdfjs.Literal[];
      familyName: purify.Maybe<string>;
      gender: readonly (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)[];
      givenName: purify.Maybe<string>;
      hasOccupation: readonly Occupation[];
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
    } & UnwrapR<ReturnType<typeof Thing.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = personJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const birthDate = _jsonObject["birthDate"].map((_item) =>
      dataFactory.literal(
        _item["@value"],
        typeof _item["@language"] !== "undefined"
          ? _item["@language"]
          : typeof _item["@type"] !== "undefined"
            ? dataFactory.namedNode(_item["@type"])
            : undefined,
      ),
    );
    const familyName = purify.Maybe.fromNullable(_jsonObject["familyName"]);
    const gender = _jsonObject["gender"].map((_item) =>
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
      Occupation.fromJson(_item).unsafeCoerce(),
    );
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({
      ..._super0,
      birthDate,
      familyName,
      gender,
      givenName,
      hasOccupation,
      identifier,
    });
  }

  export function fromJson(json: unknown): purify.Either<zod.ZodError, Person> {
    return Person.propertiesFromJson(json).map(
      (properties) => new Person(properties),
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
      birthDate: readonly rdfjs.Literal[];
      familyName: purify.Maybe<string>;
      gender: readonly (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)[];
      givenName: purify.Maybe<string>;
      hasOccupation: readonly Occupation[];
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
    } & UnwrapR<ReturnType<typeof Thing.propertiesFromRdf>>
  > {
    const _super0Either = Thing.propertiesFromRdf({
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

    const _birthDateEither: purify.Either<
      rdfjsResource.Resource.ValueError,
      readonly rdfjs.Literal[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/birthDate"), {
          unique: true,
        })
        .flatMap((_item) =>
          _item
            .toValues()
            .filter((_value) => {
              const _languageInOrDefault = _languageIn ?? [];
              if (_languageInOrDefault.length === 0) {
                return true;
              }
              const _valueLiteral = _value.toLiteral().toMaybe().extract();
              if (typeof _valueLiteral === "undefined") {
                return false;
              }
              return _languageInOrDefault.some(
                (_languageIn) => _languageIn === _valueLiteral.language,
              );
            })
            .head()
            .chain((_value) => _value.toLiteral())
            .toMaybe()
            .toList(),
        ),
    ]);
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
      readonly (rdfjs.BlankNode | rdfjs.NamedNode | rdfjs.Literal)[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/gender"), {
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
      readonly Occupation[]
    > = purify.Either.of([
      ..._resource
        .values(dataFactory.namedNode("http://schema.org/hasOccupation"), {
          unique: true,
        })
        .flatMap((_item) =>
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
            )
            .toMaybe()
            .toList(),
        ),
    ]);
    if (_hasOccupationEither.isLeft()) {
      return _hasOccupationEither;
    }

    const hasOccupation = _hasOccupationEither.unsafeCoerce();
    const identifier = _resource.identifier;
    return purify.Either.of({
      ..._super0,
      birthDate,
      familyName,
      gender,
      givenName,
      hasOccupation,
      identifier,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof Person.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Person> {
    return Person.propertiesFromRdf(parameters).map(
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
        Occupation.occupationJsonUiSchema({
          scopePrefix: `${scopePrefix}/properties/hasOccupation`,
        }),
      ],
      label: "Person",
      type: "Group",
    };
  }

  export function personJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({
        birthDate: zod
          .object({
            "@language": zod.string().optional(),
            "@type": zod.string().optional(),
            "@value": zod.string(),
          })
          .array(),
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
          .array(),
        givenName: zod.string().optional(),
        hasOccupation: Occupation.occupationJsonZodSchema().array(),
        "@id": zod.string().min(1),
        type: zod.literal("Person"),
      }),
    );
  }
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

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
    return _hasher;
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
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = occupationJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible.propertiesFromJson(_jsonObject);
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
    return Occupation.propertiesFromJson(json).map(
      (properties) => new Occupation(properties),
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible.propertiesFromRdf>
    >
  > {
    const _super0Either = Intangible.propertiesFromRdf({
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
    parameters: Parameters<typeof Occupation.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Occupation> {
    return Occupation.propertiesFromRdf(parameters).map(
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
  override readonly type = "QuantitiveValue";
  readonly value: purify.Maybe<number>;

  constructor(
    parameters: {
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
      readonly value?: number | purify.Maybe<number>;
    } & ConstructorParameters<typeof StructuredValue>[0],
  ) {
    super(parameters);
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
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
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
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      value: purify.Maybe<number>;
    } & UnwrapR<ReturnType<typeof StructuredValue.propertiesFromJson>>
  > {
    const _jsonSafeParseResult =
      quantitiveValueJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = StructuredValue.propertiesFromJson(_jsonObject);
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
    return QuantitiveValue.propertiesFromJson(json).map(
      (properties) => new QuantitiveValue(properties),
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
      value: purify.Maybe<number>;
    } & UnwrapR<ReturnType<typeof StructuredValue.propertiesFromRdf>>
  > {
    const _super0Either = StructuredValue.propertiesFromRdf({
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
    parameters: Parameters<typeof QuantitiveValue.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, QuantitiveValue> {
    return QuantitiveValue.propertiesFromRdf(parameters).map(
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
export class CreativeWork extends Thing {
  override readonly type: "CreativeWork" | "ImageObject" | "MediaObject" =
    "CreativeWork";

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

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
    return _hasher;
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

export namespace CreativeWork {
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = creativeWorkJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Thing.propertiesFromJson(_jsonObject);
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
  ): purify.Either<zod.ZodError, CreativeWork> {
    return CreativeWork.propertiesFromJson(json).map(
      (properties) => new CreativeWork(properties),
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing.propertiesFromRdf>
    >
  > {
    const _super0Either = Thing.propertiesFromRdf({
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode("http://schema.org/CreativeWork"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof CreativeWork.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, CreativeWork> {
    return CreativeWork.propertiesFromRdf(parameters).map(
      (properties) => new CreativeWork(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/CreativeWork",
  );

  export function jsonSchema() {
    return zodToJsonSchema(creativeWorkJsonZodSchema());
  }

  export function creativeWorkJsonUiSchema(parameters?: {
    scopePrefix?: string;
  }) {
    const scopePrefix = parameters?.scopePrefix ?? "#";
    return {
      elements: [Thing.thingJsonUiSchema({ scopePrefix })],
      label: "CreativeWork",
      type: "Group",
    };
  }

  export function creativeWorkJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({
        "@id": zod.string().min(1),
        type: zod.enum(["CreativeWork", "ImageObject", "MediaObject"]),
      }),
    );
  }
}
export class MediaObject extends CreativeWork {
  readonly contentUrl: purify.Maybe<rdfjs.NamedNode>;
  readonly encodingFormat: purify.Maybe<string>;
  readonly height: purify.Maybe<QuantitiveValue>;
  override readonly type: "ImageObject" | "MediaObject" = "MediaObject";
  readonly width: purify.Maybe<QuantitiveValue>;

  constructor(
    parameters: {
      readonly contentUrl?:
        | rdfjs.NamedNode
        | purify.Maybe<rdfjs.NamedNode>
        | string;
      readonly encodingFormat?: purify.Maybe<string> | string;
      readonly height?: QuantitiveValue | purify.Maybe<QuantitiveValue>;
      readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
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

  override get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
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
    super.hash(_hasher);
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
    _hasher.update(this.identifier.value);
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

export namespace MediaObject {
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      contentUrl: purify.Maybe<rdfjs.NamedNode>;
      encodingFormat: purify.Maybe<string>;
      height: purify.Maybe<QuantitiveValue>;
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      width: purify.Maybe<QuantitiveValue>;
    } & UnwrapR<ReturnType<typeof CreativeWork.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = mediaObjectJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = CreativeWork.propertiesFromJson(_jsonObject);
    if (_super0Either.isLeft()) {
      return _super0Either;
    }

    const _super0 = _super0Either.unsafeCoerce();
    const contentUrl = purify.Maybe.fromNullable(_jsonObject["contentUrl"]).map(
      (_item) => dataFactory.namedNode(_item["@id"]),
    );
    const encodingFormat = purify.Maybe.fromNullable(
      _jsonObject["encodingFormat"],
    );
    const height = purify.Maybe.fromNullable(_jsonObject["height"]).map(
      (_item) => QuantitiveValue.fromJson(_item).unsafeCoerce(),
    );
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    const width = purify.Maybe.fromNullable(_jsonObject["width"]).map((_item) =>
      QuantitiveValue.fromJson(_item).unsafeCoerce(),
    );
    return purify.Either.of({
      ..._super0,
      contentUrl,
      encodingFormat,
      height,
      identifier,
      width,
    });
  }

  export function fromJson(
    json: unknown,
  ): purify.Either<zod.ZodError, MediaObject> {
    return MediaObject.propertiesFromJson(json).map(
      (properties) => new MediaObject(properties),
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
      contentUrl: purify.Maybe<rdfjs.NamedNode>;
      encodingFormat: purify.Maybe<string>;
      height: purify.Maybe<QuantitiveValue>;
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      width: purify.Maybe<QuantitiveValue>;
    } & UnwrapR<ReturnType<typeof CreativeWork.propertiesFromRdf>>
  > {
    const _super0Either = CreativeWork.propertiesFromRdf({
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode("http://schema.org/MediaObject"),
        }),
      );
    }

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
    const identifier = _resource.identifier;
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
      contentUrl,
      encodingFormat,
      height,
      identifier,
      width,
    });
  }

  export function fromRdf(
    parameters: Parameters<typeof MediaObject.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, MediaObject> {
    return MediaObject.propertiesFromRdf(parameters).map(
      (properties) => new MediaObject(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/MediaObject",
  );

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
        contentUrl: zod.object({ "@id": zod.string().min(1) }).optional(),
        encodingFormat: zod.string().optional(),
        height: QuantitiveValue.quantitiveValueJsonZodSchema().optional(),
        "@id": zod.string().min(1),
        type: zod.enum(["ImageObject", "MediaObject"]),
        width: QuantitiveValue.quantitiveValueJsonZodSchema().optional(),
      }),
    );
  }
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

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
    return _hasher;
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
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObject.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = imageObjectJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = MediaObject.propertiesFromJson(_jsonObject);
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
    return ImageObject.propertiesFromJson(json).map(
      (properties) => new ImageObject(properties),
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof MediaObject.propertiesFromRdf>
    >
  > {
    const _super0Either = MediaObject.propertiesFromRdf({
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
    parameters: Parameters<typeof ImageObject.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, ImageObject> {
    return ImageObject.propertiesFromRdf(parameters).map(
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

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
    return _hasher;
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

export namespace Enumeration {
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible.propertiesFromJson>
    >
  > {
    const _jsonSafeParseResult = enumerationJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Intangible.propertiesFromJson(_jsonObject);
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
    return Enumeration.propertiesFromJson(json).map(
      (properties) => new Enumeration(properties),
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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Intangible.propertiesFromRdf>
    >
  > {
    const _super0Either = Intangible.propertiesFromRdf({
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
          message: `${rdfjsResource.Resource.Identifier.toString(_resource.identifier)} has unexpected RDF type`,
          predicate: dataFactory.namedNode("http://schema.org/Enumeration"),
        }),
      );
    }

    const identifier = _resource.identifier;
    return purify.Either.of({ ..._super0, identifier });
  }

  export function fromRdf(
    parameters: Parameters<typeof Enumeration.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, Enumeration> {
    return Enumeration.propertiesFromRdf(parameters).map(
      (properties) => new Enumeration(properties),
    );
  }

  export const fromRdfType: rdfjs.NamedNode<string> = dataFactory.namedNode(
    "http://schema.org/Enumeration",
  );

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
        type: zod.enum(["Enumeration", "GenderType"]),
      }),
    );
  }
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

  override hash<
    HasherT extends {
      update: (message: string | number[] | ArrayBuffer | Uint8Array) => void;
    },
  >(_hasher: HasherT): HasherT {
    super.hash(_hasher);
    _hasher.update(this.identifier.value);
    return _hasher;
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
  export function propertiesFromJson(
    _json: unknown,
  ): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.NamedNode<
        "http://schema.org/Female" | "http://schema.org/Male"
      >;
    } & UnwrapR<ReturnType<typeof Enumeration.propertiesFromJson>>
  > {
    const _jsonSafeParseResult = genderTypeJsonZodSchema().safeParse(_json);
    if (!_jsonSafeParseResult.success) {
      return purify.Left(_jsonSafeParseResult.error);
    }

    const _jsonObject = _jsonSafeParseResult.data;
    const _super0Either = Enumeration.propertiesFromJson(_jsonObject);
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
    return GenderType.propertiesFromJson(json).map(
      (properties) => new GenderType(properties),
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
    } & UnwrapR<ReturnType<typeof Enumeration.propertiesFromRdf>>
  > {
    const _super0Either = Enumeration.propertiesFromRdf({
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
    parameters: Parameters<typeof GenderType.propertiesFromRdf>[0],
  ): purify.Either<rdfjsResource.Resource.ValueError, GenderType> {
    return GenderType.propertiesFromRdf(parameters).map(
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
