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
/**
 * Compare two values for strict equality (===), returning an EqualsResult rather than a boolean.
 */
export function strictEquals<T extends bigint | boolean | number | string>(
  left: T,
  right: T,
): EqualsResult {
  return EqualsResult.fromBooleanEqualsResult(left, right, left === right);
}
type UnwrapR<T> = T extends purify.Either<any, infer R> ? R : never;
export class Thing {
  protected _identifier: (rdfjs.BlankNode | rdfjs.NamedNode) | undefined;
  readonly name: purify.Maybe<string>;
  readonly type: "Person" | "Thing" = "Thing";

  constructor(parameters: {
    readonly identifier?: (rdfjs.BlankNode | rdfjs.NamedNode) | string;
    readonly name?: purify.Maybe<string> | string;
  }) {
    if (typeof parameters.identifier === "object") {
      this._identifier = parameters.identifier;
    } else if (typeof parameters.identifier === "string") {
      this._identifier = dataFactory.namedNode(parameters.identifier);
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
  }

  get identifier(): rdfjs.BlankNode | rdfjs.NamedNode {
    if (typeof this._identifier === "undefined") {
      this._identifier = dataFactory.blankNode();
    }
    return this._identifier;
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
    this.name.ifJust((_value0) => {
      _hasher.update(_value0);
    });
    return _hasher;
  }

  toJson(): {
    readonly "@id": string;
    readonly name: string | undefined;
    readonly type: "Person" | "Thing";
  } {
    return JSON.parse(
      JSON.stringify({
        "@id":
          this.identifier.termType === "BlankNode"
            ? `_:${this.identifier.value}`
            : this.identifier.value,
        name: this.name.map((_item) => _item).extract(),
        type: this.type,
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

    _resource.add(dataFactory.namedNode("http://schema.org/name"), this.name);
    return _resource;
  }

  toString(): string {
    return JSON.stringify(this.toJson());
  }
}

export namespace Thing {
  export function propertiesFromJson(_json: unknown): purify.Either<
    zod.ZodError,
    {
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      name: purify.Maybe<string>;
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
    const name = purify.Maybe.fromNullable(_jsonObject["name"]);
    return purify.Either.of({ identifier, name });
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
      identifier: rdfjs.BlankNode | rdfjs.NamedNode;
      name: purify.Maybe<string>;
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
        {
          label: "Identifier",
          scope: `${scopePrefix}/properties/@id`,
          type: "Control",
        },
        { scope: `${scopePrefix}/properties/name`, type: "Control" },
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
      ],
      label: "Thing",
      type: "Group",
    };
  }

  export function thingJsonZodSchema() {
    return zod.object({
      "@id": zod.string().min(1),
      name: zod.string().optional(),
      type: zod.enum(["Person", "Thing"]),
    });
  }
}
export class Person extends Thing {
  override readonly type = "Person";

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
        _resource.dataFactory.namedNode("http://schema.org/Person"),
      );
    }

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
    { identifier: rdfjs.BlankNode | rdfjs.NamedNode } & UnwrapR<
      ReturnType<typeof Thing.propertiesFromJson>
    >
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
    const identifier = _jsonObject["@id"].startsWith("_:")
      ? dataFactory.blankNode(_jsonObject["@id"].substring(2))
      : dataFactory.namedNode(_jsonObject["@id"]);
    return purify.Either.of({ ..._super0, identifier });
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
    return purify.Either.of({ ..._super0, identifier });
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
      elements: [Thing.thingJsonUiSchema({ scopePrefix })],
      label: "Person",
      type: "Group",
    };
  }

  export function personJsonZodSchema() {
    return Thing.thingJsonZodSchema().merge(
      zod.object({ "@id": zod.string().min(1), type: zod.literal("Person") }),
    );
  }
}
