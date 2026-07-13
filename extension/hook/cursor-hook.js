#!/usr/bin/env node
// Bundled by scripts/build-hook.mjs — edit src/hooks/cursor-hook.mjs instead.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@launchdarkly/js-server-sdk-common/dist/BigSegmentStatusProviderImpl.js
var require_BigSegmentStatusProviderImpl = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/BigSegmentStatusProviderImpl.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var BigSegmentStoreStatusProviderImpl = class {
      constructor(_onRequestStatus) {
        this._onRequestStatus = _onRequestStatus;
      }
      /**
       * Gets the current status of the store, if known.
       *
       * @returns a {@link BigSegmentStoreStatus}, or `undefined` if the SDK has not yet queried the
       *   Big Segment store status
       */
      getStatus() {
        return this._lastStatus;
      }
      /**
       * Gets the current status of the store, querying it if the status has not already been queried.
       *
       * @returns a Promise for the status of the store
       */
      async requireStatus() {
        if (!this._lastStatus) {
          await this._onRequestStatus();
        }
        return this._lastStatus;
      }
      notify() {
        var _a;
        if (this._lastStatus) {
          (_a = this._listener) === null || _a === void 0 ? void 0 : _a.call(this, this._lastStatus);
        }
      }
      setListener(listener) {
        this._listener = listener;
      }
      setStatus(status) {
        this._lastStatus = status;
      }
    };
    exports2.default = BigSegmentStoreStatusProviderImpl;
  }
});

// node_modules/@launchdarkly/js-sdk-common/dist/cjs/index.cjs
var require_cjs = __commonJS({
  "node_modules/@launchdarkly/js-sdk-common/dist/cjs/index.cjs"(exports2) {
    "use strict";
    function toRefString(value) {
      return `/${value.replace(/~/g, "~0").replace(/\//g, "~1")}`;
    }
    function unescape(ref) {
      return ref.indexOf("~") ? ref.replace(/~1/g, "/").replace(/~0/g, "~") : ref;
    }
    function getComponents(reference) {
      const referenceWithoutPrefix = reference.startsWith("/") ? reference.substring(1) : reference;
      return referenceWithoutPrefix.split("/").map((component) => unescape(component));
    }
    function isLiteral(reference) {
      return !reference.startsWith("/");
    }
    function validate(reference) {
      return !reference.match(/\/\/|(^\/.*~[^0|^1])|~$/);
    }
    var AttributeReference = class {
      /**
       * Take an attribute reference string, or literal string, and produce
       * an attribute reference.
       *
       * Legacy user objects would have been created with names not
       * references. So, in that case, we need to use them as a component
       * without escaping them.
       *
       * e.g. A user could contain a custom attribute of `/a` which would
       * become the literal `a` if treated as a reference. Which would cause
       * it to no longer be redacted.
       * @param refOrLiteral The attribute reference string or literal string.
       * @param literal it true the value should be treated as a literal.
       */
      constructor(refOrLiteral, literal = false) {
        if (!literal) {
          this.redactionName = refOrLiteral;
          if (refOrLiteral === "" || refOrLiteral === "/" || !validate(refOrLiteral)) {
            this.isValid = false;
            this._components = [];
            return;
          }
          if (isLiteral(refOrLiteral)) {
            this._components = [refOrLiteral];
          } else if (refOrLiteral.indexOf("/", 1) < 0) {
            this._components = [unescape(refOrLiteral.slice(1))];
          } else {
            this._components = getComponents(refOrLiteral);
          }
          if (this._components[0] === "_meta") {
            this.isValid = false;
          } else {
            this.isValid = true;
          }
        } else {
          const literalVal = refOrLiteral;
          this._components = [literalVal];
          this.isValid = literalVal !== "";
          this.redactionName = literalVal.startsWith("/") ? toRefString(literalVal) : literalVal;
        }
      }
      get(target) {
        const { _components: components, isValid } = this;
        if (!isValid) {
          return void 0;
        }
        let current = target;
        for (let index2 = 0; index2 < components.length; index2 += 1) {
          const component = components[index2];
          if (current !== null && current !== void 0 && // See https://eslint.org/docs/rules/no-prototype-builtins
          Object.prototype.hasOwnProperty.call(current, component) && typeof current === "object" && // We do not want to allow indexing into an array.
          !Array.isArray(current)) {
            current = current[component];
          } else {
            return void 0;
          }
        }
        return current;
      }
      getComponent(depth) {
        return this._components[depth];
      }
      get depth() {
        return this._components.length;
      }
      get isKind() {
        return this._components.length === 1 && this._components[0] === "kind";
      }
      compare(other) {
        return this.depth === other.depth && this._components.every((value, index2) => value === other.getComponent(index2));
      }
      get components() {
        return [...this._components];
      }
    };
    AttributeReference.InvalidReference = new AttributeReference("");
    var FactoryOrInstance = class {
      is(factoryOrInstance) {
        if (Array.isArray(factoryOrInstance)) {
          return false;
        }
        const anyFactory = factoryOrInstance;
        const typeOfFactory = typeof anyFactory;
        return typeOfFactory === "function" || typeOfFactory === "object";
      }
      getType() {
        return "factory method or object";
      }
    };
    var Type = class {
      constructor(typeName, example) {
        this._typeName = typeName;
        this.typeOf = typeof example;
      }
      is(u) {
        if (Array.isArray(u)) {
          return false;
        }
        return typeof u === this.typeOf;
      }
      getType() {
        return this._typeName;
      }
    };
    var TypeArray = class {
      constructor(typeName, example) {
        this._typeName = typeName;
        this.typeOf = typeof example;
      }
      is(u) {
        if (Array.isArray(u)) {
          if (u.length > 0) {
            return u.every((val) => typeof val === this.typeOf);
          }
          return true;
        }
        return false;
      }
      getType() {
        return this._typeName;
      }
    };
    var NumberWithMinimum = class extends Type {
      constructor(min) {
        super(`number with minimum value of ${min}`, 0);
        this.min = min;
      }
      is(u) {
        return typeof u === this.typeOf && u >= this.min;
      }
    };
    var StringMatchingRegex = class extends Type {
      constructor(expression) {
        super(`string matching ${expression}`, "");
        this.expression = expression;
      }
      is(u) {
        return typeof u === "string" && !!u.match(this.expression);
      }
    };
    var Function = class {
      is(u) {
        return typeof u === "function";
      }
      getType() {
        return "function";
      }
    };
    var NullableBoolean = class {
      is(u) {
        return typeof u === "boolean" || typeof u === "undefined" || u === null;
      }
      getType() {
        return "boolean | undefined | null";
      }
    };
    var DATE_REGEX = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d\d*)?(Z|[-+]\d\d(:\d\d)?)/;
    var DateValidator = class {
      is(u) {
        return typeof u === "number" || typeof u === "string" && DATE_REGEX.test(u);
      }
      getType() {
        return "date";
      }
    };
    var KindValidator = class extends StringMatchingRegex {
      constructor() {
        super(/^(\w|\.|-)+$/);
      }
      is(u) {
        return super.is(u) && u !== "kind";
      }
    };
    var OneOf = class {
      constructor(values) {
        this._values = values;
      }
      is(u) {
        return typeof u === "string" && this._values.includes(u);
      }
      getType() {
        return this._values.join(" | ");
      }
    };
    function isNullish(value) {
      return value === null || value === void 0;
    }
    var TypeValidators = class {
      static createTypeArray(typeName, example) {
        return new TypeArray(typeName, example);
      }
      static numberWithMin(min) {
        return new NumberWithMinimum(min);
      }
      static stringMatchingRegex(expression) {
        return new StringMatchingRegex(expression);
      }
      static oneOf(...values) {
        return new OneOf(values);
      }
    };
    TypeValidators.String = new Type("string", "");
    TypeValidators.Number = new Type("number", 0);
    TypeValidators.ObjectOrFactory = new FactoryOrInstance();
    TypeValidators.Object = new Type("object", {});
    TypeValidators.StringArray = new TypeArray("string[]", "");
    TypeValidators.Boolean = new Type("boolean", true);
    TypeValidators.Function = new Function();
    TypeValidators.Date = new DateValidator();
    TypeValidators.Kind = new KindValidator();
    TypeValidators.NullableBoolean = new NullableBoolean();
    function isSingleKind(context) {
      if ("kind" in context) {
        return TypeValidators.String.is(context.kind) && context.kind !== "multi";
      }
      return false;
    }
    function isMultiKind(context) {
      if ("kind" in context) {
        return TypeValidators.String.is(context.kind) && context.kind === "multi";
      }
      return false;
    }
    function isLegacyUser(context) {
      return !("kind" in context) || context.kind === null || context.kind === void 0;
    }
    function canonicalize(object, visited = []) {
      if (object === null || typeof object !== "object") {
        return JSON.stringify(object);
      }
      if (visited.includes(object)) {
        throw new Error("Cycle detected");
      }
      if (Array.isArray(object)) {
        const values2 = object.map((item) => canonicalize(item, [...visited, object])).map((item) => item === void 0 ? "null" : item);
        return `[${values2.join(",")}]`;
      }
      const values = Object.keys(object).sort().map((key) => {
        const value = canonicalize(object[key], [...visited, object]);
        if (value !== void 0) {
          return `${JSON.stringify(key)}:${value}`;
        }
        return void 0;
      }).filter((item) => item !== void 0);
      return `{${values.join(",")}}`;
    }
    var DEFAULT_KIND = "user";
    function encodeKey(key) {
      if (key.includes("%") || key.includes(":")) {
        return key.replace(/%/g, "%25").replace(/:/g, "%3A");
      }
      return key;
    }
    function isContextCommon(kindOrContext) {
      return kindOrContext && TypeValidators.Object.is(kindOrContext);
    }
    function validKind(kind) {
      return TypeValidators.Kind.is(kind);
    }
    function validKey(key) {
      return TypeValidators.String.is(key) && key !== "";
    }
    function processPrivateAttributes(privateAttributes, literals = false) {
      if (privateAttributes) {
        return privateAttributes.map((privateAttribute) => new AttributeReference(privateAttribute, literals));
      }
      return [];
    }
    function defined(value) {
      return value !== null && value !== void 0;
    }
    function legacyToSingleKind(user) {
      const singleKindContext = {
        // Key was coerced to a string for eval and events, so we can do that up-front.
        ...user.custom || [],
        kind: "user",
        key: String(user.key)
      };
      if (defined(user.anonymous)) {
        const anonymous = !!user.anonymous;
        delete singleKindContext.anonymous;
        singleKindContext.anonymous = anonymous;
      }
      if (user.name !== null && user.name !== void 0) {
        singleKindContext.name = user.name;
      }
      if (user.ip !== null && user.ip !== void 0) {
        singleKindContext.ip = user.ip;
      }
      if (user.firstName !== null && user.firstName !== void 0) {
        singleKindContext.firstName = user.firstName;
      }
      if (user.lastName !== null && user.lastName !== void 0) {
        singleKindContext.lastName = user.lastName;
      }
      if (user.email !== null && user.email !== void 0) {
        singleKindContext.email = user.email;
      }
      if (user.avatar !== null && user.avatar !== void 0) {
        singleKindContext.avatar = user.avatar;
      }
      if (user.country !== null && user.country !== void 0) {
        singleKindContext.country = user.country;
      }
      if (user.privateAttributeNames !== null && user.privateAttributeNames !== void 0) {
        singleKindContext._meta = {
          privateAttributes: user.privateAttributeNames
        };
      }
      return singleKindContext;
    }
    var Context = class _Context {
      /**
       * Contexts should be created using the static factory method {@link Context.fromLDContext}.
       * @param kind The kind of the context.
       *
       * The factory methods are static functions within the class because they access private
       * implementation details, so they cannot be free functions.
       */
      constructor(valid, kind, message) {
        this._isMulti = false;
        this._isUser = false;
        this._wasLegacy = false;
        this._contexts = {};
        this.kind = kind;
        this.valid = valid;
        this.message = message;
      }
      static _contextForError(kind, message) {
        return new _Context(false, kind, message);
      }
      static _getValueFromContext(reference, context) {
        if (!context || !reference.isValid) {
          return void 0;
        }
        if (reference.depth === 1 && reference.getComponent(0) === "anonymous") {
          return !!context?.anonymous;
        }
        return reference.get(context);
      }
      _contextForKind(kind) {
        if (this._isMulti) {
          return this._contexts[kind];
        }
        if (this.kind === kind) {
          return this._context;
        }
        return void 0;
      }
      static _fromMultiKindContext(context) {
        const kinds = Object.keys(context).filter((key) => key !== "kind");
        const kindsValid = kinds.every(validKind);
        if (!kinds.length) {
          return _Context._contextForError("multi", "A multi-kind context must contain at least one kind");
        }
        if (!kindsValid) {
          return _Context._contextForError("multi", "Context contains invalid kinds");
        }
        const privateAttributes = {};
        let contextsAreObjects = true;
        const contexts = kinds.reduce((acc, kind) => {
          const singleContext = context[kind];
          if (isContextCommon(singleContext)) {
            acc[kind] = singleContext;
            privateAttributes[kind] = processPrivateAttributes(singleContext._meta?.privateAttributes);
          } else {
            contextsAreObjects = false;
          }
          return acc;
        }, {});
        if (!contextsAreObjects) {
          return _Context._contextForError("multi", "Context contained contexts that were not objects");
        }
        if (!Object.values(contexts).every((part) => validKey(part.key))) {
          return _Context._contextForError("multi", "Context contained invalid keys");
        }
        if (kinds.length === 1) {
          const kind = kinds[0];
          const created2 = new _Context(true, kind);
          created2._context = { ...contexts[kind], kind };
          created2._privateAttributeReferences = privateAttributes;
          created2._isUser = kind === "user";
          return created2;
        }
        const created = new _Context(true, context.kind);
        created._contexts = contexts;
        created._privateAttributeReferences = privateAttributes;
        created._isMulti = true;
        return created;
      }
      static _fromSingleKindContext(context) {
        const { key, kind } = context;
        const kindValid = validKind(kind);
        const keyValid = validKey(key);
        if (!kindValid) {
          return _Context._contextForError(kind ?? "unknown", "The kind was not valid for the context");
        }
        if (!keyValid) {
          return _Context._contextForError(kind, "The key for the context was not valid");
        }
        const privateAttributeReferences = processPrivateAttributes(context._meta?.privateAttributes);
        const created = new _Context(true, kind);
        created._isUser = kind === "user";
        created._context = context;
        created._privateAttributeReferences = {
          [kind]: privateAttributeReferences
        };
        return created;
      }
      static _fromLegacyUser(context) {
        const keyValid = context.key !== void 0 && context.key !== null;
        if (!keyValid) {
          return _Context._contextForError("user", "The key for the context was not valid");
        }
        const created = new _Context(true, "user");
        created._isUser = true;
        created._wasLegacy = true;
        created._context = legacyToSingleKind(context);
        created._privateAttributeReferences = {
          user: processPrivateAttributes(context.privateAttributeNames, true)
        };
        return created;
      }
      /**
       * Attempt to create a {@link Context} from an {@link LDContext}.
       * @param context The input context to create a Context from.
       * @returns a {@link Context}, if the context was not valid, then the returned contexts `valid`
       * property will be false.
       */
      static fromLDContext(context) {
        if (!context) {
          return _Context._contextForError("unknown", "No context specified. Returning default value");
        }
        if (isSingleKind(context)) {
          return _Context._fromSingleKindContext(context);
        }
        if (isMultiKind(context)) {
          return _Context._fromMultiKindContext(context);
        }
        if (isLegacyUser(context)) {
          return _Context._fromLegacyUser(context);
        }
        return _Context._contextForError("unknown", "Context was not of a valid kind");
      }
      /**
       * Creates a {@link LDContext} from a {@link Context}.
       * @param context to be converted
       * @returns an {@link LDContext} if input was valid, otherwise undefined
       */
      static toLDContext(context) {
        if (!context.valid) {
          return void 0;
        }
        const contexts = context.getContexts();
        if (!context._isMulti) {
          return contexts[0][1];
        }
        const result = {
          kind: "multi"
        };
        contexts.forEach((kindAndContext) => {
          const kind = kindAndContext[0];
          const nestedContext = kindAndContext[1];
          result[kind] = nestedContext;
        });
        return result;
      }
      /**
       * Attempt to get a value for the given context kind using the given reference.
       * @param reference The reference to the value to get.
       * @param kind The kind of the context to get the value for.
       * @returns a value or `undefined` if one is not found.
       */
      valueForKind(reference, kind = DEFAULT_KIND) {
        if (reference.isKind) {
          return this.kinds;
        }
        return _Context._getValueFromContext(reference, this._contextForKind(kind));
      }
      /**
       * Attempt to get a key for the specified kind.
       * @param kind The kind to get a key for.
       * @returns The key for the specified kind, or undefined.
       */
      key(kind = DEFAULT_KIND) {
        return this._contextForKind(kind)?.key;
      }
      /**
       * True if this is a multi-kind context.
       */
      get isMultiKind() {
        return this._isMulti;
      }
      /**
       * Get the canonical key for this context.
       */
      get canonicalKey() {
        if (this._isUser) {
          return this._context.key;
        }
        if (this._isMulti) {
          return Object.keys(this._contexts).sort().map((key) => `${key}:${encodeKey(this._contexts[key].key)}`).join(":");
        }
        return `${this.kind}:${encodeKey(this._context.key)}`;
      }
      /**
       * Get the kinds of this context.
       */
      get kinds() {
        if (this._isMulti) {
          return Object.keys(this._contexts);
        }
        return [this.kind];
      }
      /**
       * Get the kinds, and their keys, for this context.
       */
      get kindsAndKeys() {
        if (this._isMulti) {
          return Object.entries(this._contexts).reduce((acc, [kind, context]) => {
            acc[kind] = context.key;
            return acc;
          }, {});
        }
        return { [this.kind]: this._context.key };
      }
      /**
       * Get the attribute references.
       *
       * @param kind
       */
      privateAttributes(kind) {
        return this._privateAttributeReferences?.[kind] || [];
      }
      /**
       * Get the underlying context objects from this context.
       *
       * This method is intended to be used in event generation.
       *
       * The returned objects should not be modified.
       */
      getContexts() {
        if (this._isMulti) {
          return Object.entries(this._contexts);
        }
        return [[this.kind, this._context]];
      }
      get legacy() {
        return this._wasLegacy;
      }
      /**
       * Get the serialized canonical JSON for this context. This is not filtered for use in events.
       *
       * This method will cache the result.
       *
       * @returns The serialized canonical JSON or undefined if it cannot be serialized.
       */
      canonicalUnfilteredJson() {
        if (!this.valid) {
          return void 0;
        }
        if (this._cachedCanonicalJson) {
          return this._cachedCanonicalJson;
        }
        try {
          this._cachedCanonicalJson = canonicalize(_Context.toLDContext(this));
        } catch {
        }
        return this._cachedCanonicalJson;
      }
    };
    Context.UserKind = DEFAULT_KIND;
    var protectedAttributes = ["key", "kind", "_meta", "anonymous"].map((str) => new AttributeReference(str, true));
    var legacyTopLevelCopyAttributes = [
      "name",
      "ip",
      "firstName",
      "lastName",
      "email",
      "avatar",
      "country"
    ];
    function compare(a, b) {
      return a.depth === b.length && b.every((value, index2) => value === a.getComponent(index2));
    }
    function cloneWithRedactions(target, references) {
      const stack = [];
      const cloned = {};
      const excluded = [];
      stack.push(...Object.keys(target).map((key) => ({
        key,
        ptr: [key],
        source: target,
        parent: cloned,
        visited: [target]
      })));
      while (stack.length) {
        const item = stack.pop();
        const redactRef = references.find((ref) => compare(ref, item.ptr));
        if (!redactRef) {
          const value = item.source[item.key];
          if (value === null) {
            item.parent[item.key] = value;
          } else if (Array.isArray(value)) {
            item.parent[item.key] = [...value];
          } else if (typeof value === "object") {
            if (!item.visited.includes(value)) {
              item.parent[item.key] = {};
              stack.push(...Object.keys(value).map((key) => ({
                key,
                ptr: [...item.ptr, key],
                source: value,
                parent: item.parent[item.key],
                visited: [...item.visited, value]
              })));
            }
          } else {
            item.parent[item.key] = value;
          }
        } else {
          excluded.push(redactRef.redactionName);
        }
      }
      return { cloned, excluded: excluded.sort() };
    }
    var ContextFilter = class {
      constructor(_allAttributesPrivate, _privateAttributes) {
        this._allAttributesPrivate = _allAttributesPrivate;
        this._privateAttributes = _privateAttributes;
      }
      filter(context, redactAnonymousAttributes = false) {
        const contexts = context.getContexts();
        if (contexts.length === 1) {
          return this._filterSingleKind(context, contexts[0][1], contexts[0][0], redactAnonymousAttributes);
        }
        const filteredMulti = {
          kind: "multi"
        };
        contexts.forEach(([kind, single]) => {
          filteredMulti[kind] = this._filterSingleKind(context, single, kind, redactAnonymousAttributes);
        });
        return filteredMulti;
      }
      _getAttributesToFilter(context, single, kind, redactAllAttributes) {
        return (redactAllAttributes ? Object.keys(single).map((k) => new AttributeReference(k, true)) : [...this._privateAttributes, ...context.privateAttributes(kind)]).filter((attr) => !protectedAttributes.some((protectedAttr) => protectedAttr.compare(attr)));
      }
      _filterSingleKind(context, single, kind, redactAnonymousAttributes) {
        const redactAllAttributes = this._allAttributesPrivate || redactAnonymousAttributes && single.anonymous === true;
        const { cloned, excluded } = cloneWithRedactions(single, this._getAttributesToFilter(context, single, kind, redactAllAttributes));
        if (context.legacy) {
          legacyTopLevelCopyAttributes.forEach((name) => {
            if (name in cloned) {
              cloned[name] = String(cloned[name]);
            }
          });
        }
        if (excluded.length) {
          if (!cloned._meta) {
            cloned._meta = {};
          }
          cloned._meta.redactedAttributes = excluded;
        }
        if (cloned._meta) {
          delete cloned._meta.privateAttributes;
          if (Object.keys(cloned._meta).length === 0) {
            delete cloned._meta;
          }
        }
        return cloned;
      }
    };
    var MAX_RETRY_DELAY = 30 * 1e3;
    var JITTER_RATIO = 0.5;
    var DefaultBackoff = class {
      constructor(initialRetryDelayMillis, _retryResetIntervalMillis, _random = Math.random) {
        this._retryResetIntervalMillis = _retryResetIntervalMillis;
        this._random = _random;
        this._retryCount = 0;
        this._initialRetryDelayMillis = Math.max(1, initialRetryDelayMillis);
        this._maxExponent = Math.ceil(Math.log2(MAX_RETRY_DELAY / this._initialRetryDelayMillis));
      }
      _backoff() {
        const exponent = Math.min(this._retryCount, this._maxExponent);
        const delay = this._initialRetryDelayMillis * 2 ** exponent;
        return Math.min(delay, MAX_RETRY_DELAY);
      }
      _jitter(computedDelayMillis) {
        return computedDelayMillis - Math.trunc(this._random() * JITTER_RATIO * computedDelayMillis);
      }
      /**
       * This function should be called when a connection attempt is successful.
       *
       * @param timeStampMs The time of the success. Used primarily for testing, when not provided
       * the current time is used.
       */
      success(timeStampMs = Date.now()) {
        this._activeSince = timeStampMs;
      }
      /**
       * This function should be called when a connection fails. It returns the a delay, in
       * milliseconds, after which a reconnection attempt should be made.
       *
       * @param timeStampMs The time of the success. Used primarily for testing, when not provided
       * the current time is used.
       * @returns The delay before the next connection attempt.
       */
      fail(timeStampMs = Date.now()) {
        if (this._activeSince !== void 0 && timeStampMs - this._activeSince > this._retryResetIntervalMillis) {
          this._retryCount = 0;
        }
        this._activeSince = void 0;
        const delay = this._jitter(this._backoff());
        this._retryCount += 1;
        return delay;
      }
    };
    var CallbackHandler = class {
      constructor(_dataCallback, _statusCallback) {
        this._dataCallback = _dataCallback;
        this._statusCallback = _statusCallback;
        this._disabled = false;
      }
      disable() {
        this._disabled = true;
      }
      async dataHandler(basis, data) {
        if (this._disabled) {
          return;
        }
        this._dataCallback(basis, data);
      }
      async statusHandler(status, err) {
        if (this._disabled) {
          return;
        }
        this._statusCallback(status, err);
      }
    };
    var DataSourceState;
    (function(DataSourceState2) {
      DataSourceState2[DataSourceState2["Valid"] = 0] = "Valid";
      DataSourceState2[DataSourceState2["Initializing"] = 1] = "Initializing";
      DataSourceState2[DataSourceState2["Interrupted"] = 2] = "Interrupted";
      DataSourceState2[DataSourceState2["Closed"] = 3] = "Closed";
    })(DataSourceState || (DataSourceState = {}));
    var DataSourceList = class {
      /**
       * @param circular whether to loop off the end of the list back to the start
       * @param initialList of content
       */
      constructor(circular, initialList) {
        this._list = initialList ? [...initialList] : [];
        this._circular = circular;
        this._pos = 0;
      }
      /**
       * Returns the current head and then iterates.
       */
      next() {
        if (this._list.length <= 0 || this._pos >= this._list.length) {
          return void 0;
        }
        const result = this._list[this._pos];
        if (this._circular) {
          this._pos = (this._pos + 1) % this._list.length;
        } else {
          this._pos += 1;
        }
        return result;
      }
      /**
       * Replaces all elements with the provided list and resets the position of head to the start.
       *
       * @param input that will replace existing list
       */
      replace(input) {
        this._list = [...input];
        this._pos = 0;
      }
      /**
       * Removes the provided element from the list. If the removed element was the head, head moves to next. Consider head may be undefined if list is empty after removal.
       *
       * @param element to remove
       * @returns true if element was removed
       */
      remove(element) {
        const index2 = this._list.indexOf(element);
        if (index2 < 0) {
          return false;
        }
        this._list.splice(index2, 1);
        if (this._list.length > 0) {
          if (index2 < this._pos) {
            this._pos -= 1;
          }
          if (this._circular && this._pos > this._list.length - 1) {
            this._pos = 0;
          }
        }
        return true;
      }
      /**
       * Reset the head position to the start of the list.
       */
      reset() {
        this._pos = 0;
      }
      /**
       * @returns the current head position in the list, 0 indexed.
       */
      pos() {
        return this._pos;
      }
      /**
       * @returns the current length of the list
       */
      length() {
        return this._list.length;
      }
      /**
       * Clears the list and resets head.
       */
      clear() {
        this._list = [];
        this._pos = 0;
      }
    };
    var LDFileDataSourceError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "LaunchDarklyFileDataSourceError";
      }
    };
    var LDPollingError = class extends Error {
      constructor(kind, message, status, recoverable = true) {
        super(message);
        this.kind = kind;
        this.status = status;
        this.name = "LaunchDarklyPollingError";
        this.recoverable = recoverable;
      }
    };
    var LDStreamingError = class extends Error {
      constructor(kind, message, code, recoverable = true) {
        super(message);
        this.kind = kind;
        this.code = code;
        this.name = "LaunchDarklyStreamingError";
        this.recoverable = recoverable;
      }
    };
    var LDFlagDeliveryFallbackError = class extends Error {
      constructor(kind, message, code) {
        super(message);
        this.kind = kind;
        this.code = code;
        this.name = "LDFlagDeliveryFallbackError";
        this.recoverable = false;
      }
    };
    var DEFAULT_FALLBACK_TIME_MS = 2 * 60 * 1e3;
    var DEFAULT_RECOVERY_TIME_MS = 5 * 60 * 1e3;
    var CompositeDataSource = class {
      /**
       * @param initializers factories to create {@link DataSystemInitializer}s, in priority order.
       * @param synchronizers factories to create  {@link DataSystemSynchronizer}s, in priority order.
       * @param fdv1Synchronizers factories to fallback to if we need to fallback to FDv1.
       * @param _logger for logging
       * @param _transitionConditions to control automated transition between datasources. Typically only used for testing.
       * @param _backoff to control delay between transitions. Typically only used for testing.
       */
      constructor(initializers, synchronizers, fdv1Synchronizers, _logger, _transitionConditions = {
        [DataSourceState.Valid]: {
          durationMS: DEFAULT_RECOVERY_TIME_MS,
          transition: "recover"
        },
        [DataSourceState.Interrupted]: {
          durationMS: DEFAULT_FALLBACK_TIME_MS,
          transition: "fallback"
        }
      }, _backoff = new DefaultBackoff(1e3, 3e4)) {
        this._logger = _logger;
        this._transitionConditions = _transitionConditions;
        this._backoff = _backoff;
        this._fdv1FallbackEngaged = false;
        this._stopped = true;
        this._cancelTokens = [];
        this._cancellableDelay = (delayMS) => {
          let timeout;
          const promise = new Promise((res, _) => {
            timeout = setTimeout(res, delayMS);
          });
          return {
            promise,
            cancel() {
              if (timeout) {
                clearTimeout(timeout);
                timeout = void 0;
              }
            }
          };
        };
        this._externalTransitionPromise = new Promise((resolveTransition) => {
          this._externalTransitionResolve = resolveTransition;
        });
        this._initPhaseActive = initializers.length > 0;
        this._initFactories = new DataSourceList(false, initializers);
        this._syncFactories = new DataSourceList(true, synchronizers);
        this._fdv1Synchronizers = new DataSourceList(true, fdv1Synchronizers);
      }
      async start(dataCallback, statusCallback, selectorGetter) {
        if (!this._stopped) {
          this._logger?.info("CompositeDataSource already running. Ignoring call to start.");
          return;
        }
        this._stopped = false;
        this._logger?.debug(`CompositeDataSource starting with (${this._initFactories.length()} initializers, ${this._syncFactories.length()} synchronizers).`);
        const sanitizedStatusCallback = this._wrapStatusCallbackWithSanitizer(statusCallback);
        sanitizedStatusCallback(DataSourceState.Initializing);
        let lastTransition;
        while (true) {
          const { dataSource: currentDS, isPrimary, cullDSFactory } = this._pickDataSource(lastTransition);
          const internalTransitionPromise = new Promise((transitionResolve) => {
            if (currentDS) {
              let lastState;
              let cancelScheduledTransition = () => {
              };
              const engageFDv1Fallback = (statusToReport, err) => {
                if (this._fdv1Synchronizers.length() > 0) {
                  this._logger?.warn(`Falling back to FDv1`);
                } else {
                  this._logger?.warn(`FDv1 fallback was requested but no FDv1 fallback synchronizer is configured; data source will terminate`);
                }
                this._fdv1FallbackEngaged = true;
                this._syncFactories = this._fdv1Synchronizers;
                sanitizedStatusCallback(statusToReport, err);
                this._consumeCancelToken(cancelScheduledTransition);
                transitionResolve({ transition: "switchToSync", err });
              };
              const callbackHandler = new CallbackHandler((basis, data) => {
                this._backoff.success();
                dataCallback(basis, data);
                if (data?.fallbackToFDv1 && !this._fdv1FallbackEngaged) {
                  callbackHandler.disable();
                  engageFDv1Fallback(DataSourceState.Interrupted, void 0);
                  return;
                }
                if (basis && this._initPhaseActive) {
                  callbackHandler.disable();
                  this._consumeCancelToken(cancelScheduledTransition);
                  sanitizedStatusCallback(DataSourceState.Interrupted);
                  transitionResolve({ transition: "switchToSync" });
                }
              }, (state, err) => {
                this._logger?.debug(`CompositeDataSource received state ${state} from underlying data source.  Err is ${err}`);
                if (err || state === DataSourceState.Closed) {
                  callbackHandler.disable();
                  if (err?.recoverable === false) {
                    this._logger?.debug(`Culling data source due to err ${err}`);
                    cullDSFactory?.();
                  }
                  if (err instanceof LDFlagDeliveryFallbackError && !this._fdv1FallbackEngaged) {
                    engageFDv1Fallback(state, err);
                    return;
                  }
                  sanitizedStatusCallback(state, err);
                  this._consumeCancelToken(cancelScheduledTransition);
                  transitionResolve({ transition: "fallback", err });
                } else {
                  sanitizedStatusCallback(state);
                  if (state !== lastState) {
                    lastState = state;
                    this._consumeCancelToken(cancelScheduledTransition);
                    const condition = this._lookupTransitionCondition(state, isPrimary);
                    if (condition) {
                      const { promise, cancel } = this._cancellableDelay(condition.durationMS);
                      cancelScheduledTransition = cancel;
                      this._cancelTokens.push(cancelScheduledTransition);
                      promise.then(() => {
                        this._consumeCancelToken(cancel);
                        callbackHandler.disable();
                        sanitizedStatusCallback(DataSourceState.Interrupted);
                        transitionResolve({ transition: condition.transition });
                      });
                    }
                  }
                }
              });
              currentDS.start((basis, data) => callbackHandler.dataHandler(basis, data), (status, err) => callbackHandler.statusHandler(status, err), selectorGetter);
            } else {
              transitionResolve({
                transition: "stop",
                err: {
                  name: "ExhaustedDataSources",
                  message: `CompositeDataSource has exhausted all configured initializers and synchronizers.`
                }
              });
            }
          });
          let transitionRequest = await Promise.race([
            internalTransitionPromise,
            this._externalTransitionPromise
          ]);
          currentDS?.stop();
          const isInitialFDv1Engagement = transitionRequest.transition === "switchToSync" && transitionRequest.err instanceof LDFlagDeliveryFallbackError;
          if (transitionRequest.err && transitionRequest.transition !== "stop" && !isInitialFDv1Engagement) {
            const delay = this._initPhaseActive ? 0 : this._backoff.fail();
            const { promise, cancel: cancelDelay } = this._cancellableDelay(delay);
            this._cancelTokens.push(cancelDelay);
            const delayedTransition = promise.then(() => {
              this._consumeCancelToken(cancelDelay);
              return transitionRequest;
            });
            transitionRequest = await Promise.race([
              delayedTransition,
              this._externalTransitionPromise
            ]);
            this._consumeCancelToken(cancelDelay);
          }
          lastTransition = transitionRequest.transition;
          if (transitionRequest.transition === "stop") {
            statusCallback(DataSourceState.Closed, transitionRequest.err);
            break;
          }
        }
        this._reset();
      }
      async stop() {
        this._cancelTokens.forEach((cancel) => cancel());
        this._cancelTokens = [];
        this._externalTransitionResolve?.({ transition: "stop" });
      }
      _reset() {
        this._stopped = true;
        this._initPhaseActive = this._initFactories.length() > 0;
        this._initFactories.reset();
        this._syncFactories.reset();
        this._fdv1Synchronizers.reset();
        this._fdv1FallbackEngaged = false;
        this._externalTransitionPromise = new Promise((tr) => {
          this._externalTransitionResolve = tr;
        });
      }
      /**
       * Determines the next datasource and returns that datasource as well as a closure to cull the
       * datasource from the datasource lists. One example where the cull closure is invoked is if the
       * datasource has an unrecoverable error.
       */
      _pickDataSource(transition) {
        let factory;
        let isPrimary;
        switch (transition) {
          case "switchToSync":
            this._initPhaseActive = false;
            this._syncFactories.reset();
            isPrimary = this._syncFactories.pos() === 0;
            factory = this._syncFactories.next();
            break;
          case "recover":
            if (this._initPhaseActive) {
              this._initFactories.reset();
              isPrimary = this._initFactories.pos() === 0;
              factory = this._initFactories.next();
            } else {
              this._syncFactories.reset();
              isPrimary = this._syncFactories.pos() === 0;
              factory = this._syncFactories.next();
            }
            break;
          case "fallback":
          default:
            if (this._initPhaseActive && this._initFactories.pos() >= this._initFactories.length()) {
              this._initPhaseActive = false;
              this._syncFactories.reset();
            }
            if (this._initPhaseActive) {
              isPrimary = this._initFactories.pos() === 0;
              factory = this._initFactories.next();
            } else {
              isPrimary = this._syncFactories.pos() === 0;
              factory = this._syncFactories.next();
            }
            break;
        }
        if (!factory) {
          return { dataSource: void 0, isPrimary, cullDSFactory: void 0 };
        }
        return {
          dataSource: factory(),
          isPrimary,
          cullDSFactory: () => {
            if (factory) {
              this._syncFactories.remove(factory);
            }
          }
        };
      }
      /**
       * @returns the transition condition for the provided data source state or undefined
       * if there is no transition condition
       */
      _lookupTransitionCondition(state, excludeRecover) {
        const condition = this._transitionConditions[state];
        if (excludeRecover && condition?.transition === "recover") {
          return void 0;
        }
        return condition;
      }
      _consumeCancelToken(cancel) {
        cancel();
        const index2 = this._cancelTokens.indexOf(cancel, 0);
        if (index2 > -1) {
          this._cancelTokens.splice(index2, 1);
        }
      }
      /**
       * This wrapper will ensure the following:
       *
       * Don't report DataSourceState.Initializing except as first status callback.
       * Map underlying DataSourceState.Closed to interrupted.
       * Don't report the same status and error twice in a row.
       */
      _wrapStatusCallbackWithSanitizer(statusCallback) {
        let alreadyReportedInitializing = false;
        let lastStatus;
        let lastErr;
        return (status, err) => {
          let sanitized = status;
          if (status === DataSourceState.Closed) {
            sanitized = DataSourceState.Interrupted;
          }
          if (sanitized === lastStatus && err === lastErr) {
            return;
          }
          if (sanitized === DataSourceState.Initializing) {
            if (alreadyReportedInitializing) {
              return;
            }
            alreadyReportedInitializing = true;
          }
          lastStatus = sanitized;
          lastErr = err;
          statusCallback(sanitized, err);
        };
      }
    };
    exports2.DataSourceErrorKind = void 0;
    (function(DataSourceErrorKind) {
      DataSourceErrorKind["Unknown"] = "UNKNOWN";
      DataSourceErrorKind["NetworkError"] = "NETWORK_ERROR";
      DataSourceErrorKind["ErrorResponse"] = "ERROR_RESPONSE";
      DataSourceErrorKind["InvalidData"] = "INVALID_DATA";
    })(exports2.DataSourceErrorKind || (exports2.DataSourceErrorKind = {}));
    exports2.AutoEnvAttributes = void 0;
    (function(AutoEnvAttributes) {
      AutoEnvAttributes[AutoEnvAttributes["Disabled"] = 0] = "Disabled";
      AutoEnvAttributes[AutoEnvAttributes["Enabled"] = 1] = "Enabled";
    })(exports2.AutoEnvAttributes || (exports2.AutoEnvAttributes = {}));
    var LDEventType;
    (function(LDEventType2) {
      LDEventType2[LDEventType2["AnalyticsEvents"] = 0] = "AnalyticsEvents";
      LDEventType2[LDEventType2["DiagnosticEvent"] = 1] = "DiagnosticEvent";
    })(LDEventType || (LDEventType = {}));
    var LDDeliveryStatus;
    (function(LDDeliveryStatus2) {
      LDDeliveryStatus2[LDDeliveryStatus2["Succeeded"] = 0] = "Succeeded";
      LDDeliveryStatus2[LDDeliveryStatus2["Failed"] = 1] = "Failed";
      LDDeliveryStatus2[LDDeliveryStatus2["FailedAndMustShutDown"] = 2] = "FailedAndMustShutDown";
    })(LDDeliveryStatus || (LDDeliveryStatus = {}));
    var index$1 = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      get DataSourceState() {
        return DataSourceState;
      },
      get LDDeliveryStatus() {
        return LDDeliveryStatus;
      },
      get LDEventType() {
        return LDEventType;
      }
    });
    function tryStringify(val) {
      if (typeof val === "string") {
        return val;
      }
      if (val === void 0) {
        return "undefined";
      }
      if (val === null) {
        return "null";
      }
      if (Object.prototype.hasOwnProperty.call(val, "toString")) {
        try {
          return val.toString();
        } catch {
        }
      }
      if (typeof val === "bigint") {
        return `${val}n`;
      }
      try {
        return JSON.stringify(val);
      } catch (error) {
        if (error instanceof TypeError && error.message.indexOf("circular") >= 0) {
          return "[Circular]";
        }
        return "[Not Stringifiable]";
      }
    }
    function toNumber(val) {
      if (typeof val === "symbol") {
        return "NaN";
      }
      if (typeof val === "bigint") {
        return `${val}n`;
      }
      return String(Number(val));
    }
    function toInt(val) {
      if (typeof val === "symbol") {
        return "NaN";
      }
      if (typeof val === "bigint") {
        return `${val}n`;
      }
      return String(parseInt(val, 10));
    }
    function toFloat(val) {
      if (typeof val === "symbol") {
        return "NaN";
      }
      return String(parseFloat(val));
    }
    var escapes = {
      s: (val) => tryStringify(val),
      d: (val) => toNumber(val),
      i: (val) => toInt(val),
      f: (val) => toFloat(val),
      j: (val) => tryStringify(val),
      o: (val) => tryStringify(val),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      O: (val) => tryStringify(val),
      c: () => ""
    };
    function format(...args) {
      const formatString = args.shift();
      if (TypeValidators.String.is(formatString)) {
        let out = "";
        let i = 0;
        while (i < formatString.length) {
          const char = formatString.charAt(i);
          if (char === "%") {
            const nextIndex = i + 1;
            if (nextIndex < formatString.length) {
              const nextChar = formatString.charAt(i + 1);
              if (nextChar in escapes && args.length) {
                const value = args.shift();
                out += escapes[nextChar]?.(value);
              } else if (nextChar === "%") {
                out += "%";
              } else {
                out += `%${nextChar}`;
              }
              i += 2;
            }
          } else {
            out += char;
            i += 1;
          }
        }
        if (args.length) {
          if (out.length) {
            out += " ";
          }
          out += args.map(tryStringify).join(" ");
        }
        return out;
      }
      return args.map(tryStringify).join(" ");
    }
    var LogPriority;
    (function(LogPriority2) {
      LogPriority2[LogPriority2["debug"] = 0] = "debug";
      LogPriority2[LogPriority2["info"] = 1] = "info";
      LogPriority2[LogPriority2["warn"] = 2] = "warn";
      LogPriority2[LogPriority2["error"] = 3] = "error";
      LogPriority2[LogPriority2["none"] = 4] = "none";
    })(LogPriority || (LogPriority = {}));
    var LEVEL_NAMES = ["debug", "info", "warn", "error", "none"];
    var BasicLogger = class _BasicLogger {
      /**
       * This should only be used as a default fallback and not as a convenient
       * solution. In most cases you should construct a new instance with the
       * appropriate options for your specific needs.
       */
      static get() {
        return new _BasicLogger({});
      }
      constructor(options) {
        this._logLevel = LogPriority[options.level ?? "info"] ?? LogPriority.info;
        this._name = options.name ?? "LaunchDarkly";
        this._formatter = options.formatter;
        if (typeof options.destination === "object") {
          this._destinations = {
            [LogPriority.debug]: options.destination.debug,
            [LogPriority.info]: options.destination.info,
            [LogPriority.warn]: options.destination.warn,
            [LogPriority.error]: options.destination.error
          };
        } else if (typeof options.destination === "function") {
          const { destination } = options;
          this._destinations = {
            [LogPriority.debug]: destination,
            [LogPriority.info]: destination,
            [LogPriority.warn]: destination,
            [LogPriority.error]: destination
          };
        }
      }
      _tryFormat(...args) {
        try {
          if (this._formatter) {
            return this._formatter?.(...args);
          }
          return format(...args);
        } catch {
          return format(...args);
        }
      }
      _tryWrite(destination, msg) {
        try {
          destination(msg);
        } catch {
          console.error(msg);
        }
      }
      _log(level, args) {
        if (level >= this._logLevel) {
          const prefix = `${LEVEL_NAMES[level]}: [${this._name}]`;
          try {
            const destination = this._destinations?.[level];
            if (destination) {
              this._tryWrite(destination, `${prefix} ${this._tryFormat(...args)}`);
            } else {
              console.error(...args);
            }
          } catch {
            console.error(...args);
          }
        }
      }
      error(...args) {
        this._log(LogPriority.error, args);
      }
      warn(...args) {
        this._log(LogPriority.warn, args);
      }
      info(...args) {
        this._log(LogPriority.info, args);
      }
      debug(...args) {
        this._log(LogPriority.debug, args);
      }
    };
    var loggerRequirements = {
      error: TypeValidators.Function,
      warn: TypeValidators.Function,
      info: TypeValidators.Function,
      debug: TypeValidators.Function
    };
    var SafeLogger = class {
      /**
       * Construct a safe logger with the specified logger.
       * @param logger The logger to use.
       * @param fallback A fallback logger to use in case an issue is  encountered using
       * the provided logger.
       */
      constructor(logger, fallback) {
        Object.entries(loggerRequirements).forEach(([level, validator]) => {
          if (!validator.is(logger[level])) {
            throw new Error(`Provided logger instance must support logger.${level}(...) method`);
          }
        });
        this._logger = logger;
        this._fallback = fallback;
      }
      _log(level, args) {
        try {
          this._logger[level](...args);
        } catch {
          this._fallback[level](...args);
        }
      }
      error(...args) {
        this._log("error", args);
      }
      warn(...args) {
        this._log("warn", args);
      }
      info(...args) {
        this._log("info", args);
      }
      debug(...args) {
        this._log("debug", args);
      }
    };
    var createSafeLogger = (logger) => {
      const basicLogger = new BasicLogger({
        level: "info",
        // eslint-disable-next-line no-console
        destination: console.error,
        formatter: format
      });
      return logger ? new SafeLogger(logger, basicLogger) : basicLogger;
    };
    var OptionMessages = class {
      static deprecated(oldName, newName) {
        return `"${oldName}" is deprecated, please use "${newName}"`;
      }
      static optionBelowMinimum(name, value, min) {
        return `Config option "${name}" had invalid value of ${value}, using minimum of ${min} instead`;
      }
      static unknownOption(name) {
        return `Ignoring unknown config option "${name}"`;
      }
      static wrongOptionType(name, expectedType, actualType) {
        return `Config option "${name}" should be of type ${expectedType}, got ${actualType}, using default value`;
      }
      static wrongOptionTypeBoolean(name, actualType) {
        return `Config option "${name}" should be a boolean, got ${actualType}, converting to boolean`;
      }
      static invalidTagValue(name) {
        return `Config option "${name}" must only contain letters, numbers, ., _ or -.`;
      }
      static tagValueTooLong(name) {
        return `Value of "${name}" was longer than 64 characters and was discarded.`;
      }
      static partialEndpoint(name) {
        return `You have set custom uris without specifying the ${name} URI; connections may not work properly`;
      }
    };
    var allowedTagCharacters = /^(\w|\.|-)+$/;
    var regexValidator = TypeValidators.stringMatchingRegex(allowedTagCharacters);
    var tagValidator = {
      is: (u, name) => {
        if (regexValidator.is(u)) {
          if (u.length > 64) {
            return { valid: false, message: OptionMessages.tagValueTooLong(name) };
          }
          return { valid: true };
        }
        return { valid: false, message: OptionMessages.invalidTagValue(name) };
      }
    };
    var ApplicationTags = class {
      constructor(options) {
        const tags = {};
        const application = options?.application;
        const logger = options?.logger;
        if (application) {
          Object.entries(application).forEach(([key, value]) => {
            if (value !== null && value !== void 0) {
              const { valid, message } = tagValidator.is(value, `application.${key}`);
              if (!valid) {
                logger?.warn(message);
              } else if (key === "versionName") {
                tags[`application-version-name`] = [value];
              } else {
                tags[`application-${key}`] = [value];
              }
            }
          });
        }
        const tagKeys = Object.keys(tags);
        if (tagKeys.length) {
          this.value = tagKeys.sort().flatMap((key) => tags[key].sort().map((value) => `${key}/${value}`)).join(" ");
        }
      }
    };
    var ClientContext = class {
      constructor(sdkKey, configuration, platform) {
        this.platform = platform;
        this.basicConfiguration = {
          tags: configuration.tags,
          logger: configuration.logger,
          offline: configuration.offline,
          serviceEndpoints: configuration.serviceEndpoints,
          sdkKey
        };
      }
    };
    function canonicalizeUri(uri) {
      return uri.replace(/\/+$/, "");
    }
    function canonicalizePath(path3) {
      return path3.replace(/^\/+/, "").replace(/\?$/, "");
    }
    var ServiceEndpoints = class _ServiceEndpoints {
      constructor(streaming, polling, events = _ServiceEndpoints.DEFAULT_EVENTS, analyticsEventPath = "/bulk", diagnosticEventPath = "/diagnostic", includeAuthorizationHeader = true, payloadFilterKey) {
        this.streaming = canonicalizeUri(streaming);
        this.polling = canonicalizeUri(polling);
        this.events = canonicalizeUri(events);
        this.analyticsEventPath = analyticsEventPath;
        this.diagnosticEventPath = diagnosticEventPath;
        this.includeAuthorizationHeader = includeAuthorizationHeader;
        this.payloadFilterKey = payloadFilterKey;
      }
    };
    ServiceEndpoints.DEFAULT_EVENTS = "https://events.launchdarkly.com";
    function getWithParams(uri, parameters = []) {
      if (parameters.length === 0) {
        return uri;
      }
      const parts = parameters.map(({ key, value }) => `${key}=${value}`);
      return `${uri}?${parts.join("&")}`;
    }
    function getStreamingUri(endpoints, path3, parameters) {
      const canonicalizedPath = canonicalizePath(path3);
      const combinedParameters = [...parameters];
      if (endpoints.payloadFilterKey) {
        combinedParameters.push({ key: "filter", value: endpoints.payloadFilterKey });
      }
      return getWithParams(`${endpoints.streaming}/${canonicalizedPath}`, combinedParameters);
    }
    function getPollingUri(endpoints, path3, parameters = []) {
      const canonicalizedPath = canonicalizePath(path3);
      const combinedParameters = [...parameters];
      if (endpoints.payloadFilterKey) {
        combinedParameters.push({ key: "filter", value: endpoints.payloadFilterKey });
      }
      return getWithParams(`${endpoints.polling}/${canonicalizedPath}`, combinedParameters);
    }
    function getEventsUri(endpoints, path3, parameters = []) {
      const canonicalizedPath = canonicalizePath(path3);
      return getWithParams(`${endpoints.events}/${canonicalizedPath}`, parameters);
    }
    var LDUnexpectedResponseError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "LaunchDarklyUnexpectedResponseError";
      }
    };
    var LDClientError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "LaunchDarklyClientError";
      }
    };
    var LDTimeoutError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "LaunchDarklyTimeoutError";
      }
    };
    function isHttpRecoverable(status) {
      if (status >= 400 && status < 500) {
        return status === 400 || status === 408 || status === 429;
      }
      return true;
    }
    function isHttpLocallyRecoverable(status) {
      if (status === 413) {
        return true;
      }
      return isHttpRecoverable(status);
    }
    function cancelableTimedPromise(t, taskName) {
      let timeout;
      let resolve;
      const promise = new Promise((_res, reject) => {
        resolve = _res;
        timeout = setTimeout(() => {
          const e = `${taskName} timed out after ${t} seconds.`;
          reject(new LDTimeoutError(e));
        }, t * 1e3);
      });
      return {
        promise,
        cancel: () => {
          resolve();
          clearTimeout(timeout);
        }
      };
    }
    function clone(obj) {
      if (obj === void 0 || obj === null) {
        return obj;
      }
      return JSON.parse(JSON.stringify(obj));
    }
    function secondsToMillis(sec) {
      return Math.trunc(sec * 1e3);
    }
    var debounce = (fn, delayMs = 5e3) => {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          fn(...args);
        }, delayMs);
      };
    };
    var isEmptyObject = (obj) => JSON.stringify(obj) === "{}";
    var deepCompact = (obj, ignoreKeys) => {
      if (!obj) {
        return obj;
      }
      return Object.entries(obj).reduce((acc, [key, value]) => {
        if (Boolean(value) && !isEmptyObject(value) && !ignoreKeys?.includes(key)) {
          acc[key] = typeof value === "object" ? deepCompact(value, ignoreKeys) : value;
        }
        return acc;
      }, {});
    };
    function fastDeepEqual(a, b) {
      if (a === b)
        return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor)
          return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length)
            return false;
          for (i = length; i-- !== 0; )
            if (!fastDeepEqual(a[i], b[i]))
              return false;
          return true;
        }
        if (a instanceof Map && b instanceof Map) {
          if (a.size !== b.size)
            return false;
          for (i of a.entries())
            if (!b.has(i[0]))
              return false;
          for (i of a.entries())
            if (!fastDeepEqual(i[1], b.get(i[0])))
              return false;
          return true;
        }
        if (a instanceof Set && b instanceof Set) {
          if (a.size !== b.size)
            return false;
          for (i of a.entries())
            if (!b.has(i[0]))
              return false;
          return true;
        }
        if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
          length = a.length;
          if (length != b.length)
            return false;
          for (i = length; i-- !== 0; ) {
            if (a[i] !== b[i])
              return false;
          }
          return true;
        }
        if (a.constructor === RegExp)
          return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf)
          return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString)
          return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length)
          return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
            return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!fastDeepEqual(a[key], b[key]))
            return false;
        }
        return true;
      }
      return a !== a && b !== b;
    }
    function defaultHeaders(sdkKey, info, tags, includeAuthorizationHeader = true, userAgentHeaderName = "user-agent", instanceId) {
      const { userAgentBase, version, wrapperName, wrapperVersion } = info.sdkData();
      const headers = {
        [userAgentHeaderName]: `${userAgentBase ?? "NodeJSClient"}/${version}`
      };
      if (includeAuthorizationHeader) {
        headers.authorization = sdkKey;
      }
      if (wrapperName) {
        headers["x-launchdarkly-wrapper"] = wrapperVersion ? `${wrapperName}/${wrapperVersion}` : wrapperName;
      }
      if (tags?.value) {
        headers["x-launchdarkly-tags"] = tags.value;
      }
      if (instanceId) {
        headers["x-launchdarkly-instance-id"] = instanceId;
      }
      return headers;
    }
    function httpErrorMessage(err, context, retryMessage) {
      let desc;
      if (err.status) {
        desc = `error ${err.status}${err.status === 401 ? " (invalid SDK key)" : ""}`;
      } else {
        desc = `I/O error (${err.message || "unknown error"})`;
      }
      const action = retryMessage ?? "giving up permanently";
      return `Received ${desc} for ${context} - ${action}`;
    }
    function shouldRetry({ status }) {
      return status ? isHttpRecoverable(status) : true;
    }
    var base64UrlEncode = (s, encoding) => encoding.btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    var noop = () => {
    };
    var sleep = async (delayMillis = 1e3) => new Promise((resolve) => {
      setTimeout(resolve, delayMillis);
    });
    var timedPromise = (t, taskName) => new Promise((_res, reject) => {
      setTimeout(() => {
        const e = `${taskName} timed out after ${t} seconds.`;
        reject(new LDTimeoutError(e));
      }, t * 1e3);
    });
    var DiagnosticsManager = class {
      constructor(sdkKey, _platform, _diagnosticInitConfig) {
        this._platform = _platform;
        this._diagnosticInitConfig = _diagnosticInitConfig;
        this._streamInits = [];
        this._startTime = Date.now();
        this._dataSinceDate = this._startTime;
        this._id = {
          diagnosticId: _platform.crypto.randomUUID(),
          sdkKeySuffix: sdkKey.length > 6 ? sdkKey.substring(sdkKey.length - 6) : sdkKey
        };
      }
      /**
       * Creates the initial event that is sent by the event processor when the SDK starts up. This will
       * not be repeated during the lifetime of the SDK client.
       */
      createInitEvent() {
        const sdkData = this._platform.info.sdkData();
        const platformData = this._platform.info.platformData();
        return {
          kind: "diagnostic-init",
          id: this._id,
          creationDate: this._startTime,
          sdk: sdkData,
          configuration: this._diagnosticInitConfig,
          platform: {
            name: platformData.name,
            osArch: platformData.os?.arch,
            osName: platformData.os?.name,
            osVersion: platformData.os?.version,
            ...platformData.additional || {}
          }
        };
      }
      /**
       * Records a stream connection attempt (called by the stream processor).
       *
       * @param timestamp Time of the *beginning* of the connection attempt.
       * @param failed True if the connection failed, or we got a read timeout before receiving a "put".
       * @param durationMillis Elapsed time between starting timestamp and when we either gave up/lost
       * the connection or received a successful "put".
       */
      recordStreamInit(timestamp, failed, durationMillis) {
        const item = { timestamp, failed, durationMillis };
        this._streamInits.push(item);
      }
      /**
       * Creates a periodic event containing time-dependent stats, and resets the state of the manager
       * with regard to those stats.
       *
       * Note: the reason droppedEvents, deduplicatedUsers, and eventsInLastBatch are passed into this
       * function, instead of being properties of the DiagnosticsManager, is that the event processor is
       * the one who's calling this function and is also the one who's tracking those stats.
       */
      createStatsEventAndReset(droppedEvents, deduplicatedUsers, eventsInLastBatch) {
        const currentTime = Date.now();
        const evt = {
          kind: "diagnostic",
          id: this._id,
          creationDate: currentTime,
          dataSinceDate: this._dataSinceDate,
          droppedEvents,
          deduplicatedUsers,
          eventsInLastBatch,
          streamInits: this._streamInits
        };
        this._streamInits = [];
        this._dataSinceDate = currentTime;
        return evt;
      }
    };
    var ErrorKinds;
    (function(ErrorKinds2) {
      ErrorKinds2["MalformedFlag"] = "MALFORMED_FLAG";
      ErrorKinds2["UserNotSpecified"] = "USER_NOT_SPECIFIED";
      ErrorKinds2["FlagNotFound"] = "FLAG_NOT_FOUND";
      ErrorKinds2["ClientNotReady"] = "CLIENT_NOT_READY";
      ErrorKinds2["WrongType"] = "WRONG_TYPE";
    })(ErrorKinds || (ErrorKinds = {}));
    var ErrorKinds$1 = ErrorKinds;
    var ClientMessages = class {
      static invalidMetricValue(badType) {
        return `The track function was called with a non-numeric "metricValue" (${badType}), only numeric metric values are supported.`;
      }
    };
    ClientMessages.MissingContextKeyNoEvent = "Context was unspecified or had no key; event will not be sent";
    var EventSender = class {
      constructor(clientContext, baseHeaders) {
        const { basicConfiguration, platform } = clientContext;
        const { serviceEndpoints: { analyticsEventPath, diagnosticEventPath } } = basicConfiguration;
        const { crypto, requests } = platform;
        this._defaultHeaders = { ...baseHeaders };
        this._eventsUri = getEventsUri(basicConfiguration.serviceEndpoints, analyticsEventPath, []);
        this._diagnosticEventsUri = getEventsUri(basicConfiguration.serviceEndpoints, diagnosticEventPath, []);
        this._requests = requests;
        this._crypto = crypto;
      }
      async _tryPostingEvents(events, uri, payloadId, canRetry) {
        const tryRes = {
          status: LDDeliveryStatus.Succeeded
        };
        const headers = {
          ...this._defaultHeaders,
          "content-type": "application/json"
        };
        if (payloadId) {
          headers["x-launchdarkly-payload-id"] = payloadId;
          headers["x-launchDarkly-event-schema"] = "4";
        }
        let error;
        try {
          const { status, headers: resHeaders } = await this._requests.fetch(uri, {
            headers,
            body: JSON.stringify(events),
            compressBodyIfPossible: true,
            method: "POST",
            // When sending events from browser environments the request should be completed even
            // if the user is navigating away from the page.
            keepalive: true
          });
          const serverDate = Date.parse(resHeaders.get("date") || "");
          if (serverDate) {
            tryRes.serverTime = serverDate;
          }
          if (status <= 204) {
            return tryRes;
          }
          error = new LDUnexpectedResponseError(httpErrorMessage({ status, message: "some events were dropped" }, "event posting"));
          if (!isHttpRecoverable(status)) {
            if (!isHttpLocallyRecoverable(status)) {
              tryRes.status = LDDeliveryStatus.FailedAndMustShutDown;
            } else {
              tryRes.status = LDDeliveryStatus.Failed;
            }
            tryRes.error = error;
            return tryRes;
          }
        } catch (err) {
          error = err;
        }
        if (error && !canRetry) {
          tryRes.status = LDDeliveryStatus.Failed;
          tryRes.error = error;
          return tryRes;
        }
        await sleep();
        return this._tryPostingEvents(events, this._eventsUri, payloadId, false);
      }
      async sendEventData(type, data) {
        const payloadId = type === LDEventType.AnalyticsEvents ? this._crypto.randomUUID() : void 0;
        const uri = type === LDEventType.AnalyticsEvents ? this._eventsUri : this._diagnosticEventsUri;
        return this._tryPostingEvents(data, uri, payloadId, true);
      }
    };
    function isFeature(u) {
      return u.kind === "feature";
    }
    function isIdentify(u) {
      return u.kind === "identify";
    }
    function isMigration(u) {
      return u.kind === "migration_op";
    }
    var SummaryCounter = class {
      constructor(count, key, value, defValue, version, variation) {
        this.count = count;
        this.key = key;
        this.value = value;
        this.version = version;
        this.variation = variation;
        this.default = defValue;
      }
      increment() {
        this.count += 1;
      }
    };
    function counterKey(event) {
      return `${event.key}:${event.variation !== null && event.variation !== void 0 ? event.variation : ""}:${event.version !== null && event.version !== void 0 ? event.version : ""}`;
    }
    var EventSummarizer = class {
      constructor(_singleContext = false, _contextFilter) {
        this._singleContext = _singleContext;
        this._contextFilter = _contextFilter;
        this._startDate = 0;
        this._endDate = 0;
        this._counters = {};
        this._contextKinds = {};
      }
      summarizeEvent(event) {
        if (isFeature(event) && !event.excludeFromSummaries) {
          if (!this._context) {
            this._context = event.context;
          }
          const countKey = counterKey(event);
          const counter = this._counters[countKey];
          let kinds = this._contextKinds[event.key];
          if (!kinds) {
            kinds = /* @__PURE__ */ new Set();
            this._contextKinds[event.key] = kinds;
          }
          event.context.kinds.forEach((kind) => kinds.add(kind));
          if (counter) {
            counter.increment();
          } else {
            this._counters[countKey] = new SummaryCounter(1, event.key, event.value, event.default, event.version, event.variation);
          }
          if (this._startDate === 0 || event.creationDate < this._startDate) {
            this._startDate = event.creationDate;
          }
          if (event.creationDate > this._endDate) {
            this._endDate = event.creationDate;
          }
        }
      }
      getSummary() {
        const features = Object.values(this._counters).reduce((acc, counter) => {
          let flagSummary = acc[counter.key];
          if (!flagSummary) {
            flagSummary = {
              default: counter.default,
              counters: [],
              contextKinds: [...this._contextKinds[counter.key]]
            };
            acc[counter.key] = flagSummary;
          }
          const counterOut = {
            value: counter.value,
            count: counter.count
          };
          if (counter.variation !== void 0 && counter.variation !== null) {
            counterOut.variation = counter.variation;
          }
          if (counter.version !== void 0 && counter.version !== null) {
            counterOut.version = counter.version;
          } else {
            counterOut.unknown = true;
          }
          flagSummary.counters.push(counterOut);
          return acc;
        }, {});
        const event = {
          startDate: this._startDate,
          endDate: this._endDate,
          features,
          kind: "summary",
          context: this._context !== void 0 && this._singleContext ? this._contextFilter?.filter(this._context) : void 0
        };
        this._clearSummary();
        return event;
      }
      _clearSummary() {
        this._startDate = 0;
        this._endDate = 0;
        this._counters = {};
        this._contextKinds = {};
      }
    };
    var LDInvalidSDKKeyError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "LaunchDarklyInvalidSDKKeyError";
      }
    };
    var MultiEventSummarizer = class {
      constructor(_contextFilter, _logger) {
        this._contextFilter = _contextFilter;
        this._logger = _logger;
        this._summarizers = {};
      }
      summarizeEvent(event) {
        if (isFeature(event)) {
          const key = event.context.canonicalUnfilteredJson();
          if (!key) {
            if (event.context.valid) {
              this._logger?.error("Unable to serialize context, likely the context contains a cycle.");
            }
            return;
          }
          let summarizer = this._summarizers[key];
          if (!summarizer) {
            this._summarizers[key] = new EventSummarizer(true, this._contextFilter);
            summarizer = this._summarizers[key];
          }
          summarizer.summarizeEvent(event);
        }
      }
      getSummaries() {
        const summarizersToFlush = this._summarizers;
        this._summarizers = {};
        return Object.values(summarizersToFlush).map((summarizer) => summarizer.getSummary());
      }
    };
    function shouldSample(ratio) {
      const truncated = Math.trunc(ratio);
      if (truncated === 1) {
        return true;
      }
      if (truncated === 0) {
        return false;
      }
      return Math.floor(Math.random() * truncated) === 0;
    }
    function isMultiEventSummarizer(summarizer) {
      return summarizer.getSummaries !== void 0;
    }
    var EventProcessor = class {
      constructor(_config, clientContext, baseHeaders, _contextDeduplicator, _diagnosticsManager, start = true, summariesPerContext = false) {
        this._config = _config;
        this._contextDeduplicator = _contextDeduplicator;
        this._diagnosticsManager = _diagnosticsManager;
        this._queue = [];
        this._lastKnownPastTime = 0;
        this._droppedEvents = 0;
        this._deduplicatedUsers = 0;
        this._exceededCapacity = false;
        this._eventsInLastBatch = 0;
        this._shutdown = false;
        this._flushUsersTimer = null;
        this._capacity = _config.eventsCapacity;
        this._logger = clientContext.basicConfiguration.logger;
        this._eventSender = new EventSender(clientContext, baseHeaders);
        this._contextFilter = new ContextFilter(_config.allAttributesPrivate, _config.privateAttributes.map((ref) => new AttributeReference(ref)));
        if (summariesPerContext) {
          this._summarizer = new MultiEventSummarizer(this._contextFilter, this._logger);
        } else {
          this._summarizer = new EventSummarizer();
        }
        if (start) {
          this.start();
        }
      }
      start() {
        if (this._contextDeduplicator?.flushInterval !== void 0) {
          this._flushUsersTimer = setInterval(() => {
            this._contextDeduplicator?.flush();
          }, this._contextDeduplicator.flushInterval * 1e3);
        }
        this._flushTimer = setInterval(async () => {
          try {
            await this.flush();
          } catch (e) {
            this._logger?.debug(`Flush failed: ${e}`);
          }
        }, this._config.flushInterval * 1e3);
        if (this._diagnosticsManager) {
          const initEvent = this._diagnosticsManager.createInitEvent();
          this._postDiagnosticEvent(initEvent);
          this._diagnosticsTimer = setInterval(() => {
            const statsEvent = this._diagnosticsManager.createStatsEventAndReset(this._droppedEvents, this._deduplicatedUsers, this._eventsInLastBatch);
            this._droppedEvents = 0;
            this._deduplicatedUsers = 0;
            this._postDiagnosticEvent(statsEvent);
          }, this._config.diagnosticRecordingInterval * 1e3);
        }
        this._logger?.debug("Started EventProcessor.");
      }
      _postDiagnosticEvent(event) {
        this._eventSender.sendEventData(LDEventType.DiagnosticEvent, event);
      }
      close() {
        clearInterval(this._flushTimer);
        if (this._flushUsersTimer) {
          clearInterval(this._flushUsersTimer);
        }
        if (this._diagnosticsTimer) {
          clearInterval(this._diagnosticsTimer);
        }
      }
      async flush() {
        if (this._shutdown) {
          throw new LDInvalidSDKKeyError("Events cannot be posted because a permanent error has been encountered. This is most likely an invalid SDK key. The specific error information is logged independently.");
        }
        const eventsToFlush = this._queue;
        this._queue = [];
        if (isMultiEventSummarizer(this._summarizer)) {
          const summaries = this._summarizer.getSummaries();
          summaries.forEach((summary) => {
            if (Object.keys(summary.features).length) {
              eventsToFlush.push(summary);
            }
          });
        } else {
          const summary = this._summarizer.getSummary();
          if (Object.keys(summary.features).length) {
            eventsToFlush.push(summary);
          }
        }
        if (!eventsToFlush.length) {
          return;
        }
        this._eventsInLastBatch = eventsToFlush.length;
        this._logger?.debug("Flushing %d events", eventsToFlush.length);
        await this._tryPostingEvents(eventsToFlush);
      }
      sendEvent(inputEvent) {
        if (this._shutdown) {
          return;
        }
        if (isMigration(inputEvent)) {
          if (shouldSample(inputEvent.samplingRatio)) {
            const migrationEvent = {
              ...inputEvent,
              context: inputEvent.context ? this._contextFilter.filter(inputEvent.context) : void 0
            };
            if (migrationEvent.samplingRatio === 1) {
              delete migrationEvent.samplingRatio;
            }
            this._enqueue(migrationEvent);
          }
          return;
        }
        this._summarizer.summarizeEvent(inputEvent);
        const isFeatureEvent = isFeature(inputEvent);
        const addFullEvent = isFeatureEvent && inputEvent.trackEvents || !isFeatureEvent;
        const addDebugEvent = this._shouldDebugEvent(inputEvent);
        const isIdentifyEvent = isIdentify(inputEvent);
        const shouldNotDeduplicate = this._contextDeduplicator?.processContext(inputEvent.context);
        if (!shouldNotDeduplicate) {
          if (!isIdentifyEvent) {
            this._deduplicatedUsers += 1;
          }
        }
        const addIndexEvent = shouldNotDeduplicate && !isIdentifyEvent;
        if (addIndexEvent) {
          this._enqueue(this._makeOutputEvent({
            kind: "index",
            creationDate: inputEvent.creationDate,
            context: inputEvent.context,
            samplingRatio: 1
          }, false));
        }
        if (addFullEvent && shouldSample(inputEvent.samplingRatio)) {
          this._enqueue(this._makeOutputEvent(inputEvent, false));
        }
        if (addDebugEvent && shouldSample(inputEvent.samplingRatio)) {
          this._enqueue(this._makeOutputEvent(inputEvent, true));
        }
      }
      _makeOutputEvent(event, debug) {
        switch (event.kind) {
          case "feature": {
            const out = {
              kind: debug ? "debug" : "feature",
              creationDate: event.creationDate,
              context: this._contextFilter.filter(event.context, !debug),
              key: event.key,
              value: event.value,
              default: event.default
            };
            if (event.samplingRatio !== 1) {
              out.samplingRatio = event.samplingRatio;
            }
            if (event.prereqOf) {
              out.prereqOf = event.prereqOf;
            }
            if (event.variation !== void 0) {
              out.variation = event.variation;
            }
            if (event.version !== void 0) {
              out.version = event.version;
            }
            if (event.reason) {
              out.reason = event.reason;
            }
            return out;
          }
          case "index":
          // Intentional fallthrough.
          case "identify": {
            const out = {
              kind: event.kind,
              creationDate: event.creationDate,
              context: this._contextFilter.filter(event.context)
            };
            if (event.samplingRatio !== 1) {
              out.samplingRatio = event.samplingRatio;
            }
            return out;
          }
          case "custom": {
            const out = {
              kind: "custom",
              creationDate: event.creationDate,
              key: event.key,
              context: this._contextFilter.filter(event.context)
            };
            if (event.samplingRatio !== 1) {
              out.samplingRatio = event.samplingRatio;
            }
            if (event.data !== void 0) {
              out.data = event.data;
            }
            if (event.metricValue !== void 0) {
              out.metricValue = event.metricValue;
            }
            if (event.url !== void 0) {
              out.url = event.url;
            }
            return out;
          }
          case "click": {
            const out = {
              kind: "click",
              creationDate: event.creationDate,
              contextKeys: event.context.kindsAndKeys,
              key: event.key,
              url: event.url,
              selector: event.selector
            };
            return out;
          }
          case "pageview": {
            const out = {
              kind: "pageview",
              creationDate: event.creationDate,
              contextKeys: event.context.kindsAndKeys,
              key: event.key,
              url: event.url
            };
            return out;
          }
          default:
            return event;
        }
      }
      _enqueue(event) {
        if (this._queue.length < this._capacity) {
          this._queue.push(event);
          this._exceededCapacity = false;
        } else {
          if (!this._exceededCapacity) {
            this._exceededCapacity = true;
            this._logger?.warn("Exceeded event queue capacity. Increase capacity to avoid dropping events.");
          }
          this._droppedEvents += 1;
        }
      }
      _shouldDebugEvent(event) {
        return isFeature(event) && event.debugEventsUntilDate && event.debugEventsUntilDate > this._lastKnownPastTime && event.debugEventsUntilDate > Date.now();
      }
      async _tryPostingEvents(events) {
        const res = await this._eventSender.sendEventData(LDEventType.AnalyticsEvents, events);
        if (res.status === LDDeliveryStatus.FailedAndMustShutDown) {
          this._shutdown = true;
        }
        if (res.serverTime) {
          this._lastKnownPastTime = res.serverTime;
        }
        if (res.error) {
          throw res.error;
        }
      }
    };
    var InputCustomEvent = class {
      constructor(context, key, data, metricValue, samplingRatio = 1, url) {
        this.context = context;
        this.key = key;
        this.data = data;
        this.metricValue = metricValue;
        this.samplingRatio = samplingRatio;
        this.url = url;
        this.kind = "custom";
        this.creationDate = Date.now();
        this.context = context;
      }
    };
    var InputEvalEvent = class {
      constructor(withReasons, context, key, value, defValue, version, variation, trackEvents, prereqOf, reason, debugEventsUntilDate, excludeFromSummaries, samplingRatio = 1) {
        this.withReasons = withReasons;
        this.context = context;
        this.key = key;
        this.samplingRatio = samplingRatio;
        this.kind = "feature";
        this.creationDate = Date.now();
        this.value = value;
        this.default = defValue;
        if (version !== void 0) {
          this.version = version;
        }
        if (variation !== void 0) {
          this.variation = variation;
        }
        if (trackEvents !== void 0) {
          this.trackEvents = trackEvents;
        }
        if (prereqOf !== void 0) {
          this.prereqOf = prereqOf;
        }
        if (reason !== void 0) {
          this.reason = reason;
        }
        if (debugEventsUntilDate !== void 0) {
          this.debugEventsUntilDate = debugEventsUntilDate;
        }
        if (excludeFromSummaries !== void 0) {
          this.excludeFromSummaries = excludeFromSummaries;
        }
      }
    };
    var InputIdentifyEvent = class {
      constructor(context, samplingRatio = 1) {
        this.context = context;
        this.samplingRatio = samplingRatio;
        this.kind = "identify";
        this.creationDate = Date.now();
      }
    };
    var NullEventProcessor = class {
      close() {
      }
      async flush() {
      }
      sendEvent() {
      }
    };
    var EventFactoryBase = class {
      constructor(_withReasons) {
        this._withReasons = _withReasons;
      }
      evalEvent(e) {
        return new InputEvalEvent(
          this._withReasons,
          e.context,
          e.flagKey,
          e.value,
          e.defaultVal,
          e.version,
          // Exclude null as a possibility.
          e.variation ?? void 0,
          e.trackEvents || e.addExperimentData,
          e.prereqOfFlagKey,
          this._withReasons || e.addExperimentData ? e.reason : void 0,
          e.debugEventsUntilDate,
          e.excludeFromSummaries,
          e.samplingRatio
        );
      }
      unknownFlagEvent(key, defVal, context) {
        return new InputEvalEvent(
          this._withReasons,
          context,
          key,
          defVal,
          defVal,
          // This isn't ideal, but the purpose of the factory is to at least
          // handle this situation.
          void 0,
          // version
          void 0,
          // variation index
          void 0,
          // track events
          void 0,
          // prereqOf
          void 0,
          // reason
          void 0,
          // debugEventsUntilDate
          void 0,
          // exclude from summaries
          void 0
        );
      }
      identifyEvent(context) {
        return new InputIdentifyEvent(context, 1);
      }
      customEvent(key, context, data, metricValue, samplingRatio = 1) {
        return new InputCustomEvent(context, key, data ?? void 0, metricValue ?? void 0, samplingRatio);
      }
    };
    var PAYLOAD_ID = "FDv1Fallback";
    function fdv1PayloadAdaptor(processor) {
      return {
        _processor: processor,
        _selector: "",
        useSelector(selector) {
          this._selector = selector;
          return this;
        },
        processFullTransfer(data) {
          const events = [
            {
              event: "server-intent",
              data: {
                payloads: [
                  {
                    id: PAYLOAD_ID,
                    target: 1,
                    intentCode: "xfer-full",
                    reason: "payload-missing"
                  }
                ]
              }
            }
          ];
          Object.entries(data?.flags || []).forEach(([key, flag]) => {
            events.push({
              event: "put-object",
              data: {
                kind: "flag",
                key,
                version: flag.version || 1,
                object: flag
              }
            });
          });
          Object.entries(data?.segments || []).forEach(([key, segment]) => {
            events.push({
              event: "put-object",
              data: {
                kind: "segment",
                key,
                version: segment.version || 1,
                object: segment
              }
            });
          });
          events.push({
            event: "payload-transferred",
            data: {
              // IMPORTANT: the selector MUST be empty or "live" data synchronizers
              // will not work as it would try to resume from a bogus state.
              state: this._selector,
              version: 1,
              id: PAYLOAD_ID
            }
          });
          this._processor.processEvents(events);
        }
      };
    }
    var ACTION_NONE = { type: "none" };
    function createProtocolHandler(objProcessors, logger) {
      let protocolState = "inactive";
      let tempType = "partial";
      let tempUpdates = [];
      function processObj(kind, jsonObj) {
        return objProcessors[kind]?.(jsonObj);
      }
      function resetAll() {
        protocolState = "inactive";
        tempType = "partial";
        tempUpdates = [];
      }
      function resetAfterEmission() {
        protocolState = "changes";
        tempType = "partial";
        tempUpdates = [];
      }
      function resetAfterError() {
        tempUpdates = [];
      }
      function processIntentNone(intent) {
        if (isNullish(intent.target)) {
          logger?.warn(`Ignoring 'none' intent with missing fields: target=${intent.target}`);
          return ACTION_NONE;
        }
        return {
          type: "payload",
          payload: {
            version: intent.target,
            type: "none",
            updates: []
          }
        };
      }
      function processServerIntent(data) {
        if (!data.payloads?.length) {
          return {
            type: "error",
            kind: "MISSING_PAYLOAD",
            message: "No payload present in server-intent"
          };
        }
        const payload = data.payloads[0];
        switch (payload?.intentCode) {
          case "xfer-full":
            protocolState = "full";
            tempUpdates = [];
            tempType = "full";
            return ACTION_NONE;
          case "xfer-changes":
            protocolState = "changes";
            tempUpdates = [];
            tempType = "partial";
            return ACTION_NONE;
          case "none":
            protocolState = "changes";
            tempUpdates = [];
            tempType = "partial";
            return processIntentNone(payload);
          default:
            logger?.warn(`Unable to process intent code '${payload?.intentCode}'.`);
            return ACTION_NONE;
        }
      }
      function processPutObject(data) {
        if (protocolState === "inactive") {
          logger?.warn("Received put-object before server-intent was established. Ignoring.");
          return ACTION_NONE;
        }
        if (!data.kind || !data.key || isNullish(data.version) || !data.object) {
          logger?.warn(`Ignoring put-object with missing fields: kind=${data.kind}, key=${data.key}, version=${data.version}`);
          return ACTION_NONE;
        }
        const obj = processObj(data.kind, data.object);
        if (!obj) {
          logger?.warn(`Unable to process object for kind: '${data.kind}'`);
          return ACTION_NONE;
        }
        tempUpdates.push({
          kind: data.kind,
          key: data.key,
          version: data.version,
          object: obj
        });
        return ACTION_NONE;
      }
      function processDeleteObject(data) {
        if (protocolState === "inactive") {
          logger?.warn("Received delete-object before server-intent was established. Ignoring.");
          return ACTION_NONE;
        }
        if (!data.kind || !data.key || isNullish(data.version)) {
          logger?.warn(`Ignoring delete-object with missing fields: kind=${data.kind}, key=${data.key}, version=${data.version}`);
          return ACTION_NONE;
        }
        tempUpdates.push({
          kind: data.kind,
          key: data.key,
          version: data.version,
          deleted: true
        });
        return ACTION_NONE;
      }
      function processPayloadTransferred(data) {
        if (protocolState === "inactive") {
          return {
            type: "error",
            kind: "PROTOCOL_ERROR",
            message: "A payload transferred has been received without an intent having been established."
          };
        }
        if (isNullish(data.state) || isNullish(data.version)) {
          logger?.warn(`Ignoring payload-transferred with missing fields: state=${data.state}, version=${data.version}`);
          resetAll();
          return ACTION_NONE;
        }
        const result = {
          type: "payload",
          payload: {
            version: data.version,
            state: data.state,
            type: tempType,
            updates: tempUpdates
          }
        };
        resetAfterEmission();
        return result;
      }
      function processGoodbye(data) {
        logger?.info(`Goodbye was received from the LaunchDarkly connection with reason: ${data.reason}.`);
        resetAll();
        return { type: "goodbye", reason: data.reason };
      }
      function processError(data) {
        logger?.info(`An issue was encountered receiving updates with reason: ${data.reason}.`);
        resetAfterError();
        return { type: "serverError", id: data.payload_id, reason: data.reason };
      }
      return {
        get state() {
          return protocolState;
        },
        processEvent(event) {
          switch (event.event) {
            case "server-intent":
              return processServerIntent(event.data);
            case "put-object":
              return processPutObject(event.data);
            case "delete-object":
              return processDeleteObject(event.data);
            case "payload-transferred":
              return processPayloadTransferred(event.data);
            case "goodbye":
              return processGoodbye(event.data);
            case "error":
              return processError(event.data);
            case "heart-beat":
              return ACTION_NONE;
            default:
              return {
                type: "error",
                kind: "UNKNOWN_EVENT",
                message: `Received an unknown event of type '${event.event}'`
              };
          }
        },
        reset() {
          resetAll();
        }
      };
    }
    function isActionableError(kind) {
      return kind === "MISSING_PAYLOAD" || kind === "PROTOCOL_ERROR";
    }
    var PayloadProcessor = class {
      constructor(objProcessors, _errorHandler, _logger) {
        this._errorHandler = _errorHandler;
        this._logger = _logger;
        this._listeners = [];
        this._handler = createProtocolHandler(objProcessors, _logger);
      }
      addPayloadListener(listener) {
        this._listeners.push(listener);
      }
      removePayloadListener(listener) {
        const index2 = this._listeners.indexOf(listener, 0);
        if (index2 > -1) {
          this._listeners.splice(index2, 1);
        }
      }
      processEvents(events) {
        events.forEach((event) => {
          const action = this._handler.processEvent(event);
          switch (action.type) {
            case "payload":
              this._listeners.forEach((it) => it(action.payload));
              break;
            case "error":
              if (isActionableError(action.kind)) {
                this._errorHandler?.(exports2.DataSourceErrorKind.InvalidData, action.message);
              } else {
                this._logger?.warn(action.message);
              }
              break;
          }
        });
      }
    };
    var PayloadStreamReader = class {
      /**
       * Creates a PayloadStreamReader
       *
       * @param eventStream event stream of FDv2 events
       * @param _objProcessors defines object processors for each object kind.
       * @param _errorHandler that will be called with parsing errors as they are encountered
       * @param _logger for logging
       */
      constructor(eventStream, _objProcessors, _errorHandler, _logger) {
        this._errorHandler = _errorHandler;
        this._logger = _logger;
        this._attachHandler(eventStream, "server-intent");
        this._attachHandler(eventStream, "put-object");
        this._attachHandler(eventStream, "delete-object");
        this._attachHandler(eventStream, "payload-transferred");
        this._attachHandler(eventStream, "goodbye");
        this._attachHandler(eventStream, "error");
        this._payloadProcessor = new PayloadProcessor(_objProcessors, _errorHandler, _logger);
      }
      addPayloadListener(listener) {
        this._payloadProcessor.addPayloadListener(listener);
      }
      removePayloadListener(listener) {
        this._payloadProcessor.removePayloadListener(listener);
      }
      _attachHandler(stream, eventName) {
        stream.addEventListener(eventName, async (event) => {
          if (event?.data) {
            this._logger?.debug(`Received ${eventName} event.  Data is ${event.data}`);
            try {
              this._payloadProcessor.processEvents([
                { event: eventName, data: JSON.parse(event.data) }
              ]);
            } catch {
              this._logger?.error(`Stream received data that was unable to be processed in "${eventName}" message`);
              this._logger?.debug(`Data follows: ${event.data}`);
              this._errorHandler?.(exports2.DataSourceErrorKind.InvalidData, "Malformed data in EventStream.");
            }
          } else {
            this._errorHandler?.(exports2.DataSourceErrorKind.Unknown, "Event from EventStream missing data.");
          }
        });
      }
    };
    function initMetadataFromHeaders(initHeaders) {
      if (initHeaders) {
        const envIdKey = Object.keys(initHeaders).find((key) => key.toLowerCase() === "x-ld-envid");
        if (envIdKey) {
          return { environmentId: initHeaders[envIdKey] };
        }
      }
      return void 0;
    }
    var UNKNOWN_PLUGIN_NAME = "unknown plugin";
    function safeGetName(logger, plugin) {
      try {
        return plugin.getMetadata().name || UNKNOWN_PLUGIN_NAME;
      } catch {
        logger.error(`Exception thrown getting metadata for plugin. Unable to get plugin name.`);
        return UNKNOWN_PLUGIN_NAME;
      }
    }
    function safeGetHooks(logger, environmentMetadata, plugins) {
      const hooks = [];
      plugins.forEach((plugin) => {
        try {
          const pluginHooks = plugin.getHooks?.(environmentMetadata);
          if (pluginHooks === void 0) {
            logger.error(`Plugin ${safeGetName(logger, plugin)} returned undefined from getHooks.`);
          } else if (pluginHooks && pluginHooks.length > 0) {
            hooks.push(...pluginHooks);
          }
        } catch (error) {
          logger.error(`Exception thrown getting hooks for plugin ${safeGetName(logger, plugin)}. Unable to get hooks.`);
        }
      });
      return hooks;
    }
    function safeRegisterPlugins(logger, environmentMetadata, client, plugins) {
      plugins.forEach((plugin) => {
        try {
          plugin.register(client, environmentMetadata);
        } catch (error) {
          logger.error(`Exception thrown registering plugin ${safeGetName(logger, plugin)}.`);
        }
      });
    }
    var index = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      ClientMessages,
      DiagnosticsManager,
      ErrorKinds: ErrorKinds$1,
      EventFactoryBase,
      EventProcessor,
      FDv1PayloadAdaptor: fdv1PayloadAdaptor,
      InputCustomEvent,
      InputEvalEvent,
      InputIdentifyEvent,
      NullEventProcessor,
      PayloadProcessor,
      PayloadStreamReader,
      canonicalize,
      createProtocolHandler,
      initMetadataFromHeaders,
      isLegacyUser,
      isMultiKind,
      isSingleKind,
      safeGetHooks,
      safeGetName,
      safeRegisterPlugins,
      shouldSample
    });
    exports2.ApplicationTags = ApplicationTags;
    exports2.AttributeReference = AttributeReference;
    exports2.BasicLogger = BasicLogger;
    exports2.ClientContext = ClientContext;
    exports2.CompositeDataSource = CompositeDataSource;
    exports2.Context = Context;
    exports2.ContextFilter = ContextFilter;
    exports2.DateValidator = DateValidator;
    exports2.DefaultBackoff = DefaultBackoff;
    exports2.FactoryOrInstance = FactoryOrInstance;
    exports2.Function = Function;
    exports2.KindValidator = KindValidator;
    exports2.LDClientError = LDClientError;
    exports2.LDFileDataSourceError = LDFileDataSourceError;
    exports2.LDFlagDeliveryFallbackError = LDFlagDeliveryFallbackError;
    exports2.LDPollingError = LDPollingError;
    exports2.LDStreamingError = LDStreamingError;
    exports2.LDTimeoutError = LDTimeoutError;
    exports2.LDUnexpectedResponseError = LDUnexpectedResponseError;
    exports2.NullableBoolean = NullableBoolean;
    exports2.NumberWithMinimum = NumberWithMinimum;
    exports2.OneOf = OneOf;
    exports2.OptionMessages = OptionMessages;
    exports2.SafeLogger = SafeLogger;
    exports2.ServiceEndpoints = ServiceEndpoints;
    exports2.StringMatchingRegex = StringMatchingRegex;
    exports2.Type = Type;
    exports2.TypeArray = TypeArray;
    exports2.TypeValidators = TypeValidators;
    exports2.base64UrlEncode = base64UrlEncode;
    exports2.cancelableTimedPromise = cancelableTimedPromise;
    exports2.clone = clone;
    exports2.createSafeLogger = createSafeLogger;
    exports2.debounce = debounce;
    exports2.deepCompact = deepCompact;
    exports2.defaultHeaders = defaultHeaders;
    exports2.fastDeepEqual = fastDeepEqual;
    exports2.getEventsUri = getEventsUri;
    exports2.getPollingUri = getPollingUri;
    exports2.getStreamingUri = getStreamingUri;
    exports2.httpErrorMessage = httpErrorMessage;
    exports2.internal = index;
    exports2.isHttpLocallyRecoverable = isHttpLocallyRecoverable;
    exports2.isHttpRecoverable = isHttpRecoverable;
    exports2.isNullish = isNullish;
    exports2.noop = noop;
    exports2.secondsToMillis = secondsToMillis;
    exports2.shouldRetry = shouldRetry;
    exports2.sleep = sleep;
    exports2.subsystem = index$1;
    exports2.timedPromise = timedPromise;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDFlagsStateOptions.js
var require_LDFlagsStateOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDFlagsStateOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDFlagsState.js
var require_LDFlagsState = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDFlagsState.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDMigrationStage.js
var require_LDMigrationStage = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDMigrationStage.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.IsMigrationStage = exports2.LDMigrationStage = void 0;
    var LDMigrationStage;
    (function(LDMigrationStage2) {
      LDMigrationStage2["Off"] = "off";
      LDMigrationStage2["DualWrite"] = "dualwrite";
      LDMigrationStage2["Shadow"] = "shadow";
      LDMigrationStage2["Live"] = "live";
      LDMigrationStage2["RampDown"] = "rampdown";
      LDMigrationStage2["Complete"] = "complete";
    })(LDMigrationStage || (exports2.LDMigrationStage = LDMigrationStage = {}));
    function IsMigrationStage(value) {
      return Object.values(LDMigrationStage).includes(value);
    }
    exports2.IsMigrationStage = IsMigrationStage;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDMigrationOpEvent.js
var require_LDMigrationOpEvent = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDMigrationOpEvent.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDMigrationVariation.js
var require_LDMigrationVariation = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/LDMigrationVariation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LDConsistencyCheck = void 0;
    var LDConsistencyCheck;
    (function(LDConsistencyCheck2) {
      LDConsistencyCheck2[LDConsistencyCheck2["Inconsistent"] = 0] = "Inconsistent";
      LDConsistencyCheck2[LDConsistencyCheck2["Consistent"] = 1] = "Consistent";
      LDConsistencyCheck2[LDConsistencyCheck2["NotChecked"] = 2] = "NotChecked";
    })(LDConsistencyCheck || (exports2.LDConsistencyCheck = LDConsistencyCheck = {}));
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/index.js
var require_data = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/data/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_LDFlagsStateOptions(), exports2);
    __exportStar(require_LDFlagsState(), exports2);
    __exportStar(require_LDMigrationStage(), exports2);
    __exportStar(require_LDMigrationOpEvent(), exports2);
    __exportStar(require_LDMigrationVariation(), exports2);
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDBigSegmentsOptions.js
var require_LDBigSegmentsOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDBigSegmentsOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDOptions.js
var require_LDOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDProxyOptions.js
var require_LDProxyOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDProxyOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDTLSOptions.js
var require_LDTLSOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDTLSOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDMigrationOptions.js
var require_LDMigrationOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDMigrationOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LDConcurrentExecution = exports2.LDSerialExecution = exports2.LDExecution = exports2.LDExecutionOrdering = void 0;
    var LDExecutionOrdering;
    (function(LDExecutionOrdering2) {
      LDExecutionOrdering2[LDExecutionOrdering2["Fixed"] = 0] = "Fixed";
      LDExecutionOrdering2[LDExecutionOrdering2["Random"] = 1] = "Random";
    })(LDExecutionOrdering || (exports2.LDExecutionOrdering = LDExecutionOrdering = {}));
    var LDExecution;
    (function(LDExecution2) {
      LDExecution2[LDExecution2["Serial"] = 0] = "Serial";
      LDExecution2[LDExecution2["Concurrent"] = 1] = "Concurrent";
    })(LDExecution || (exports2.LDExecution = LDExecution = {}));
    var LDSerialExecution = class {
      constructor(ordering) {
        this.ordering = ordering;
        this.type = LDExecution.Serial;
      }
    };
    exports2.LDSerialExecution = LDSerialExecution;
    var LDConcurrentExecution = class {
      constructor() {
        this.type = LDExecution.Concurrent;
      }
    };
    exports2.LDConcurrentExecution = LDConcurrentExecution;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDDataSystemOptions.js
var require_LDDataSystemOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/LDDataSystemOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isCustomOptions = exports2.isPollingOnlyOptions = exports2.isStreamingOnlyOptions = exports2.isStandardOptions = void 0;
    function isStandardOptions(u) {
      return u.dataSourceOptionsType === "standard";
    }
    exports2.isStandardOptions = isStandardOptions;
    function isStreamingOnlyOptions(u) {
      return u.dataSourceOptionsType === "streamingOnly";
    }
    exports2.isStreamingOnlyOptions = isStreamingOnlyOptions;
    function isPollingOnlyOptions(u) {
      return u.dataSourceOptionsType === "pollingOnly";
    }
    exports2.isPollingOnlyOptions = isPollingOnlyOptions;
    function isCustomOptions(u) {
      return u.dataSourceOptionsType === "custom";
    }
    exports2.isCustomOptions = isCustomOptions;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/index.js
var require_options = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/options/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_LDBigSegmentsOptions(), exports2);
    __exportStar(require_LDOptions(), exports2);
    __exportStar(require_LDProxyOptions(), exports2);
    __exportStar(require_LDTLSOptions(), exports2);
    __exportStar(require_LDMigrationOptions(), exports2);
    __exportStar(require_LDDataSystemOptions(), exports2);
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/LDClient.js
var require_LDClient = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/LDClient.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/LDMigration.js
var require_LDMigration = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/LDMigration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/DataKind.js
var require_DataKind = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/DataKind.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDFeatureStore.js
var require_LDFeatureStore = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDFeatureStore.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDTransactionalFeatureStore.js
var require_LDTransactionalFeatureStore = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDTransactionalFeatureStore.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/LDWaitForInitializationOptions.js
var require_LDWaitForInitializationOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/LDWaitForInitializationOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/integrations/FileDataSourceOptions.js
var require_FileDataSourceOptions = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/integrations/FileDataSourceOptions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/integrations/Hook.js
var require_Hook = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/integrations/Hook.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/integrations/index.js
var require_integrations = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/integrations/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_FileDataSourceOptions(), exports2);
    __exportStar(require_Hook(), exports2);
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStore.js
var require_BigSegmentStore = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStore.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreMembership.js
var require_BigSegmentStoreMembership = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreMembership.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreMetadata.js
var require_BigSegmentStoreMetadata = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreMetadata.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreStatus.js
var require_BigSegmentStoreStatus = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreStatus.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/DataCollection.js
var require_DataCollection = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/DataCollection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/FullDataSet.js
var require_FullDataSet = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/FullDataSet.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/KeyedItems.js
var require_KeyedItems = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/KeyedItems.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/VersionedData.js
var require_VersionedData = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/VersionedData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreStatusProvider.js
var require_BigSegmentStoreStatusProvider = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/BigSegmentStoreStatusProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/persistent_store/index.js
var require_persistent_store = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/persistent_store/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/index.js
var require_interfaces = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/interfaces/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_BigSegmentStore(), exports2);
    __exportStar(require_BigSegmentStoreMembership(), exports2);
    __exportStar(require_BigSegmentStoreMetadata(), exports2);
    __exportStar(require_BigSegmentStoreStatus(), exports2);
    __exportStar(require_DataCollection(), exports2);
    __exportStar(require_DataKind(), exports2);
    __exportStar(require_FullDataSet(), exports2);
    __exportStar(require_KeyedItems(), exports2);
    __exportStar(require_VersionedData(), exports2);
    __exportStar(require_BigSegmentStoreStatusProvider(), exports2);
    __exportStar(require_persistent_store(), exports2);
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDDataSourceUpdates.js
var require_LDDataSourceUpdates = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDDataSourceUpdates.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDFeatureRequestor.js
var require_LDFeatureRequestor = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDFeatureRequestor.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDTransactionalDataSourceUpdates.js
var require_LDTransactionalDataSourceUpdates = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/LDTransactionalDataSourceUpdates.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/index.js
var require_subsystems = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/subsystems/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_LDDataSourceUpdates(), exports2);
    __exportStar(require_LDFeatureRequestor(), exports2);
    __exportStar(require_LDFeatureStore(), exports2);
    __exportStar(require_LDTransactionalDataSourceUpdates(), exports2);
    __exportStar(require_LDTransactionalFeatureStore(), exports2);
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/api/index.js
var require_api = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/api/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.subsystems = exports2.interfaces = exports2.integrations = void 0;
    __exportStar(require_data(), exports2);
    __exportStar(require_options(), exports2);
    __exportStar(require_LDClient(), exports2);
    __exportStar(require_LDMigration(), exports2);
    __exportStar(require_DataKind(), exports2);
    __exportStar(require_LDFeatureStore(), exports2);
    __exportStar(require_LDTransactionalFeatureStore(), exports2);
    __exportStar(require_LDWaitForInitializationOptions(), exports2);
    exports2.integrations = require_integrations();
    exports2.interfaces = require_interfaces();
    exports2.subsystems = require_subsystems();
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/cache/LruCache.js
var require_LruCache = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/cache/LruCache.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var LruCache = class {
      constructor(options) {
        this._keyMap = /* @__PURE__ */ new Map();
        this._head = 0;
        this._tail = 0;
        this._size = 0;
        const { max } = options;
        this._max = max;
        this._values = new Array(max);
        this._keys = new Array(max);
        this._next = new Uint32Array(max);
        this._prev = new Uint32Array(max);
        if (options.maxAge) {
          this._lastUpdated = new Array(max).fill(0);
          this._maxAge = options.maxAge;
        } else {
          this._lastUpdated = [];
          this._maxAge = 0;
        }
      }
      set(key, val) {
        let index = this._keyMap.get(key);
        if (index === void 0) {
          index = this._index();
          this._keys[index] = key;
          this._keyMap.set(key, index);
          this._next[this._tail] = index;
          this._prev[index] = this._tail;
          this._tail = index;
          this._size += 1;
        } else {
          this._setTail(index);
        }
        this._values[index] = val;
        if (this._maxAge) {
          this._lastUpdated[index] = Date.now();
        }
      }
      get(key) {
        const index = this._keyMap.get(key);
        if (index !== void 0) {
          if (this._maxAge) {
            const lastUpdated = this._lastUpdated[index];
            if (Date.now() - lastUpdated > this._maxAge) {
              return void 0;
            }
          }
          this._setTail(index);
          if (this._maxAge) {
            this._lastUpdated[index] = Date.now();
          }
          return this._values[index];
        }
        return void 0;
      }
      clear() {
        this._head = 0;
        this._tail = 0;
        this._size = 0;
        this._values.fill(void 0);
        this._keys.fill(void 0);
        this._next.fill(0);
        this._prev.fill(0);
        this._keyMap.clear();
      }
      _index() {
        if (this._size === 0) {
          return this._tail;
        }
        if (this._size === this._max) {
          return this._evict();
        }
        return this._size;
      }
      _evict() {
        const { _head: head } = this;
        const k = this._keys[head];
        this._head = this._next[head];
        this._keyMap.delete(k);
        this._size -= 1;
        return head;
      }
      _link(p, n) {
        this._prev[n] = p;
        this._next[p] = n;
      }
      _setTail(index) {
        if (index !== this._tail) {
          if (index === this._head) {
            this._head = this._next[index];
          } else {
            this._link(this._prev[index], this._next[index]);
          }
          this._link(this._tail, index);
          this._tail = index;
        }
      }
    };
    exports2.default = LruCache;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/BigSegmentsManager.js
var require_BigSegmentsManager = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/BigSegmentsManager.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var BigSegmentStatusProviderImpl_1 = require_BigSegmentStatusProviderImpl();
    var LruCache_1 = require_LruCache();
    var DEFAULT_STALE_AFTER_SECONDS = 120;
    var DEFAULT_STATUS_POLL_INTERVAL_SECONDS = 5;
    var DEFAULT_USER_CACHE_SIZE = 1e3;
    var DEFAULT_USER_CACHE_TIME_SECONDS = 5;
    var BigSegmentsManager = class {
      constructor(_store, config, _logger, _crypto) {
        this._store = _store;
        this._logger = _logger;
        this._crypto = _crypto;
        this.statusProvider = new BigSegmentStatusProviderImpl_1.default(async () => this._pollStoreAndUpdateStatus());
        this._staleTimeMs = (js_sdk_common_1.TypeValidators.Number.is(config.staleAfter) && config.staleAfter > 0 ? config.staleAfter : DEFAULT_STALE_AFTER_SECONDS) * 1e3;
        const pollIntervalMs = (js_sdk_common_1.TypeValidators.Number.is(config.statusPollInterval) && config.statusPollInterval > 0 ? config.statusPollInterval : DEFAULT_STATUS_POLL_INTERVAL_SECONDS) * 1e3;
        this._pollHandle = _store ? setInterval(() => this._pollStoreAndUpdateStatus(), pollIntervalMs) : null;
        if (_store) {
          this._cache = new LruCache_1.default({
            max: config.userCacheSize || DEFAULT_USER_CACHE_SIZE,
            maxAge: (config.userCacheTime || DEFAULT_USER_CACHE_TIME_SECONDS) * 1e3
          });
        }
      }
      close() {
        if (this._pollHandle) {
          clearInterval(this._pollHandle);
          this._pollHandle = void 0;
        }
        if (this._store) {
          this._store.close();
        }
      }
      async getUserMembership(userKey) {
        var _a, _b, _c;
        if (!this._store) {
          return void 0;
        }
        const memberCache = (_a = this._cache) === null || _a === void 0 ? void 0 : _a.get(userKey);
        let membership;
        if (!memberCache) {
          try {
            membership = await this._store.getUserMembership(this._hashForUserKey(userKey));
            const cacheItem = { membership };
            (_b = this._cache) === null || _b === void 0 ? void 0 : _b.set(userKey, cacheItem);
          } catch (err) {
            (_c = this._logger) === null || _c === void 0 ? void 0 : _c.error(`Big Segment store membership query returned error: ${err}`);
            return [null, "STORE_ERROR"];
          }
        } else {
          membership = memberCache.membership;
        }
        if (!this.statusProvider.getStatus()) {
          await this._pollStoreAndUpdateStatus();
        }
        const lastStatus = this.statusProvider.getStatus();
        if (!lastStatus.available) {
          return [membership || null, "STORE_ERROR"];
        }
        return [membership || null, lastStatus.stale ? "STALE" : "HEALTHY"];
      }
      async _pollStoreAndUpdateStatus() {
        var _a, _b, _c;
        if (!this._store) {
          this.statusProvider.setStatus({ available: false, stale: false });
          return;
        }
        (_a = this._logger) === null || _a === void 0 ? void 0 : _a.debug("Querying Big Segment store status");
        let newStatus;
        try {
          const metadata = await this._store.getMetadata();
          newStatus = {
            available: true,
            stale: !metadata || !metadata.lastUpToDate || this._isStale(metadata.lastUpToDate)
          };
        } catch (err) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error(`Big Segment store status query returned error: ${err}`);
          newStatus = { available: false, stale: false };
        }
        const lastStatus = this.statusProvider.getStatus();
        if (!lastStatus || lastStatus.available !== newStatus.available || lastStatus.stale !== newStatus.stale) {
          (_c = this._logger) === null || _c === void 0 ? void 0 : _c.debug("Big Segment store status changed from %s to %s", JSON.stringify(lastStatus), JSON.stringify(newStatus));
          this.statusProvider.setStatus(newStatus);
          this.statusProvider.notify();
        }
      }
      _hashForUserKey(userKey) {
        const hasher = this._crypto.createHash("sha256");
        hasher.update(userKey);
        if (!hasher.digest) {
          throw new Error("Platform must implement digest or asyncDigest");
        }
        return hasher.digest("base64");
      }
      _isStale(timestamp) {
        return Date.now() - timestamp >= this._staleTimeMs;
      }
    };
    exports2.default = BigSegmentsManager;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/createPluginEnvironmentMetadata.js
var require_createPluginEnvironmentMetadata = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/createPluginEnvironmentMetadata.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createPluginEnvironmentMetadata = void 0;
    function createPluginEnvironmentMetadata(_platform, _sdkKey, config) {
      const environmentMetadata = {
        sdk: {
          name: _platform.info.sdkData().userAgentBase,
          version: _platform.info.sdkData().version
        },
        sdkKey: _sdkKey
      };
      if (_platform.info.sdkData().wrapperName) {
        environmentMetadata.sdk.wrapperName = _platform.info.sdkData().wrapperName;
      }
      if (_platform.info.sdkData().wrapperVersion) {
        environmentMetadata.sdk.wrapperVersion = _platform.info.sdkData().wrapperVersion;
      }
      if (config.applicationInfo) {
        environmentMetadata.application = config.applicationInfo;
      }
      return environmentMetadata;
    }
    exports2.createPluginEnvironmentMetadata = createPluginEnvironmentMetadata;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/createPayloadListenerFDv2.js
var require_createPayloadListenerFDv2 = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/createPayloadListenerFDv2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createPayloadListener = void 0;
    var namespaceForKind = (kind) => {
      switch (kind) {
        case "flag":
          return "features";
        case "segment":
          return "segments";
        default:
          return kind;
      }
    };
    var createPayloadListener = (dataSourceUpdates, logger, initializedCallback = () => {
    }) => (dataContainer) => {
      const { initMetadata, payload } = dataContainer;
      if (payload.type === "full") {
        logger === null || logger === void 0 ? void 0 : logger.debug("Initializing all data");
      } else if (payload.updates.length > 0) {
        logger === null || logger === void 0 ? void 0 : logger.debug("Applying updates");
      } else {
        logger === null || logger === void 0 ? void 0 : logger.debug("Payload had no updates, ignoring.");
        return;
      }
      const converted = {};
      payload.updates.forEach((it) => {
        const namespace = namespaceForKind(it.kind);
        if (converted[namespace]) {
          converted[namespace][it.key] = Object.assign(Object.assign({ version: it.version }, it.deleted && { deleted: it.deleted }), it.object);
        } else {
          converted[namespace] = {
            [it.key]: Object.assign(Object.assign({ version: it.version }, it.deleted && { deleted: it.deleted }), it.object)
          };
        }
        if (it.deleted) {
          logger === null || logger === void 0 ? void 0 : logger.debug(`Deleting ${it.key} in ${it.kind}`);
        } else {
          logger === null || logger === void 0 ? void 0 : logger.debug(`Updating ${it.key} in ${it.kind}`);
        }
      });
      dataSourceUpdates.applyChanges(payload.type === "full", converted, () => {
        if (payload.state !== "") {
          initializedCallback();
        }
      }, initMetadata, payload.state);
    };
    exports2.createPayloadListener = createPayloadListener;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/VersionedDataKinds.js
var require_VersionedDataKinds = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/VersionedDataKinds.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var VersionedDataKinds = class {
      static getKeyFromPath(kind, path3) {
        return path3.startsWith(kind.streamApiPath) ? path3.substring(kind.streamApiPath.length) : void 0;
      }
    };
    VersionedDataKinds.Features = {
      namespace: "features",
      streamApiPath: "/flags/"
    };
    VersionedDataKinds.Segments = {
      namespace: "segments",
      streamApiPath: "/segments/"
    };
    exports2.default = VersionedDataKinds;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/serialization.js
var require_serialization = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/serialization.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.deserializeSegment = exports2.serializeSegment = exports2.deserializeFlag = exports2.serializeFlag = exports2.deserializeDelete = exports2.deserializePatch = exports2.deserializePoll = exports2.deserializeAll = exports2.reviveFullPayload = exports2.processSegment = exports2.processFlag = exports2.replacer = exports2.nullReplacer = void 0;
    var js_sdk_common_1 = require_cjs();
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var TARGET_LIST_ARRAY_CUTOFF = 100;
    function nullReplacer(target, excludeKeys) {
      const stack = [];
      if (target === null || target === void 0) {
        return;
      }
      const filteredEntries = Object.entries(target).filter(([key, _value]) => !(excludeKeys === null || excludeKeys === void 0 ? void 0 : excludeKeys.includes(key)));
      stack.push(...filteredEntries.map(([key, value]) => ({
        key,
        value,
        parent: target
      })));
      while (stack.length) {
        const item = stack.pop();
        if (item.value === null && !Array.isArray(item.parent)) {
          delete item.parent[item.key];
        } else if (typeof item.value === "object" && item.value !== null) {
          stack.push(...Object.entries(item.value).map(([key, value]) => ({
            key,
            value,
            parent: item.value
          })));
        }
      }
    }
    exports2.nullReplacer = nullReplacer;
    function replacer(key, value) {
      if (value instanceof js_sdk_common_1.AttributeReference) {
        return void 0;
      }
      if (Array.isArray(value)) {
        if (value[0] && value[0] instanceof js_sdk_common_1.AttributeReference) {
          return void 0;
        }
      }
      if (value === null || value === void 0) {
        return value;
      }
      if (value.generated_includedSet) {
        value.included = [...value.generated_includedSet];
        delete value.generated_includedSet;
      }
      if (value.generated_excludedSet) {
        value.excluded = [...value.generated_excludedSet];
        delete value.generated_excludedSet;
      }
      if (value.includedContexts) {
        value.includedContexts.forEach((target) => {
          if (target.generated_valuesSet) {
            target.values = [...target.generated_valuesSet];
          }
          delete target.generated_valuesSet;
        });
      }
      if (value.excludedContexts) {
        value.excludedContexts.forEach((target) => {
          if (target.generated_valuesSet) {
            target.values = [...target.generated_valuesSet];
          }
          delete target.generated_valuesSet;
        });
      }
      return value;
    }
    exports2.replacer = replacer;
    function processRollout(rollout) {
      if (rollout && rollout.bucketBy) {
        rollout.bucketByAttributeReference = new js_sdk_common_1.AttributeReference(rollout.bucketBy, !rollout.contextKind);
      }
    }
    function processFlag(flag) {
      var _a;
      nullReplacer(flag, ["variations"]);
      if (flag.fallthrough && flag.fallthrough.rollout) {
        const rollout = flag.fallthrough.rollout;
        processRollout(rollout);
      }
      (_a = flag === null || flag === void 0 ? void 0 : flag.rules) === null || _a === void 0 ? void 0 : _a.forEach((rule) => {
        var _a2;
        processRollout(rule.rollout);
        (_a2 = rule === null || rule === void 0 ? void 0 : rule.clauses) === null || _a2 === void 0 ? void 0 : _a2.forEach((clause) => {
          if (clause && clause.attribute) {
            clause.attributeReference = new js_sdk_common_1.AttributeReference(clause.attribute, !clause.contextKind);
          } else if (clause) {
            clause.attributeReference = js_sdk_common_1.AttributeReference.InvalidReference;
          }
        });
      });
    }
    exports2.processFlag = processFlag;
    function processSegment(segment) {
      var _a, _b, _c, _d, _e;
      nullReplacer(segment);
      if (((_a = segment === null || segment === void 0 ? void 0 : segment.included) === null || _a === void 0 ? void 0 : _a.length) && segment.included.length > TARGET_LIST_ARRAY_CUTOFF) {
        segment.generated_includedSet = new Set(segment.included);
        delete segment.included;
      }
      if (((_b = segment === null || segment === void 0 ? void 0 : segment.excluded) === null || _b === void 0 ? void 0 : _b.length) && segment.excluded.length > TARGET_LIST_ARRAY_CUTOFF) {
        segment.generated_excludedSet = new Set(segment.excluded);
        delete segment.excluded;
      }
      if ((_c = segment === null || segment === void 0 ? void 0 : segment.includedContexts) === null || _c === void 0 ? void 0 : _c.length) {
        segment.includedContexts.forEach((target) => {
          var _a2;
          if (((_a2 = target === null || target === void 0 ? void 0 : target.values) === null || _a2 === void 0 ? void 0 : _a2.length) && target.values.length > TARGET_LIST_ARRAY_CUTOFF) {
            target.generated_valuesSet = new Set(target.values);
            target.values = [];
          }
        });
      }
      if ((_d = segment === null || segment === void 0 ? void 0 : segment.excludedContexts) === null || _d === void 0 ? void 0 : _d.length) {
        segment.excludedContexts.forEach((target) => {
          var _a2;
          if (((_a2 = target === null || target === void 0 ? void 0 : target.values) === null || _a2 === void 0 ? void 0 : _a2.length) && target.values.length > TARGET_LIST_ARRAY_CUTOFF) {
            target.generated_valuesSet = new Set(target.values);
            target.values = [];
          }
        });
      }
      (_e = segment === null || segment === void 0 ? void 0 : segment.rules) === null || _e === void 0 ? void 0 : _e.forEach((rule) => {
        var _a2;
        if (rule.bucketBy) {
          rule.bucketByAttributeReference = new js_sdk_common_1.AttributeReference(rule.bucketBy, !rule.rolloutContextKind);
        }
        (_a2 = rule === null || rule === void 0 ? void 0 : rule.clauses) === null || _a2 === void 0 ? void 0 : _a2.forEach((clause) => {
          if (clause && clause.attribute) {
            clause.attributeReference = new js_sdk_common_1.AttributeReference(clause.attribute, !clause.contextKind);
          } else if (clause) {
            clause.attributeReference = js_sdk_common_1.AttributeReference.InvalidReference;
          }
        });
      });
    }
    exports2.processSegment = processSegment;
    function tryParse(data) {
      try {
        return JSON.parse(data);
      } catch (_a) {
        return void 0;
      }
    }
    function reviveFullPayload(payload) {
      const flagsAndSegments = payload;
      Object.values((flagsAndSegments === null || flagsAndSegments === void 0 ? void 0 : flagsAndSegments.flags) || []).forEach((flag) => {
        processFlag(flag);
      });
      Object.values((flagsAndSegments === null || flagsAndSegments === void 0 ? void 0 : flagsAndSegments.segments) || []).forEach((segment) => {
        processSegment(segment);
      });
      return flagsAndSegments;
    }
    exports2.reviveFullPayload = reviveFullPayload;
    function deserializeAll(data) {
      const parsed = tryParse(data);
      if (!parsed) {
        return void 0;
      }
      reviveFullPayload(parsed === null || parsed === void 0 ? void 0 : parsed.data);
      return parsed;
    }
    exports2.deserializeAll = deserializeAll;
    function deserializePoll(data) {
      const parsed = tryParse(data);
      if (!parsed) {
        return void 0;
      }
      reviveFullPayload(parsed);
      return parsed;
    }
    exports2.deserializePoll = deserializePoll;
    function deserializePatch(data) {
      const parsed = tryParse(data);
      if (!parsed) {
        return void 0;
      }
      if (parsed.path.startsWith(VersionedDataKinds_1.default.Features.streamApiPath)) {
        processFlag(parsed.data);
        parsed.kind = VersionedDataKinds_1.default.Features;
      } else if (parsed.path.startsWith(VersionedDataKinds_1.default.Segments.streamApiPath)) {
        processSegment(parsed.data);
        parsed.kind = VersionedDataKinds_1.default.Segments;
      }
      return parsed;
    }
    exports2.deserializePatch = deserializePatch;
    function deserializeDelete(data) {
      const parsed = tryParse(data);
      if (!parsed) {
        return void 0;
      }
      if (parsed.path.startsWith(VersionedDataKinds_1.default.Features.streamApiPath)) {
        parsed.kind = VersionedDataKinds_1.default.Features;
      } else if (parsed.path.startsWith(VersionedDataKinds_1.default.Segments.streamApiPath)) {
        parsed.kind = VersionedDataKinds_1.default.Segments;
      }
      return parsed;
    }
    exports2.deserializeDelete = deserializeDelete;
    function serializeFlag(flag) {
      return JSON.stringify(flag, replacer);
    }
    exports2.serializeFlag = serializeFlag;
    function deserializeFlag(data) {
      const parsed = tryParse(data);
      if (!parsed) {
        return void 0;
      }
      processFlag(parsed);
      return parsed;
    }
    exports2.deserializeFlag = deserializeFlag;
    function serializeSegment(segment) {
      return JSON.stringify(segment, replacer);
    }
    exports2.serializeSegment = serializeSegment;
    function deserializeSegment(data) {
      const parsed = tryParse(data);
      if (!parsed) {
        return void 0;
      }
      processSegment(parsed);
      return parsed;
    }
    exports2.deserializeSegment = deserializeSegment;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/createStreamListeners.js
var require_createStreamListeners = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/createStreamListeners.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createStreamListeners = exports2.createDeleteListener = exports2.createPatchListener = exports2.createPutListener = void 0;
    var js_sdk_common_1 = require_cjs();
    var serialization_1 = require_serialization();
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var { initMetadataFromHeaders } = js_sdk_common_1.internal;
    var createPutListener = (dataSourceUpdates, logger, onPutCompleteHandler = () => {
    }) => ({
      deserializeData: serialization_1.deserializeAll,
      processJson: async ({ data: { flags, segments } }, initHeaders) => {
        const initData = {
          [VersionedDataKinds_1.default.Features.namespace]: flags,
          [VersionedDataKinds_1.default.Segments.namespace]: segments
        };
        logger === null || logger === void 0 ? void 0 : logger.debug("Initializing all data");
        dataSourceUpdates.init(initData, onPutCompleteHandler, initMetadataFromHeaders(initHeaders));
      }
    });
    exports2.createPutListener = createPutListener;
    var createPatchListener = (dataSourceUpdates, logger, onPatchCompleteHandler = () => {
    }) => ({
      deserializeData: serialization_1.deserializePatch,
      processJson: async ({ data, kind, path: path3 }) => {
        if (kind) {
          const key = VersionedDataKinds_1.default.getKeyFromPath(kind, path3);
          if (key) {
            logger === null || logger === void 0 ? void 0 : logger.debug(`Updating ${key} in ${kind.namespace}`);
            dataSourceUpdates.upsert(kind, data, onPatchCompleteHandler);
          }
        }
      }
    });
    exports2.createPatchListener = createPatchListener;
    var createDeleteListener = (dataSourceUpdates, logger, onDeleteCompleteHandler = () => {
    }) => ({
      deserializeData: serialization_1.deserializeDelete,
      processJson: async ({ kind, path: path3, version }) => {
        if (kind) {
          const key = VersionedDataKinds_1.default.getKeyFromPath(kind, path3);
          if (key) {
            logger === null || logger === void 0 ? void 0 : logger.debug(`Deleting ${key} in ${kind.namespace}`);
            dataSourceUpdates.upsert(kind, {
              key,
              version,
              deleted: true
            }, onDeleteCompleteHandler);
          }
        }
      }
    });
    exports2.createDeleteListener = createDeleteListener;
    var createStreamListeners = (dataSourceUpdates, logger, onCompleteHandlers) => {
      const listeners = /* @__PURE__ */ new Map();
      listeners.set("put", (0, exports2.createPutListener)(dataSourceUpdates, logger, onCompleteHandlers === null || onCompleteHandlers === void 0 ? void 0 : onCompleteHandlers.put));
      listeners.set("patch", (0, exports2.createPatchListener)(dataSourceUpdates, logger, onCompleteHandlers === null || onCompleteHandlers === void 0 ? void 0 : onCompleteHandlers.patch));
      listeners.set("delete", (0, exports2.createDeleteListener)(dataSourceUpdates, logger, onCompleteHandlers === null || onCompleteHandlers === void 0 ? void 0 : onCompleteHandlers.delete));
      return listeners;
    };
    exports2.createStreamListeners = createStreamListeners;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/NamespacedDataSet.js
var require_NamespacedDataSet = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/NamespacedDataSet.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var NamespacedDataSet = class {
      constructor() {
        this._itemsByNamespace = {};
      }
      get(namespace, key) {
        var _a;
        return (_a = this._itemsByNamespace[namespace]) === null || _a === void 0 ? void 0 : _a[key];
      }
      set(namespace, key, value) {
        if (!(namespace in this._itemsByNamespace)) {
          this._itemsByNamespace[namespace] = {};
        }
        this._itemsByNamespace[namespace][key] = value;
      }
      remove(namespace, key) {
        const items = this._itemsByNamespace[namespace];
        if (items) {
          delete items[key];
        }
      }
      removeAll() {
        this._itemsByNamespace = {};
      }
      enumerate(callback) {
        Object.entries(this._itemsByNamespace).forEach(([namespace, values]) => {
          Object.entries(values).forEach(([key, value]) => {
            callback(namespace, key, value);
          });
        });
      }
      mergeFrom(other) {
        other.enumerate(this.set.bind(this));
      }
    };
    exports2.default = NamespacedDataSet;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/DependencyTracker.js
var require_DependencyTracker = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/DependencyTracker.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var NamespacedDataSet_1 = require_NamespacedDataSet();
    var DependencyTracker = class {
      constructor() {
        this._dependenciesFrom = new NamespacedDataSet_1.default();
        this._dependenciesTo = new NamespacedDataSet_1.default();
      }
      updateDependenciesFrom(namespace, key, newDependencySet) {
        const oldDependencySet = this._dependenciesFrom.get(namespace, key);
        oldDependencySet === null || oldDependencySet === void 0 ? void 0 : oldDependencySet.enumerate((depNs, depKey) => {
          const depsToThisDep = this._dependenciesTo.get(depNs, depKey);
          depsToThisDep === null || depsToThisDep === void 0 ? void 0 : depsToThisDep.remove(namespace, key);
        });
        this._dependenciesFrom.set(namespace, key, newDependencySet);
        newDependencySet === null || newDependencySet === void 0 ? void 0 : newDependencySet.enumerate((depNs, depKey) => {
          let depsToThisDep = this._dependenciesTo.get(depNs, depKey);
          if (!depsToThisDep) {
            depsToThisDep = new NamespacedDataSet_1.default();
            this._dependenciesTo.set(depNs, depKey, depsToThisDep);
          }
          depsToThisDep.set(namespace, key, true);
        });
      }
      updateModifiedItems(inDependencySet, modifiedNamespace, modifiedKey) {
        if (!inDependencySet.get(modifiedNamespace, modifiedKey)) {
          inDependencySet.set(modifiedNamespace, modifiedKey, true);
          const affectedItems = this._dependenciesTo.get(modifiedNamespace, modifiedKey);
          affectedItems === null || affectedItems === void 0 ? void 0 : affectedItems.enumerate((namespace, key) => {
            this.updateModifiedItems(inDependencySet, namespace, key);
          });
        }
      }
      reset() {
        this._dependenciesFrom.removeAll();
        this._dependenciesTo.removeAll();
      }
    };
    exports2.default = DependencyTracker;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/DataSourceUpdates.js
var require_DataSourceUpdates = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/DataSourceUpdates.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.computeDependencies = void 0;
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var DependencyTracker_1 = require_DependencyTracker();
    var NamespacedDataSet_1 = require_NamespacedDataSet();
    function computeDependencies(namespace, item) {
      var _a, _b;
      const ret = new NamespacedDataSet_1.default();
      const isFlag = namespace === VersionedDataKinds_1.default.Features.namespace;
      const isSegment = namespace === VersionedDataKinds_1.default.Segments.namespace;
      if (isFlag) {
        const flag = item;
        (_a = flag === null || flag === void 0 ? void 0 : flag.prerequisites) === null || _a === void 0 ? void 0 : _a.forEach((prereq) => {
          ret.set(namespace, prereq.key, true);
        });
      }
      if (isFlag || isSegment) {
        const itemWithRuleClauses = item;
        (_b = itemWithRuleClauses === null || itemWithRuleClauses === void 0 ? void 0 : itemWithRuleClauses.rules) === null || _b === void 0 ? void 0 : _b.forEach((rule) => {
          var _a2;
          (_a2 = rule.clauses) === null || _a2 === void 0 ? void 0 : _a2.forEach((clause) => {
            if (clause.op === "segmentMatch") {
              clause.values.forEach((value) => {
                ret.set(VersionedDataKinds_1.default.Segments.namespace, value, true);
              });
            }
          });
        });
      }
      return ret;
    }
    exports2.computeDependencies = computeDependencies;
    var DataSourceUpdates = class {
      constructor(_featureStore, _hasEventListeners, _onChange) {
        this._featureStore = _featureStore;
        this._hasEventListeners = _hasEventListeners;
        this._onChange = _onChange;
        this._dependencyTracker = new DependencyTracker_1.default();
      }
      init(allData, callback, initMetadata) {
        const checkForChanges = this._hasEventListeners();
        const doInit = (oldData) => {
          this._featureStore.init(allData, () => {
            Promise.resolve().then(() => {
              this._dependencyTracker.reset();
              Object.entries(allData).forEach(([namespace, items]) => {
                Object.keys(items || {}).forEach((key) => {
                  const item = items[key];
                  this._dependencyTracker.updateDependenciesFrom(namespace, key, computeDependencies(namespace, item));
                });
              });
              if (checkForChanges) {
                const updatedItems = new NamespacedDataSet_1.default();
                Object.keys(allData).forEach((namespace) => {
                  const oldDataForKind = (oldData === null || oldData === void 0 ? void 0 : oldData[namespace]) || {};
                  const newDataForKind = allData[namespace];
                  const mergedData = Object.assign(Object.assign({}, oldDataForKind), newDataForKind);
                  Object.keys(mergedData).forEach((key) => {
                    this.addIfModified(namespace, key, oldDataForKind && oldDataForKind[key], newDataForKind && newDataForKind[key], updatedItems);
                  });
                });
                this.sendChangeEvents(updatedItems);
              }
            });
            callback === null || callback === void 0 ? void 0 : callback();
          }, initMetadata);
        };
        if (checkForChanges) {
          this._featureStore.all(VersionedDataKinds_1.default.Features, (oldFlags) => {
            this._featureStore.all(VersionedDataKinds_1.default.Segments, (oldSegments) => {
              const oldData = {
                [VersionedDataKinds_1.default.Features.namespace]: oldFlags,
                [VersionedDataKinds_1.default.Segments.namespace]: oldSegments
              };
              doInit(oldData);
            });
          });
        } else {
          doInit();
        }
      }
      upsert(kind, data, callback) {
        const { key } = data;
        const checkForChanges = this._hasEventListeners();
        const doUpsert = (oldItem) => {
          this._featureStore.upsert(kind, data, () => {
            Promise.resolve().then(() => {
              this._dependencyTracker.updateDependenciesFrom(kind.namespace, key, computeDependencies(kind.namespace, data));
              if (checkForChanges) {
                const updatedItems = new NamespacedDataSet_1.default();
                this.addIfModified(kind.namespace, key, oldItem, data, updatedItems);
                this.sendChangeEvents(updatedItems);
              }
            });
            callback === null || callback === void 0 ? void 0 : callback();
          });
        };
        if (checkForChanges) {
          this._featureStore.get(kind, key, doUpsert);
        } else {
          doUpsert();
        }
      }
      addIfModified(namespace, key, oldValue, newValue, toDataSet) {
        if (newValue && oldValue && newValue.version <= oldValue.version) {
          return;
        }
        this._dependencyTracker.updateModifiedItems(toDataSet, namespace, key);
      }
      sendChangeEvents(dataSet) {
        dataSet.enumerate((namespace, key) => {
          if (namespace === VersionedDataKinds_1.default.Features.namespace) {
            this._onChange(key);
          }
        });
      }
    };
    exports2.default = DataSourceUpdates;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/FileLoader.js
var require_FileLoader = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/FileLoader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var FileLoader = class {
      constructor(_filesystem, _paths, _watch, _callback) {
        this._filesystem = _filesystem;
        this._paths = _paths;
        this._watch = _watch;
        this._callback = _callback;
        this._watchers = [];
        this._fileData = {};
        this._fileTimestamps = {};
      }
      /**
       * Load all the files and start watching them if watching is enabled.
       */
      async loadAndWatch() {
        const promises = this._paths.map(async (path3) => {
          const data = await this._filesystem.readFile(path3);
          const timeStamp = await this._filesystem.getFileTimestamp(path3);
          return { data, path: path3, timeStamp };
        });
        const results = await Promise.all(promises);
        results.forEach((res) => {
          this._fileData[res.path] = res.data;
          this._fileTimestamps[res.path] = res.timeStamp;
        });
        this._callback(results);
        if (this._watch) {
          this._paths.forEach((path3) => {
            const watcher = this._filesystem.watch(path3, async (_, updatePath) => {
              const timeStamp = await this._filesystem.getFileTimestamp(updatePath);
              if (timeStamp === this._fileTimestamps[updatePath]) {
                return;
              }
              this._fileTimestamps[updatePath] = timeStamp;
              const data = await this._filesystem.readFile(updatePath);
              this._fileData[updatePath] = data;
              this._debounceCallback();
            });
            this._watchers.push(watcher);
          });
        }
      }
      close() {
        this._watchers.forEach((watcher) => watcher.close());
      }
      _debounceCallback() {
        if (!this._debounceHandle) {
          this._debounceHandle = setTimeout(() => {
            this._debounceHandle = void 0;
            this._callback(Object.entries(this._fileData).reduce((acc, [path3, data]) => {
              acc.push({ path: path3, data });
              return acc;
            }, []));
          }, 10);
        }
      }
    };
    exports2.default = FileLoader;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/fileDataInitilizerFDv2.js
var require_fileDataInitilizerFDv2 = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/fileDataInitilizerFDv2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var serialization_1 = require_serialization();
    var FileLoader_1 = require_FileLoader();
    var FileDataInitializerFDv2 = class {
      constructor(options, platform, logger) {
        this._validateInputs(options, platform);
        this._paths = options.paths;
        this._logger = logger;
        this._filesystem = platform.fileSystem;
        this._yamlParser = options.yamlParser;
      }
      _validateInputs(options, platform) {
        if (!options.paths || options.paths.length === 0) {
          throw new Error("FileDataInitializerFDv2: paths are required");
        }
        if (!platform.fileSystem) {
          throw new Error("FileDataInitializerFDv2: file system is required");
        }
      }
      start(dataCallback, statusCallback) {
        statusCallback(js_sdk_common_1.subsystem.DataSourceState.Initializing);
        const initMetadata = js_sdk_common_1.internal.initMetadataFromHeaders(void 0);
        const payloadProcessor = new js_sdk_common_1.internal.PayloadProcessor({
          flag: (flag) => {
            (0, serialization_1.processFlag)(flag);
            return flag;
          },
          segment: (segment) => {
            (0, serialization_1.processSegment)(segment);
            return segment;
          }
        }, (errorKind, message) => {
          statusCallback(js_sdk_common_1.subsystem.DataSourceState.Interrupted, new js_sdk_common_1.LDPollingError(errorKind, message));
        }, this._logger);
        const adaptor = js_sdk_common_1.internal.FDv1PayloadAdaptor(payloadProcessor);
        this._fileLoader = new FileLoader_1.default(
          this._filesystem,
          this._paths,
          false,
          // autoupdate is always false for initializer
          (results) => {
            var _a;
            try {
              const parsedData = this._processFileData(results);
              payloadProcessor.addPayloadListener((payload) => {
                dataCallback(false, { initMetadata, payload });
              });
              statusCallback(js_sdk_common_1.subsystem.DataSourceState.Valid);
              adaptor.processFullTransfer(parsedData);
              statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed);
            } catch (err) {
              (_a = this._logger) === null || _a === void 0 ? void 0 : _a.error("File contained invalid data", err);
              statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.InvalidData, "Malformed data in file response"));
            }
          }
        );
        this._fileLoader.loadAndWatch().catch((err) => {
          var _a;
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.error("Error loading files", err);
          statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.NetworkError, `Failed to load files: ${err instanceof Error ? err.message : String(err)}`));
        });
      }
      _processFileData(results) {
        const combined = results.reduce((acc, curr) => {
          var _a, _b;
          let parsed;
          if (curr.path.endsWith(".yml") || curr.path.endsWith(".yaml")) {
            if (this._yamlParser) {
              parsed = this._yamlParser(curr.data);
            } else {
              throw new Error(`Attempted to parse yaml file (${curr.path}) without parser.`);
            }
          } else {
            parsed = JSON.parse(curr.data);
          }
          return {
            segments: Object.assign(Object.assign({}, acc.segments), (_a = parsed.segments) !== null && _a !== void 0 ? _a : {}),
            flags: Object.assign(Object.assign({}, acc.flags), (_b = parsed.flags) !== null && _b !== void 0 ? _b : {})
          };
        }, {
          segments: {},
          flags: {}
        });
        return combined;
      }
      stop() {
        if (this._fileLoader) {
          this._fileLoader.close();
        }
      }
    };
    exports2.default = FileDataInitializerFDv2;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/OneShotInitializerFDv2.js
var require_OneShotInitializerFDv2 = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/OneShotInitializerFDv2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var serialization_1 = require_serialization();
    var OneShotInitializerFDv2 = class {
      constructor(_requestor, _logger) {
        this._requestor = _requestor;
        this._logger = _logger;
        this._stopped = false;
      }
      start(dataCallback, statusCallback) {
        var _a;
        statusCallback(js_sdk_common_1.subsystem.DataSourceState.Initializing);
        (_a = this._logger) === null || _a === void 0 ? void 0 : _a.debug("Performing initialization request to LaunchDarkly for feature flag data.");
        this._requestor.requestAllData((err, body, headers, fallbackToFDv1) => {
          var _a2, _b, _c;
          if (this._stopped) {
            return;
          }
          const emitFallback = () => {
            var _a3;
            const status = err === null || err === void 0 ? void 0 : err.status;
            const message = err ? (0, js_sdk_common_1.httpErrorMessage)(err, "initializer", "falling back to FDv1") : `Response header indicates to fallback to FDv1`;
            (_a3 = this._logger) === null || _a3 === void 0 ? void 0 : _a3.warn(message);
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDFlagDeliveryFallbackError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, message, status));
          };
          if (err) {
            if (fallbackToFDv1) {
              emitFallback();
              return;
            }
            const { status } = err;
            const message = (0, js_sdk_common_1.httpErrorMessage)(err, "initializer", "initializer does not retry");
            (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.error(message);
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, message, status));
            return;
          }
          if (!body) {
            if (fallbackToFDv1) {
              emitFallback();
              return;
            }
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.InvalidData, "One shot initializer response missing body."));
            return;
          }
          const initMetadata = js_sdk_common_1.internal.initMetadataFromHeaders(headers);
          try {
            const parsed = JSON.parse(body);
            const payloadProcessor = new js_sdk_common_1.internal.PayloadProcessor({
              flag: (flag) => {
                (0, serialization_1.processFlag)(flag);
                return flag;
              },
              segment: (segment) => {
                (0, serialization_1.processSegment)(segment);
                return segment;
              }
            }, (errorKind, message) => {
              if (fallbackToFDv1) {
                emitFallback();
                return;
              }
              statusCallback(js_sdk_common_1.subsystem.DataSourceState.Interrupted, new js_sdk_common_1.LDPollingError(errorKind, message));
            }, this._logger);
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Valid);
            payloadProcessor.addPayloadListener((payload) => {
              var _a3;
              const data = {
                initMetadata,
                payload
              };
              if (fallbackToFDv1) {
                data.fallbackToFDv1 = true;
                (_a3 = this._logger) === null || _a3 === void 0 ? void 0 : _a3.warn(`Response header indicates to fallback to FDv1`);
              }
              dataCallback(payload.type === "full", data);
            });
            payloadProcessor.processEvents(parsed.events);
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed);
          } catch (parseError) {
            (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error("Response contained invalid data");
            (_c = this._logger) === null || _c === void 0 ? void 0 : _c.debug(`${parseError} - Body follows: ${body}`);
            if (fallbackToFDv1) {
              emitFallback();
              return;
            }
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.InvalidData, "Malformed data in polling response"));
          }
        });
      }
      stop() {
        this._stopped = true;
      }
    };
    exports2.default = OneShotInitializerFDv2;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/async/promisify.js
var require_promisify = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/async/promisify.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function promisify(method) {
      return new Promise((resolve) => {
        method((val) => {
          resolve(val);
        });
      });
    }
    exports2.default = promisify;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/AsyncStoreFacade.js
var require_AsyncStoreFacade = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/AsyncStoreFacade.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var promisify_1 = require_promisify();
    var AsyncStoreFacade = class {
      constructor(store) {
        this._store = store;
      }
      async get(kind, key) {
        return (0, promisify_1.default)((cb) => {
          this._store.get(kind, key, cb);
        });
      }
      async all(kind) {
        return (0, promisify_1.default)((cb) => {
          this._store.all(kind, cb);
        });
      }
      async init(allData, initMetadata) {
        return (0, promisify_1.default)((cb) => {
          this._store.init(allData, cb, initMetadata);
        });
      }
      async delete(kind, key, version) {
        return (0, promisify_1.default)((cb) => {
          this._store.delete(kind, key, version, cb);
        });
      }
      async upsert(kind, data) {
        return (0, promisify_1.default)((cb) => {
          this._store.upsert(kind, data, cb);
        });
      }
      async initialized() {
        return (0, promisify_1.default)((cb) => {
          this._store.initialized(cb);
        });
      }
      close() {
        this._store.close();
      }
      getInitMetadata() {
        var _a, _b;
        return (_b = (_a = this._store).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a);
      }
    };
    exports2.default = AsyncStoreFacade;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/AsyncTransactionalStoreFacade.js
var require_AsyncTransactionalStoreFacade = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/AsyncTransactionalStoreFacade.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var promisify_1 = require_promisify();
    var AsyncTransactionalStoreFacade = class {
      constructor(store) {
        this._store = store;
      }
      async get(kind, key) {
        return (0, promisify_1.default)((cb) => {
          this._store.get(kind, key, cb);
        });
      }
      async all(kind) {
        return (0, promisify_1.default)((cb) => {
          this._store.all(kind, cb);
        });
      }
      async init(allData, initMetadata) {
        return (0, promisify_1.default)((cb) => {
          this._store.init(allData, cb, initMetadata);
        });
      }
      async delete(kind, key, version) {
        return (0, promisify_1.default)((cb) => {
          this._store.delete(kind, key, version, cb);
        });
      }
      async upsert(kind, data) {
        return (0, promisify_1.default)((cb) => {
          this._store.upsert(kind, data, cb);
        });
      }
      async initialized() {
        return (0, promisify_1.default)((cb) => {
          this._store.initialized(cb);
        });
      }
      async applyChanges(basis, data, initMetadata, selector) {
        return (0, promisify_1.default)((cb) => {
          this._store.applyChanges(basis, data, cb, initMetadata, selector);
        });
      }
      close() {
        this._store.close();
      }
      getInitMetadata() {
        var _a, _b;
        return (_b = (_a = this._store).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a);
      }
    };
    exports2.default = AsyncTransactionalStoreFacade;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/cache/TtlCache.js
var require_TtlCache = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/cache/TtlCache.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function isStale(record) {
      return Date.now() > record.expiration;
    }
    var TtlCache = class {
      constructor(_options) {
        this._options = _options;
        this._storage = /* @__PURE__ */ new Map();
        this._checkIntervalHandle = setInterval(() => {
          this._purgeStale();
        }, _options.checkInterval * 1e3);
      }
      /**
       * Get a value from the cache.
       * @param key The key to get a value for.
       * @returns The value for the key, or undefined if the key was not added, or
       * if the value has expired.
       */
      get(key) {
        const record = this._storage.get(key);
        if (record && isStale(record)) {
          this._storage.delete(key);
          return void 0;
        }
        return record === null || record === void 0 ? void 0 : record.value;
      }
      /**
       * Set an item in the cache. It will expire after the TTL specified
       * in the cache configuration.
       * @param key The key for the value.
       * @param value The value to set.
       */
      set(key, value) {
        this._storage.set(key, {
          value,
          expiration: Date.now() + this._options.ttl * 1e3
        });
      }
      /**
       * Delete the item with the specific key. If the item does not exist,
       * then there will be no change to the cache.
       * @param key The key of the value to delete.
       */
      delete(key) {
        this._storage.delete(key);
      }
      /**
       * Clear the items that are in the cache.
       */
      clear() {
        this._storage.clear();
      }
      /**
       * Indicate that you are no longer going to use the cache. The cache will be
       * cleared and it will stop checking for stale items.
       */
      close() {
        this.clear();
        if (this._checkIntervalHandle) {
          clearInterval(this._checkIntervalHandle);
          this._checkIntervalHandle = null;
        }
      }
      _purgeStale() {
        this._storage.forEach((record, key) => {
          if (isStale(record)) {
            this._storage.delete(key);
          }
        });
      }
      /**
       * This is for testing.
       * @internal
       */
      get size() {
        return this._storage.size;
      }
    };
    exports2.default = TtlCache;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/persistentStoreKinds.js
var require_persistentStoreKinds = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/persistentStoreKinds.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.persistentStoreKinds = void 0;
    var serialization_1 = require_serialization();
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    exports2.persistentStoreKinds = {
      segments: {
        namespace: VersionedDataKinds_1.default.Segments.namespace,
        deserialize: (data) => {
          const segment = (0, serialization_1.deserializeSegment)(data);
          if (segment) {
            return {
              version: segment.version,
              item: segment
            };
          }
          return void 0;
        },
        serialize: (data) => {
          const serializedItem = (0, serialization_1.serializeSegment)(data);
          return {
            version: data.version,
            deleted: data.deleted,
            serializedItem
          };
        },
        priority: 0
      },
      features: {
        namespace: VersionedDataKinds_1.default.Features.namespace,
        deserialize: (data) => {
          const flag = (0, serialization_1.deserializeFlag)(data);
          if (flag) {
            return {
              version: flag.version,
              item: flag
            };
          }
          return void 0;
        },
        serialize: (data) => {
          const serializedItem = (0, serialization_1.serializeFlag)(data);
          return {
            version: data.version,
            deleted: data.deleted,
            serializedItem
          };
        },
        priority: 1
      }
    };
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/sortDataSet.js
var require_sortDataSet = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/sortDataSet.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var persistentStoreKinds_1 = require_persistentStoreKinds();
    function getDependencyKeys(flag) {
      if (!flag.prerequisites || !flag.prerequisites.length) {
        return [];
      }
      return flag.prerequisites.map((preReq) => preReq.key);
    }
    function topologicalSort(kind, itemsMap) {
      const sortedItems = [];
      const unvisitedItems = new Set(Object.keys(itemsMap));
      const visit = (key) => {
        if (!unvisitedItems.has(key)) {
          return;
        }
        unvisitedItems.delete(key);
        const item = itemsMap[key];
        if (kind.namespace === "features") {
          getDependencyKeys(item).forEach((prereqKey) => {
            visit(prereqKey);
          });
        }
        sortedItems.push({
          key,
          item: kind.serialize(item)
        });
      };
      while (unvisitedItems.size > 0) {
        const key = unvisitedItems.values().next().value;
        visit(key);
      }
      return sortedItems;
    }
    function sortDataSet(dataMap) {
      const result = [];
      Object.keys(dataMap).forEach((kindNamespace) => {
        const kind = persistentStoreKinds_1.persistentStoreKinds[kindNamespace];
        result.push({ key: kind, item: topologicalSort(kind, dataMap[kindNamespace]) });
      });
      result.sort((i1, i2) => i1.key.priority - i2.key.priority);
      return result;
    }
    exports2.default = sortDataSet;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/UpdateQueue.js
var require_UpdateQueue = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/UpdateQueue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var UpdateQueue = class {
      constructor() {
        this._queue = [];
      }
      enqueue(updateFn, cb) {
        this._queue.push([updateFn, cb]);
        if (this._queue.length === 1) {
          this.executePendingUpdates();
        }
      }
      executePendingUpdates() {
        if (this._queue.length > 0) {
          const [fn, cb] = this._queue[0];
          const newCb = () => {
            this._queue.shift();
            if (this._queue.length > 0) {
              setTimeout(() => this.executePendingUpdates(), 0);
            }
            cb === null || cb === void 0 ? void 0 : cb();
          };
          fn(newCb);
        }
      }
    };
    exports2.default = UpdateQueue;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/PersistentDataStoreWrapper.js
var require_PersistentDataStoreWrapper = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/PersistentDataStoreWrapper.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var TtlCache_1 = require_TtlCache();
    var persistentStoreKinds_1 = require_persistentStoreKinds();
    var sortDataSet_1 = require_sortDataSet();
    var UpdateQueue_1 = require_UpdateQueue();
    function cacheKey(kind, key) {
      return `${kind.namespace}:${key}`;
    }
    function allForKindCacheKey(kind) {
      return `$all:${kind.namespace}`;
    }
    var initializationCheckedKey = "$checkedInit";
    var defaultCheckInterval = 600;
    function itemIfNotDeleted(item) {
      return !item || item.item.deleted ? null : item.item;
    }
    function deletedDescriptor(version) {
      return {
        version,
        item: { version, deleted: true }
      };
    }
    function deserialize(kind, descriptor) {
      if (descriptor.deleted || !descriptor.serializedItem) {
        return deletedDescriptor(descriptor.version);
      }
      const deserializedItem = kind.deserialize(descriptor.serializedItem);
      if (deserializedItem === void 0) {
        return deletedDescriptor(descriptor.version);
      }
      if (deserializedItem.version === 0 || deserializedItem.version === descriptor.version || deserializedItem.item === void 0) {
        return deserializedItem;
      }
      return {
        version: descriptor.version,
        item: deserializedItem.item
      };
    }
    var PersistentDataStoreWrapper = class {
      constructor(_core, ttl) {
        this._core = _core;
        this._isInitialized = false;
        this._queue = new UpdateQueue_1.default();
        if (ttl) {
          this._itemCache = new TtlCache_1.default({
            ttl,
            checkInterval: defaultCheckInterval
          });
          this._allItemsCache = new TtlCache_1.default({
            ttl,
            checkInterval: defaultCheckInterval
          });
        }
      }
      init(allData, callback) {
        this._queue.enqueue((cb) => {
          const afterStoreInit = () => {
            this._isInitialized = true;
            if (this._itemCache) {
              this._itemCache.clear();
              this._allItemsCache.clear();
              Object.keys(allData).forEach((kindNamespace) => {
                const kind = persistentStoreKinds_1.persistentStoreKinds[kindNamespace];
                const items = allData[kindNamespace];
                this._allItemsCache.set(allForKindCacheKey(kind), items);
                Object.keys(items).forEach((key) => {
                  const itemForKey = items[key];
                  const itemDescriptor = {
                    version: itemForKey.version,
                    item: itemForKey
                  };
                  this._itemCache.set(cacheKey(kind, key), itemDescriptor);
                });
              });
            }
            cb();
          };
          this._core.init((0, sortDataSet_1.default)(allData), afterStoreInit);
        }, callback);
      }
      get(kind, key, callback) {
        if (this._itemCache) {
          const item = this._itemCache.get(cacheKey(kind, key));
          if (item) {
            callback(itemIfNotDeleted(item));
            return;
          }
        }
        const persistKind = persistentStoreKinds_1.persistentStoreKinds[kind.namespace];
        this._core.get(persistKind, key, (descriptor) => {
          var _a;
          if (descriptor && descriptor.serializedItem) {
            const value = deserialize(persistKind, descriptor);
            (_a = this._itemCache) === null || _a === void 0 ? void 0 : _a.set(cacheKey(kind, key), value);
            callback(itemIfNotDeleted(value));
            return;
          }
          callback(null);
        });
      }
      initialized(callback) {
        var _a;
        if (this._isInitialized) {
          callback(true);
        } else if ((_a = this._itemCache) === null || _a === void 0 ? void 0 : _a.get(initializationCheckedKey)) {
          callback(false);
        } else {
          this._core.initialized((storeInitialized) => {
            var _a2;
            this._isInitialized = storeInitialized;
            if (!this._isInitialized) {
              (_a2 = this._itemCache) === null || _a2 === void 0 ? void 0 : _a2.set(initializationCheckedKey, true);
            }
            callback(this._isInitialized);
          });
        }
      }
      all(kind, callback) {
        var _a;
        const items = (_a = this._allItemsCache) === null || _a === void 0 ? void 0 : _a.get(allForKindCacheKey(kind));
        if (items) {
          callback(items);
          return;
        }
        const persistKind = persistentStoreKinds_1.persistentStoreKinds[kind.namespace];
        this._core.getAll(persistKind, (storeItems) => {
          var _a2;
          if (!storeItems) {
            callback({});
            return;
          }
          const filteredItems = {};
          storeItems.forEach(({ key, item }) => {
            const deserializedItem = deserialize(persistKind, item);
            const filteredItem = itemIfNotDeleted(deserializedItem);
            if (filteredItem) {
              filteredItems[key] = filteredItem;
            }
          });
          (_a2 = this._allItemsCache) === null || _a2 === void 0 ? void 0 : _a2.set(allForKindCacheKey(kind), filteredItems);
          callback(filteredItems);
        });
      }
      upsert(kind, data, callback) {
        this._queue.enqueue((cb) => {
          if (this._allItemsCache) {
            this._allItemsCache.clear();
          }
          const persistKind = persistentStoreKinds_1.persistentStoreKinds[kind.namespace];
          this._core.upsert(persistKind, data.key, persistKind.serialize(data), (err, updatedDescriptor) => {
            var _a, _b;
            if (!err && updatedDescriptor) {
              if (updatedDescriptor.serializedItem) {
                const value = deserialize(persistKind, updatedDescriptor);
                (_a = this._itemCache) === null || _a === void 0 ? void 0 : _a.set(cacheKey(kind, data.key), value);
              } else if (updatedDescriptor.deleted) {
                (_b = this._itemCache) === null || _b === void 0 ? void 0 : _b.set(data.key, {
                  key: data.key,
                  version: updatedDescriptor.version,
                  deleted: true
                });
              }
            }
            cb();
          });
        }, callback);
      }
      delete(kind, key, version, callback) {
        this.upsert(kind, { key, version, deleted: true }, callback);
      }
      close() {
        var _a, _b;
        (_a = this._itemCache) === null || _a === void 0 ? void 0 : _a.close();
        (_b = this._allItemsCache) === null || _b === void 0 ? void 0 : _b.close();
        this._core.close();
      }
      getDescription() {
        return this._core.getDescription();
      }
    };
    exports2.default = PersistentDataStoreWrapper;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/InMemoryFeatureStore.js
var require_InMemoryFeatureStore = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/InMemoryFeatureStore.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InMemoryFeatureStore = class {
      constructor() {
        this._allData = {};
        this._initCalled = false;
      }
      get(kind, key, callback) {
        const items = this._allData[kind.namespace];
        if (items) {
          if (Object.prototype.hasOwnProperty.call(items, key)) {
            const item = items[key];
            if (item && !item.deleted) {
              return callback === null || callback === void 0 ? void 0 : callback(item);
            }
          }
        }
        return callback === null || callback === void 0 ? void 0 : callback(null);
      }
      all(kind, callback) {
        var _a;
        const result = {};
        const items = (_a = this._allData[kind.namespace]) !== null && _a !== void 0 ? _a : {};
        Object.entries(items).forEach(([key, item]) => {
          if (item && !item.deleted) {
            result[key] = item;
          }
        });
        callback === null || callback === void 0 ? void 0 : callback(result);
      }
      init(allData, callback, initMetadata) {
        this.applyChanges(true, allData, callback, initMetadata);
      }
      delete(kind, key, version, callback) {
        const item = { key, version, deleted: true };
        this.applyChanges(false, {
          [kind.namespace]: {
            [key]: item
          }
        }, callback);
      }
      upsert(kind, data, callback) {
        this.applyChanges(false, {
          [kind.namespace]: {
            [data.key]: data
          }
        }, callback);
      }
      applyChanges(basis, data, callback, initMetadata, selector) {
        if (basis) {
          this._initCalled = true;
          this._allData = data;
          this._initMetadata = initMetadata;
        } else {
          const tempData = {};
          Object.entries(this._allData).forEach(([namespace, items]) => {
            tempData[namespace] = Object.assign({}, items);
          });
          Object.entries(data).forEach(([namespace, items]) => {
            Object.keys(items || {}).forEach((key) => {
              let existingItems = tempData[namespace];
              if (!existingItems) {
                existingItems = {};
                tempData[namespace] = existingItems;
              }
              const item = items[key];
              if (Object.hasOwnProperty.call(existingItems, key)) {
                const old = existingItems[key];
                if (!old || old.version < item.version) {
                  existingItems[key] = Object.assign({ key }, item);
                }
              } else {
                existingItems[key] = Object.assign({ key }, item);
              }
            });
          });
          this._allData = tempData;
        }
        this._selector = selector;
        callback === null || callback === void 0 ? void 0 : callback();
      }
      initialized(callback) {
        return callback === null || callback === void 0 ? void 0 : callback(this._initCalled);
      }
      close() {
      }
      getDescription() {
        return "memory";
      }
      getInitMetaData() {
        return this._initMetadata;
      }
      getSelector() {
        return this._selector;
      }
    };
    exports2.default = InMemoryFeatureStore;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/TransactionalFeatureStore.js
var require_TransactionalFeatureStore = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/TransactionalFeatureStore.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InMemoryFeatureStore_1 = require_InMemoryFeatureStore();
    var TransactionalFeatureStore = class {
      constructor(_nonTransPersistenceStore) {
        this._nonTransPersistenceStore = _nonTransPersistenceStore;
        this._activeStore = this._nonTransPersistenceStore;
        this._memoryStore = new InMemoryFeatureStore_1.default();
      }
      get(kind, key, callback) {
        this._activeStore.get(kind, key, callback);
      }
      all(kind, callback) {
        this._activeStore.all(kind, callback);
      }
      init(allData, callback) {
        this.applyChanges(true, allData, callback);
      }
      delete(kind, key, version, callback) {
        const item = { key, version, deleted: true };
        this.applyChanges(false, {
          [kind.namespace]: {
            [key]: item
          }
        }, callback);
      }
      upsert(kind, data, callback) {
        this.applyChanges(false, {
          [kind.namespace]: {
            [data.key]: data
          }
        }, callback);
      }
      applyChanges(basis, data, callback, initMetadata, selector) {
        this._memoryStore.applyChanges(basis, data, () => {
          if (basis) {
            this._activeStore = this._memoryStore;
            this._nonTransPersistenceStore.init(data, callback);
          } else {
            const params = [];
            Object.entries(data).forEach(([namespace, items]) => {
              Object.keys(items || {}).forEach((key) => {
                params.push({ dataKind: { namespace }, item: Object.assign({ key }, items[key]) });
              });
            });
            params.reduce((previousPromise, nextParams) => previousPromise.then(() => new Promise((resolve) => {
              this._nonTransPersistenceStore.upsert(nextParams.dataKind, nextParams.item, resolve);
            })), Promise.resolve()).then(callback);
          }
        }, initMetadata, selector);
      }
      initialized(callback) {
        this._activeStore.initialized(callback);
      }
      close() {
        this._nonTransPersistenceStore.close();
        this._memoryStore.close();
      }
      getDescription() {
        return "transactional persistent store";
      }
    };
    exports2.default = TransactionalFeatureStore;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/store/index.js
var require_store = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/store/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.reviveFullPayload = exports2.deserializePoll = exports2.TransactionalFeatureStore = exports2.PersistentDataStoreWrapper = exports2.AsyncTransactionalStoreFacade = exports2.AsyncStoreFacade = void 0;
    var AsyncStoreFacade_1 = require_AsyncStoreFacade();
    exports2.AsyncStoreFacade = AsyncStoreFacade_1.default;
    var AsyncTransactionalStoreFacade_1 = require_AsyncTransactionalStoreFacade();
    exports2.AsyncTransactionalStoreFacade = AsyncTransactionalStoreFacade_1.default;
    var PersistentDataStoreWrapper_1 = require_PersistentDataStoreWrapper();
    exports2.PersistentDataStoreWrapper = PersistentDataStoreWrapper_1.default;
    var serialization_1 = require_serialization();
    Object.defineProperty(exports2, "deserializePoll", { enumerable: true, get: function() {
      return serialization_1.deserializePoll;
    } });
    Object.defineProperty(exports2, "reviveFullPayload", { enumerable: true, get: function() {
      return serialization_1.reviveFullPayload;
    } });
    var TransactionalFeatureStore_1 = require_TransactionalFeatureStore();
    exports2.TransactionalFeatureStore = TransactionalFeatureStore_1.default;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/PollingProcessor.js
var require_PollingProcessor = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/PollingProcessor.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var store_1 = require_store();
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var { initMetadataFromHeaders } = js_sdk_common_1.internal;
    var PollingProcessor = class {
      constructor(_requestor, _pollInterval, _featureStore, _logger, _initSuccessHandler = () => {
      }, _errorHandler) {
        this._requestor = _requestor;
        this._pollInterval = _pollInterval;
        this._featureStore = _featureStore;
        this._logger = _logger;
        this._initSuccessHandler = _initSuccessHandler;
        this._errorHandler = _errorHandler;
        this._stopped = false;
      }
      _poll() {
        var _a;
        if (this._stopped) {
          return;
        }
        const reportJsonError = (data) => {
          var _a2, _b, _c;
          (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.error("Polling received invalid data");
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.debug(`Invalid JSON follows: ${data}`);
          (_c = this._errorHandler) === null || _c === void 0 ? void 0 : _c.call(this, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.InvalidData, "Malformed JSON data in polling response"));
        };
        const startTime = Date.now();
        (_a = this._logger) === null || _a === void 0 ? void 0 : _a.debug("Polling LaunchDarkly for feature flag updates");
        this._requestor.requestAllData((err, body, headers) => {
          var _a2, _b, _c, _d;
          const elapsed = Date.now() - startTime;
          const sleepFor = Math.max(this._pollInterval * 1e3 - elapsed, 0);
          (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.debug("Elapsed: %d ms, sleeping for %d ms", elapsed, sleepFor);
          if (err) {
            const { status } = err;
            if (status && !(0, js_sdk_common_1.isHttpRecoverable)(status)) {
              const message = (0, js_sdk_common_1.httpErrorMessage)(err, "polling request");
              (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error(message);
              (_c = this._errorHandler) === null || _c === void 0 ? void 0 : _c.call(this, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, message, status));
              return;
            }
            (_d = this._logger) === null || _d === void 0 ? void 0 : _d.warn((0, js_sdk_common_1.httpErrorMessage)(err, "polling request", "will retry"));
          } else if (body) {
            const parsed = (0, store_1.deserializePoll)(body);
            if (!parsed) {
              reportJsonError(body);
            } else {
              const initData = {
                [VersionedDataKinds_1.default.Features.namespace]: parsed.flags,
                [VersionedDataKinds_1.default.Segments.namespace]: parsed.segments
              };
              this._featureStore.init(initData, () => {
                this._initSuccessHandler();
                this._timeoutHandle = setTimeout(() => {
                  this._poll();
                }, sleepFor);
              }, initMetadataFromHeaders(headers));
              return;
            }
          }
          this._timeoutHandle = setTimeout(() => {
            this._poll();
          }, sleepFor);
        });
      }
      start() {
        this._poll();
      }
      stop() {
        if (this._timeoutHandle) {
          clearTimeout(this._timeoutHandle);
          this._timeoutHandle = void 0;
        }
        this._stopped = true;
      }
      close() {
        this.stop();
      }
    };
    exports2.default = PollingProcessor;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/PollingProcessorFDv2.js
var require_PollingProcessorFDv2 = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/PollingProcessorFDv2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var serialization_1 = require_serialization();
    function selectorAsQueryParams(selector) {
      if (!selector) {
        return [];
      }
      return [
        {
          key: "basis",
          value: selector
        }
      ];
    }
    function processFDv1FlagsAndSegments(payloadProcessor, data) {
      const adaptor = js_sdk_common_1.internal.FDv1PayloadAdaptor(payloadProcessor);
      adaptor.useSelector("FDv1Fallback").processFullTransfer(data);
    }
    var PollingProcessorFDv2 = class {
      /**
       * @param _requestor to fetch flags
       * @param _pollInterval in seconds controlling how frequently polling request is made
       * @param _logger for logging
       * @param _processResponseAsFDv1 defaults to false, but if set to true, this data source will process
       * the response body as FDv1 and convert it into a FDv2 payload.
       */
      constructor(_requestor, _pollInterval = 30, _logger, _processResponseAsFDv1 = false) {
        this._requestor = _requestor;
        this._pollInterval = _pollInterval;
        this._logger = _logger;
        this._processResponseAsFDv1 = _processResponseAsFDv1;
        this._stopped = false;
      }
      _poll(dataCallback, statusCallback, selectorGetter) {
        var _a;
        if (this._stopped) {
          return;
        }
        const startTime = Date.now();
        (_a = this._logger) === null || _a === void 0 ? void 0 : _a.debug("Polling LaunchDarkly for feature flag updates");
        this._requestor.requestAllData((err, body, headers, fallbackToFDv1) => {
          var _a2, _b, _c, _d, _e, _f;
          if (this._stopped) {
            return;
          }
          const elapsed = Date.now() - startTime;
          const sleepFor = Math.max(this._pollInterval * 1e3 - elapsed, 0);
          const emitFallback = () => {
            var _a3;
            const fallbackErr = err instanceof js_sdk_common_1.LDFlagDeliveryFallbackError ? err : new js_sdk_common_1.LDFlagDeliveryFallbackError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, err ? (0, js_sdk_common_1.httpErrorMessage)(err, "polling request", "falling back to FDv1") : `Response header indicates to fallback to FDv1`, err === null || err === void 0 ? void 0 : err.status);
            (_a3 = this._logger) === null || _a3 === void 0 ? void 0 : _a3.warn(fallbackErr.message);
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, fallbackErr);
          };
          (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.debug("Elapsed: %d ms, sleeping for %d ms", elapsed, sleepFor);
          if (err) {
            if (fallbackToFDv1 || err instanceof js_sdk_common_1.LDFlagDeliveryFallbackError) {
              emitFallback();
              return;
            }
            const { status } = err;
            if (status && !(0, js_sdk_common_1.isHttpRecoverable)(status)) {
              const message2 = (0, js_sdk_common_1.httpErrorMessage)(err, "polling request");
              (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error(message2);
              statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, message2, status, false));
              return;
            }
            const message = (0, js_sdk_common_1.httpErrorMessage)(err, "polling request", "will retry");
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Interrupted, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, message, status));
            (_c = this._logger) === null || _c === void 0 ? void 0 : _c.warn(message);
            this._timeoutHandle = setTimeout(() => {
              this._poll(dataCallback, statusCallback, selectorGetter);
            }, sleepFor);
            return;
          }
          const initMetadata = js_sdk_common_1.internal.initMetadataFromHeaders(headers);
          if (body) {
            try {
              const payloadProcessor = new js_sdk_common_1.internal.PayloadProcessor({
                flag: (flag) => {
                  (0, serialization_1.processFlag)(flag);
                  return flag;
                },
                segment: (segment) => {
                  (0, serialization_1.processSegment)(segment);
                  return segment;
                }
              }, (errorKind, message) => {
                if (fallbackToFDv1) {
                  emitFallback();
                  return;
                }
                statusCallback(js_sdk_common_1.subsystem.DataSourceState.Interrupted, new js_sdk_common_1.LDPollingError(errorKind, message));
              }, this._logger);
              payloadProcessor.addPayloadListener((payload) => {
                var _a3;
                const data = {
                  initMetadata,
                  payload
                };
                if (fallbackToFDv1) {
                  data.fallbackToFDv1 = true;
                  (_a3 = this._logger) === null || _a3 === void 0 ? void 0 : _a3.warn(`Response header indicates to fallback to FDv1`);
                }
                dataCallback(payload.type === "full", data);
              });
              (_d = this._logger) === null || _d === void 0 ? void 0 : _d.debug(`Got body: ${body}`);
              if (!this._processResponseAsFDv1) {
                const parsed = JSON.parse(body);
                payloadProcessor.processEvents(parsed.events);
              } else {
                const parsed = JSON.parse(body);
                processFDv1FlagsAndSegments(payloadProcessor, parsed);
              }
              if (fallbackToFDv1) {
                return;
              }
              statusCallback(js_sdk_common_1.subsystem.DataSourceState.Valid);
            } catch (_g) {
              (_e = this._logger) === null || _e === void 0 ? void 0 : _e.error("Response contained invalid data");
              (_f = this._logger) === null || _f === void 0 ? void 0 : _f.debug(`${err} - Body follows: ${body}`);
              if (fallbackToFDv1) {
                emitFallback();
                return;
              }
              statusCallback(js_sdk_common_1.subsystem.DataSourceState.Interrupted, new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.InvalidData, "Malformed data in polling response"));
            }
          } else if (fallbackToFDv1) {
            emitFallback();
            return;
          }
          this._timeoutHandle = setTimeout(() => {
            this._poll(dataCallback, statusCallback, selectorGetter);
          }, sleepFor);
        }, selectorAsQueryParams(selectorGetter === null || selectorGetter === void 0 ? void 0 : selectorGetter()));
      }
      start(dataCallback, statusCallback, selectorGetter) {
        this._statusCallback = statusCallback;
        statusCallback(js_sdk_common_1.subsystem.DataSourceState.Initializing);
        this._poll(dataCallback, statusCallback, selectorGetter);
      }
      stop() {
        var _a;
        if (this._timeoutHandle) {
          clearTimeout(this._timeoutHandle);
          this._timeoutHandle = void 0;
        }
        (_a = this._statusCallback) === null || _a === void 0 ? void 0 : _a.call(this, js_sdk_common_1.subsystem.DataSourceState.Closed);
        this._stopped = true;
        this._statusCallback = void 0;
      }
    };
    exports2.default = PollingProcessorFDv2;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/Requestor.js
var require_Requestor = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/Requestor.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var Requestor = class {
      constructor(config, _requests, baseHeaders, _path = "/sdk/latest-all", _logger, serviceEndpointsOverride) {
        this._requests = _requests;
        this._path = _path;
        this._logger = _logger;
        this._eTagCache = {};
        this._headers = Object.assign({}, baseHeaders);
        this._serviceEndpoints = serviceEndpointsOverride !== null && serviceEndpointsOverride !== void 0 ? serviceEndpointsOverride : config.serviceEndpoints;
        this._timeoutMs = config.timeout * 1e3;
      }
      /**
       * Perform a request and utilize the ETag cache. The ETags are cached in the
       * requestor instance.
       */
      async _requestWithETagCache(requestUrl, options) {
        const cacheEntry = this._eTagCache[requestUrl];
        const cachedETag = cacheEntry === null || cacheEntry === void 0 ? void 0 : cacheEntry.etag;
        const updatedOptions = cachedETag ? Object.assign(Object.assign({}, options), { headers: Object.assign(Object.assign({}, options.headers), { "if-none-match": cachedETag }) }) : options;
        const res = await this._requests.fetch(requestUrl, updatedOptions);
        if (res.status === 304 && cacheEntry) {
          return { res, body: cacheEntry.body };
        }
        const etag = res.headers.get("etag");
        const body = await res.text();
        if (etag) {
          this._eTagCache[requestUrl] = { etag, body };
        }
        return { res, body };
      }
      async requestAllData(cb, queryParams = []) {
        var _a, _b;
        const options = {
          method: "GET",
          headers: this._headers,
          timeout: this._timeoutMs
        };
        const uri = (0, js_sdk_common_1.getPollingUri)(this._serviceEndpoints, this._path, queryParams);
        (_a = this._logger) === null || _a === void 0 ? void 0 : _a.debug(`Requestor making request to uri: ${uri}`);
        try {
          const { res, body } = await this._requestWithETagCache(uri, options);
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.debug(`Requestor got (possibly cached) body: ${JSON.stringify(body)}`);
          const fallbackToFDv1 = res.headers.get(`x-ld-fd-fallback`) === `true`;
          const responseHeaders = Object.fromEntries(res.headers.entries());
          if (res.status !== 200 && res.status !== 304) {
            const err = fallbackToFDv1 ? new js_sdk_common_1.LDFlagDeliveryFallbackError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, `Response header indicates to fallback to FDv1.`, res.status) : new js_sdk_common_1.LDPollingError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, `Unexpected status code: ${res.status}`, res.status);
            return cb(err, void 0, responseHeaders, fallbackToFDv1);
          }
          return cb(void 0, res.status === 304 ? null : body, responseHeaders, fallbackToFDv1);
        } catch (err) {
          return cb(err, void 0, void 0, false);
        }
      }
    };
    exports2.default = Requestor;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/StreamingProcessor.js
var require_StreamingProcessor = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/StreamingProcessor.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var reportJsonError = (type, data, logger, errorHandler) => {
      logger === null || logger === void 0 ? void 0 : logger.error(`Stream received invalid data in "${type}" message`);
      logger === null || logger === void 0 ? void 0 : logger.debug(`Invalid JSON follows: ${data}`);
      errorHandler === null || errorHandler === void 0 ? void 0 : errorHandler(new js_sdk_common_1.LDStreamingError(js_sdk_common_1.DataSourceErrorKind.InvalidData, "Malformed JSON data in event stream"));
    };
    var StreamingProcessor = class {
      constructor(clientContext, streamUriPath, parameters, _listeners, baseHeaders, _diagnosticsManager, _errorHandler, _streamInitialReconnectDelay = 1) {
        this._listeners = _listeners;
        this._diagnosticsManager = _diagnosticsManager;
        this._errorHandler = _errorHandler;
        this._streamInitialReconnectDelay = _streamInitialReconnectDelay;
        const { basicConfiguration, platform } = clientContext;
        const { logger } = basicConfiguration;
        const { requests } = platform;
        this._headers = Object.assign({}, baseHeaders);
        this._logger = logger;
        this._requests = requests;
        this._streamUri = (0, js_sdk_common_1.getStreamingUri)(basicConfiguration.serviceEndpoints, streamUriPath, parameters);
      }
      _logConnectionStarted() {
        this._connectionAttemptStartTime = Date.now();
      }
      _logConnectionResult(success) {
        if (this._connectionAttemptStartTime && this._diagnosticsManager) {
          this._diagnosticsManager.recordStreamInit(this._connectionAttemptStartTime, !success, Date.now() - this._connectionAttemptStartTime);
        }
        this._connectionAttemptStartTime = void 0;
      }
      /**
       * This is a wrapper around the passed errorHandler which adds additional
       * diagnostics and logging logic.
       *
       * @param err The error to be logged and handled.
       * @return boolean whether to retry the connection.
       *
       * @private
       */
      _retryAndHandleError(err) {
        var _a, _b, _c;
        if (!(0, js_sdk_common_1.shouldRetry)(err)) {
          this._logConnectionResult(false);
          (_a = this._errorHandler) === null || _a === void 0 ? void 0 : _a.call(this, new js_sdk_common_1.LDStreamingError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, err.message, err.status));
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error((0, js_sdk_common_1.httpErrorMessage)(err, "streaming request"));
          return false;
        }
        (_c = this._logger) === null || _c === void 0 ? void 0 : _c.warn((0, js_sdk_common_1.httpErrorMessage)(err, "streaming request", "will retry"));
        this._logConnectionResult(false);
        this._logConnectionStarted();
        return true;
      }
      start() {
        this._logConnectionStarted();
        const eventSource = this._requests.createEventSource(this._streamUri, {
          headers: this._headers,
          errorFilter: (error) => this._retryAndHandleError(error),
          initialRetryDelayMillis: 1e3 * this._streamInitialReconnectDelay,
          readTimeoutMillis: 5 * 60 * 1e3,
          retryResetIntervalMillis: 60 * 1e3
        });
        this._eventSource = eventSource;
        eventSource.onclose = () => {
          var _a;
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.info("Closed LaunchDarkly stream connection");
        };
        eventSource.onerror = () => {
        };
        eventSource.onopen = (e) => {
          var _a;
          this._initHeaders = e.headers;
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.info("Opened LaunchDarkly stream connection");
        };
        eventSource.onretrying = (e) => {
          var _a;
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.info(`Will retry stream connection in ${e.delayMillis} milliseconds`);
        };
        this._listeners.forEach(({ deserializeData, processJson }, eventName) => {
          eventSource.addEventListener(eventName, (event) => {
            var _a, _b;
            (_a = this._logger) === null || _a === void 0 ? void 0 : _a.debug(`Received ${eventName} event`);
            if (event === null || event === void 0 ? void 0 : event.data) {
              this._logConnectionResult(true);
              const { data } = event;
              const dataJson = deserializeData(data);
              if (!dataJson) {
                reportJsonError(eventName, data, this._logger, this._errorHandler);
                return;
              }
              processJson(dataJson, this._initHeaders);
            } else {
              (_b = this._errorHandler) === null || _b === void 0 ? void 0 : _b.call(this, new js_sdk_common_1.LDStreamingError(js_sdk_common_1.DataSourceErrorKind.Unknown, "Unexpected payload from event stream"));
            }
          });
        });
      }
      stop() {
        var _a;
        (_a = this._eventSource) === null || _a === void 0 ? void 0 : _a.close();
        this._eventSource = void 0;
      }
      close() {
        this.stop();
      }
    };
    exports2.default = StreamingProcessor;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/StreamingProcessorFDv2.js
var require_StreamingProcessorFDv2 = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/StreamingProcessorFDv2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var serialization_1 = require_serialization();
    var StreamingProcessorFDv2 = class {
      constructor(clientContext, _streamUriPath, _parameters, baseHeaders, _diagnosticsManager, _streamInitialReconnectDelay = 1) {
        this._streamUriPath = _streamUriPath;
        this._parameters = _parameters;
        this._diagnosticsManager = _diagnosticsManager;
        this._streamInitialReconnectDelay = _streamInitialReconnectDelay;
        const { basicConfiguration, platform } = clientContext;
        const { logger, serviceEndpoints } = basicConfiguration;
        const { requests } = platform;
        this._headers = Object.assign({}, baseHeaders);
        this._serviceEndpoints = serviceEndpoints;
        this._logger = logger;
        this._requests = requests;
      }
      _logConnectionAttempt() {
        this._connectionAttemptStartTime = Date.now();
      }
      _logConnectionResult(success) {
        if (this._connectionAttemptStartTime && this._diagnosticsManager) {
          this._diagnosticsManager.recordStreamInit(this._connectionAttemptStartTime, !success, Date.now() - this._connectionAttemptStartTime);
        }
        this._connectionAttemptStartTime = void 0;
      }
      /**
       * This is a wrapper around the passed errorHandler which adds additional
       * diagnostics and logging logic.
       *
       * @param err The error to be logged and handled.
       * @return boolean whether to retry the connection.
       *
       * @private
       */
      _retryAndHandleError(err, statusCallback) {
        var _a, _b, _c;
        if (((_a = err.headers) === null || _a === void 0 ? void 0 : _a[`x-ld-fd-fallback`]) === `true`) {
          const fallbackErr = new js_sdk_common_1.LDFlagDeliveryFallbackError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, `Response header indicates to fallback to FDv1`, err.status);
          statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, fallbackErr);
          return false;
        }
        if (!(0, js_sdk_common_1.shouldRetry)(err)) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error((0, js_sdk_common_1.httpErrorMessage)(err, "streaming request"));
          this._logConnectionResult(false);
          statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, new js_sdk_common_1.LDStreamingError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, err.message, err.status, false));
          return false;
        }
        (_c = this._logger) === null || _c === void 0 ? void 0 : _c.warn((0, js_sdk_common_1.httpErrorMessage)(err, "streaming request", "will retry"));
        this._logConnectionResult(false);
        this._logConnectionAttempt();
        statusCallback(js_sdk_common_1.subsystem.DataSourceState.Interrupted);
        return true;
      }
      start(dataCallback, statusCallback, selectorGetter) {
        var _a;
        this._logConnectionAttempt();
        statusCallback(js_sdk_common_1.subsystem.DataSourceState.Initializing);
        const selector = selectorGetter === null || selectorGetter === void 0 ? void 0 : selectorGetter();
        const params = selector ? [...this._parameters, { key: "basis", value: selector }] : this._parameters;
        const uri = (0, js_sdk_common_1.getStreamingUri)(this._serviceEndpoints, this._streamUriPath, params);
        (_a = this._logger) === null || _a === void 0 ? void 0 : _a.debug(`Streaming processor opening event source to uri: ${uri}`);
        let fallbackRequested = false;
        const eventSource = this._requests.createEventSource(uri, {
          headers: this._headers,
          errorFilter: (error) => this._retryAndHandleError(error, statusCallback),
          initialRetryDelayMillis: 1e3 * this._streamInitialReconnectDelay,
          readTimeoutMillis: 5 * 60 * 1e3,
          retryResetIntervalMillis: 60 * 1e3
        });
        this._eventSource = eventSource;
        const payloadReader = new js_sdk_common_1.internal.PayloadStreamReader(eventSource, {
          flag: (flag) => {
            (0, serialization_1.processFlag)(flag);
            return flag;
          },
          segment: (segment) => {
            (0, serialization_1.processSegment)(segment);
            return segment;
          }
        }, (errorKind, message) => {
          var _a2;
          if (fallbackRequested) {
            const fallbackErr = new js_sdk_common_1.LDFlagDeliveryFallbackError(js_sdk_common_1.DataSourceErrorKind.ErrorResponse, `Response header indicates to fallback to FDv1`);
            (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.warn(fallbackErr.message);
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed, fallbackErr);
          } else {
            statusCallback(js_sdk_common_1.subsystem.DataSourceState.Interrupted, new js_sdk_common_1.LDStreamingError(errorKind, message));
          }
          this.stop();
        }, this._logger);
        payloadReader.addPayloadListener((payload) => {
          var _a2;
          this._logConnectionResult(true);
          const data = {
            initMetadata: this._initMetadata,
            payload
          };
          if (fallbackRequested) {
            data.fallbackToFDv1 = true;
            (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.warn(`Response header indicates to fallback to FDv1`);
          }
          dataCallback(payload.type === "full", data);
          if (fallbackRequested) {
            this.stop();
          }
        });
        eventSource.onclose = () => {
          var _a2;
          (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.info("Closed LaunchDarkly stream connection");
          statusCallback(js_sdk_common_1.subsystem.DataSourceState.Closed);
        };
        eventSource.onerror = () => {
        };
        eventSource.onopen = (e) => {
          var _a2, _b;
          (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.info("Opened LaunchDarkly stream connection");
          this._initMetadata = js_sdk_common_1.internal.initMetadataFromHeaders(e.headers);
          if (((_b = e.headers) === null || _b === void 0 ? void 0 : _b[`x-ld-fd-fallback`]) === `true`) {
            fallbackRequested = true;
          }
          statusCallback(js_sdk_common_1.subsystem.DataSourceState.Valid);
        };
        eventSource.onretrying = (e) => {
          var _a2;
          (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.info(`Will retry stream connection in ${e.delayMillis} milliseconds`);
        };
      }
      stop() {
        var _a;
        (_a = this._eventSource) === null || _a === void 0 ? void 0 : _a.close();
        this._eventSource = void 0;
      }
      close() {
        this.stop();
      }
    };
    exports2.default = StreamingProcessorFDv2;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/TransactionalDataSourceUpdates.js
var require_TransactionalDataSourceUpdates = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/TransactionalDataSourceUpdates.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var DataSourceUpdates_1 = require_DataSourceUpdates();
    var DependencyTracker_1 = require_DependencyTracker();
    var NamespacedDataSet_1 = require_NamespacedDataSet();
    var TransactionalDataSourceUpdates = class {
      constructor(_featureStore, _hasEventListeners, _onChange) {
        this._featureStore = _featureStore;
        this._hasEventListeners = _hasEventListeners;
        this._onChange = _onChange;
        this._dependencyTracker = new DependencyTracker_1.default();
      }
      init(allData, callback, initMetadata) {
        this.applyChanges(true, allData, callback, initMetadata);
      }
      upsert(kind, data, callback) {
        this.applyChanges(
          false,
          // basis is false for upserts
          {
            [kind.namespace]: {
              [data.key]: data
            }
          },
          callback
        );
      }
      applyChanges(basis, data, callback, initMetadata, selector) {
        const checkForChanges = this._hasEventListeners();
        const doApplyChanges = (oldData2) => {
          this._featureStore.applyChanges(basis, data, () => {
            Promise.resolve().then(() => {
              if (basis) {
                this._dependencyTracker.reset();
              }
              Object.entries(data).forEach(([namespace, items]) => {
                Object.keys(items || {}).forEach((key) => {
                  const item = items[key];
                  this._dependencyTracker.updateDependenciesFrom(namespace, key, (0, DataSourceUpdates_1.computeDependencies)(namespace, item));
                });
              });
              if (checkForChanges) {
                const updatedItems = new NamespacedDataSet_1.default();
                Object.keys(data).forEach((namespace) => {
                  const oldDataForKind = oldData2[namespace];
                  const newDataForKind = data[namespace];
                  let iterateData;
                  if (basis) {
                    iterateData = Object.assign(Object.assign({}, oldDataForKind), newDataForKind);
                  } else {
                    iterateData = Object.assign({}, newDataForKind);
                  }
                  Object.keys(iterateData).forEach((key) => {
                    this.addIfModified(namespace, key, oldDataForKind && oldDataForKind[key], newDataForKind && newDataForKind[key], updatedItems);
                  });
                });
                this.sendChangeEvents(updatedItems);
              }
            });
            callback === null || callback === void 0 ? void 0 : callback();
          }, initMetadata, selector);
        };
        let oldData = {};
        if (checkForChanges) {
          this._featureStore.all(VersionedDataKinds_1.default.Features, (oldFlags) => {
            this._featureStore.all(VersionedDataKinds_1.default.Segments, (oldSegments) => {
              oldData = {
                [VersionedDataKinds_1.default.Features.namespace]: oldFlags,
                [VersionedDataKinds_1.default.Segments.namespace]: oldSegments
              };
            });
          });
        }
        doApplyChanges(oldData);
      }
      addIfModified(namespace, key, oldValue, newValue, toDataSet) {
        if (newValue && oldValue && newValue.version <= oldValue.version) {
          return;
        }
        this._dependencyTracker.updateModifiedItems(toDataSet, namespace, key);
      }
      sendChangeEvents(dataSet) {
        dataSet.enumerate((namespace, key) => {
          if (namespace === VersionedDataKinds_1.default.Features.namespace) {
            this._onChange(key);
          }
        });
      }
    };
    exports2.default = TransactionalDataSourceUpdates;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/options/Configuration.js
var require_Configuration = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/options/Configuration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaultValues = exports2.DEFAULT_STREAM_RECONNECT_DELAY = exports2.DEFAULT_POLL_INTERVAL = void 0;
    var js_sdk_common_1 = require_cjs();
    var LDDataSystemOptions_1 = require_LDDataSystemOptions();
    var InMemoryFeatureStore_1 = require_InMemoryFeatureStore();
    var validations = {
      baseUri: js_sdk_common_1.TypeValidators.String,
      streamUri: js_sdk_common_1.TypeValidators.String,
      eventsUri: js_sdk_common_1.TypeValidators.String,
      timeout: js_sdk_common_1.TypeValidators.numberWithMin(1),
      capacity: js_sdk_common_1.TypeValidators.Number,
      logger: js_sdk_common_1.TypeValidators.Object,
      featureStore: js_sdk_common_1.TypeValidators.ObjectOrFactory,
      dataSystem: js_sdk_common_1.TypeValidators.Object,
      bigSegments: js_sdk_common_1.TypeValidators.Object,
      updateProcessor: js_sdk_common_1.TypeValidators.ObjectOrFactory,
      flushInterval: js_sdk_common_1.TypeValidators.Number,
      pollInterval: js_sdk_common_1.TypeValidators.numberWithMin(30),
      proxyOptions: js_sdk_common_1.TypeValidators.Object,
      offline: js_sdk_common_1.TypeValidators.Boolean,
      stream: js_sdk_common_1.TypeValidators.Boolean,
      streamInitialReconnectDelay: js_sdk_common_1.TypeValidators.Number,
      useLdd: js_sdk_common_1.TypeValidators.Boolean,
      sendEvents: js_sdk_common_1.TypeValidators.Boolean,
      allAttributesPrivate: js_sdk_common_1.TypeValidators.Boolean,
      privateAttributes: js_sdk_common_1.TypeValidators.StringArray,
      contextKeysCapacity: js_sdk_common_1.TypeValidators.Number,
      contextKeysFlushInterval: js_sdk_common_1.TypeValidators.Number,
      tlsParams: js_sdk_common_1.TypeValidators.Object,
      diagnosticOptOut: js_sdk_common_1.TypeValidators.Boolean,
      diagnosticRecordingInterval: js_sdk_common_1.TypeValidators.numberWithMin(60),
      wrapperName: js_sdk_common_1.TypeValidators.String,
      wrapperVersion: js_sdk_common_1.TypeValidators.String,
      application: js_sdk_common_1.TypeValidators.Object,
      payloadFilterKey: js_sdk_common_1.TypeValidators.stringMatchingRegex(/^[a-zA-Z0-9](\w|\.|-)*$/),
      hooks: js_sdk_common_1.TypeValidators.createTypeArray("Hook[]", {}),
      enableEventCompression: js_sdk_common_1.TypeValidators.Boolean,
      dataSourceOptionsType: js_sdk_common_1.TypeValidators.String
    };
    exports2.DEFAULT_POLL_INTERVAL = 30;
    exports2.DEFAULT_STREAM_RECONNECT_DELAY = 1;
    var defaultStandardDataSourceOptions = {
      dataSourceOptionsType: "standard",
      streamInitialReconnectDelay: exports2.DEFAULT_STREAM_RECONNECT_DELAY,
      pollInterval: exports2.DEFAULT_POLL_INTERVAL
    };
    var defaultStreamingDataSourceOptions = {
      dataSourceOptionsType: "streamingOnly",
      streamInitialReconnectDelay: exports2.DEFAULT_STREAM_RECONNECT_DELAY
    };
    var defaultPollingDataSourceOptions = {
      dataSourceOptionsType: "pollingOnly",
      pollInterval: exports2.DEFAULT_POLL_INTERVAL
    };
    var defaultDataSystemOptions = {
      dataSource: defaultStandardDataSourceOptions
    };
    exports2.defaultValues = {
      baseUri: "https://sdk.launchdarkly.com",
      streamUri: "https://stream.launchdarkly.com",
      eventsUri: js_sdk_common_1.ServiceEndpoints.DEFAULT_EVENTS,
      stream: true,
      streamInitialReconnectDelay: exports2.DEFAULT_STREAM_RECONNECT_DELAY,
      sendEvents: true,
      timeout: 10,
      capacity: 1e4,
      flushInterval: 5,
      pollInterval: exports2.DEFAULT_POLL_INTERVAL,
      offline: false,
      useLdd: false,
      allAttributesPrivate: false,
      privateAttributes: [],
      contextKeysCapacity: 1e3,
      contextKeysFlushInterval: 300,
      diagnosticOptOut: false,
      diagnosticRecordingInterval: 900,
      featureStore: () => new InMemoryFeatureStore_1.default(),
      enableEventCompression: false,
      dataSystem: defaultDataSystemOptions
    };
    function validateTypesAndNames(options, defaults) {
      const errors = [];
      const validatedOptions = Object.assign({}, defaults);
      Object.keys(options).forEach((optionName) => {
        var _a;
        const optionValue = options[optionName];
        const validator = validations[optionName];
        if (validator) {
          if (!validator.is(optionValue)) {
            if (validator.getType() === "boolean") {
              errors.push(js_sdk_common_1.OptionMessages.wrongOptionTypeBoolean(optionName, typeof optionValue));
              validatedOptions[optionName] = !!optionValue;
            } else if (validator instanceof js_sdk_common_1.NumberWithMinimum && js_sdk_common_1.TypeValidators.Number.is(optionValue)) {
              const { min } = validator;
              errors.push(js_sdk_common_1.OptionMessages.optionBelowMinimum(optionName, optionValue, min));
              validatedOptions[optionName] = min;
            } else {
              errors.push(js_sdk_common_1.OptionMessages.wrongOptionType(optionName, validator.getType(), typeof optionValue));
              validatedOptions[optionName] = exports2.defaultValues[optionName];
            }
          } else {
            validatedOptions[optionName] = optionValue;
          }
        } else {
          (_a = options.logger) === null || _a === void 0 ? void 0 : _a.warn(js_sdk_common_1.OptionMessages.unknownOption(optionName));
        }
      });
      return { errors, validatedOptions };
    }
    function validateEndpoints(options, validatedOptions) {
      var _a, _b, _c;
      const { baseUri, streamUri, eventsUri } = options;
      const streamingEndpointSpecified = streamUri !== void 0 && streamUri !== null;
      const pollingEndpointSpecified = baseUri !== void 0 && baseUri !== null;
      const eventEndpointSpecified = eventsUri !== void 0 && eventsUri !== null;
      if (streamingEndpointSpecified === pollingEndpointSpecified && streamingEndpointSpecified === eventEndpointSpecified) {
        return;
      }
      if (!streamingEndpointSpecified && validatedOptions.stream) {
        (_a = validatedOptions.logger) === null || _a === void 0 ? void 0 : _a.warn(js_sdk_common_1.OptionMessages.partialEndpoint("streamUri"));
      }
      if (!pollingEndpointSpecified) {
        (_b = validatedOptions.logger) === null || _b === void 0 ? void 0 : _b.warn(js_sdk_common_1.OptionMessages.partialEndpoint("baseUri"));
      }
      if (!eventEndpointSpecified && validatedOptions.sendEvents) {
        (_c = validatedOptions.logger) === null || _c === void 0 ? void 0 : _c.warn(js_sdk_common_1.OptionMessages.partialEndpoint("eventsUri"));
      }
    }
    var fdv1FallbackValidations = {
      baseUri: js_sdk_common_1.TypeValidators.String,
      pollInterval: js_sdk_common_1.TypeValidators.numberWithMin(30)
    };
    function validateFDv1FallbackOptions(options) {
      const errors = [];
      const validatedOptions = {};
      Object.keys(options).forEach((optionName) => {
        const optionValue = options[optionName];
        const validator = fdv1FallbackValidations[optionName];
        if (!validator) {
          errors.push(js_sdk_common_1.OptionMessages.unknownOption(`dataSystem.fdv1Fallback.${optionName}`));
          return;
        }
        if (!validator.is(optionValue)) {
          if (validator instanceof js_sdk_common_1.NumberWithMinimum && js_sdk_common_1.TypeValidators.Number.is(optionValue)) {
            const { min } = validator;
            errors.push(js_sdk_common_1.OptionMessages.optionBelowMinimum(`dataSystem.fdv1Fallback.${optionName}`, optionValue, min));
            validatedOptions[optionName] = min;
          } else {
            errors.push(js_sdk_common_1.OptionMessages.wrongOptionType(`dataSystem.fdv1Fallback.${optionName}`, validator.getType(), typeof optionValue));
          }
        } else {
          validatedOptions[optionName] = optionValue;
        }
      });
      return { errors, validatedOptions };
    }
    function validateDataSystemOptions(options) {
      const allErrors = [];
      const validatedOptions = Object.assign({}, options);
      if (options.persistentStore && !js_sdk_common_1.TypeValidators.ObjectOrFactory.is(options.persistentStore)) {
        validatedOptions.persistentStore = void 0;
        allErrors.push(js_sdk_common_1.OptionMessages.wrongOptionType("persistentStore", "LDFeatureStore", typeof options.persistentStore));
      }
      if (options.fdv1Fallback !== void 0 && options.fdv1Fallback !== null) {
        if (js_sdk_common_1.TypeValidators.Object.is(options.fdv1Fallback)) {
          const { errors: fbErrors, validatedOptions: fbValidated } = validateFDv1FallbackOptions(options.fdv1Fallback);
          validatedOptions.fdv1Fallback = fbValidated;
          allErrors.push(...fbErrors);
        } else {
          validatedOptions.fdv1Fallback = void 0;
          allErrors.push(js_sdk_common_1.OptionMessages.wrongOptionType("dataSystem.fdv1Fallback", "FDv1FallbackConfiguration", typeof options.fdv1Fallback));
        }
      }
      if (options.dataSource) {
        let errors;
        let validatedDataSourceOptions;
        if ((0, LDDataSystemOptions_1.isStandardOptions)(options.dataSource)) {
          ({ errors, validatedOptions: validatedDataSourceOptions } = validateTypesAndNames(options.dataSource, defaultStandardDataSourceOptions));
        } else if ((0, LDDataSystemOptions_1.isStreamingOnlyOptions)(options.dataSource)) {
          ({ errors, validatedOptions: validatedDataSourceOptions } = validateTypesAndNames(options.dataSource, defaultStreamingDataSourceOptions));
        } else if ((0, LDDataSystemOptions_1.isPollingOnlyOptions)(options.dataSource)) {
          ({ errors, validatedOptions: validatedDataSourceOptions } = validateTypesAndNames(options.dataSource, defaultPollingDataSourceOptions));
        } else if ((0, LDDataSystemOptions_1.isCustomOptions)(options.dataSource)) {
          validatedDataSourceOptions = options.dataSource;
          errors = [];
        } else {
          validatedDataSourceOptions = defaultStandardDataSourceOptions;
          errors = [
            js_sdk_common_1.OptionMessages.wrongOptionType("dataSource", "DataSourceOptions", typeof options.dataSource)
          ];
        }
        validatedOptions.dataSource = validatedDataSourceOptions;
        allErrors.push(...errors);
      } else {
        validatedOptions.dataSource = defaultStandardDataSourceOptions;
      }
      return { errors: allErrors, validatedOptions };
    }
    var Configuration = class {
      constructor(options = {}, internalOptions = {}) {
        var _a;
        options = options || {};
        this.logger = options.logger;
        const { errors, validatedOptions: topLevelResult } = validateTypesAndNames(options, exports2.defaultValues);
        const validatedOptions = topLevelResult;
        errors.forEach((error) => {
          var _a2;
          (_a2 = this.logger) === null || _a2 === void 0 ? void 0 : _a2.warn(error);
        });
        validateEndpoints(options, validatedOptions);
        if (options.dataSystem) {
          const { errors: dsErrors, validatedOptions: dsResult } = validateDataSystemOptions(options.dataSystem);
          const validatedDSOptions = dsResult;
          this.dataSystem = {
            dataSource: validatedDSOptions.dataSource,
            useLdd: validatedDSOptions.useLdd,
            fdv1Fallback: validatedDSOptions.fdv1Fallback,
            // @ts-ignore
            featureStoreFactory: (clientContext) => {
              if (validatedDSOptions.persistentStore === void 0) {
                return new InMemoryFeatureStore_1.default();
              }
              if (js_sdk_common_1.TypeValidators.Function.is(validatedDSOptions.persistentStore)) {
                return validatedDSOptions.persistentStore(clientContext);
              }
              return validatedDSOptions.persistentStore;
            }
          };
          dsErrors.forEach((error) => {
            var _a2;
            (_a2 = this.logger) === null || _a2 === void 0 ? void 0 : _a2.warn(error);
          });
        }
        this.serviceEndpoints = new js_sdk_common_1.ServiceEndpoints(validatedOptions.streamUri, validatedOptions.baseUri, validatedOptions.eventsUri, internalOptions.analyticsEventPath, internalOptions.diagnosticEventPath, internalOptions.includeAuthorizationHeader, validatedOptions.payloadFilterKey);
        this.eventsCapacity = validatedOptions.capacity;
        this.timeout = validatedOptions.timeout;
        this.bigSegments = validatedOptions.bigSegments;
        this.flushInterval = validatedOptions.flushInterval;
        this.pollInterval = validatedOptions.pollInterval;
        this.proxyOptions = validatedOptions.proxyOptions;
        this.offline = validatedOptions.offline;
        this.stream = validatedOptions.stream;
        this.streamInitialReconnectDelay = validatedOptions.streamInitialReconnectDelay;
        this.useLdd = validatedOptions.useLdd;
        this.sendEvents = validatedOptions.sendEvents;
        this.allAttributesPrivate = validatedOptions.allAttributesPrivate;
        this.privateAttributes = validatedOptions.privateAttributes;
        this.contextKeysCapacity = validatedOptions.contextKeysCapacity;
        this.contextKeysFlushInterval = validatedOptions.contextKeysFlushInterval;
        this.tlsParams = validatedOptions.tlsParams;
        this.diagnosticOptOut = validatedOptions.diagnosticOptOut;
        this.wrapperName = validatedOptions.wrapperName;
        this.payloadFilterKey = validatedOptions.payloadFilterKey;
        this.wrapperVersion = validatedOptions.wrapperVersion;
        this.tags = new js_sdk_common_1.ApplicationTags(validatedOptions);
        this.diagnosticRecordingInterval = validatedOptions.diagnosticRecordingInterval;
        if (js_sdk_common_1.TypeValidators.Function.is(validatedOptions.updateProcessor)) {
          this.updateProcessorFactory = validatedOptions.updateProcessor;
        } else {
          this.updateProcessorFactory = () => validatedOptions.updateProcessor;
        }
        if (js_sdk_common_1.TypeValidators.Function.is(validatedOptions.featureStore)) {
          this.featureStoreFactory = validatedOptions.featureStore;
        } else {
          this.featureStoreFactory = () => validatedOptions.featureStore;
        }
        this.hooks = validatedOptions.hooks;
        this.enableEventCompression = validatedOptions.enableEventCompression;
        this.getImplementationHooks = (_a = internalOptions.getImplementationHooks) !== null && _a !== void 0 ? _a : (() => []);
        this.applicationInfo = validatedOptions.application;
      }
    };
    exports2.default = Configuration;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/diagnostics/createDiagnosticsInitConfig.js
var require_createDiagnosticsInitConfig = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/diagnostics/createDiagnosticsInitConfig.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var api_1 = require_api();
    var Configuration_1 = require_Configuration();
    var createDiagnosticsInitConfig = (config, platform, featureStore) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
      let pollingIntervalMillis;
      if ((_a = config.dataSystem) === null || _a === void 0 ? void 0 : _a.dataSource) {
        if (((0, api_1.isStandardOptions)(config.dataSystem.dataSource) || (0, api_1.isPollingOnlyOptions)(config.dataSystem.dataSource)) && config.dataSystem.dataSource.pollInterval) {
          pollingIntervalMillis = (0, js_sdk_common_1.secondsToMillis)(config.dataSystem.dataSource.pollInterval);
        }
      } else {
        pollingIntervalMillis = (0, js_sdk_common_1.secondsToMillis)(config.pollInterval);
      }
      let reconnectTimeMillis;
      if ((_b = config.dataSystem) === null || _b === void 0 ? void 0 : _b.dataSource) {
        if (((0, api_1.isStandardOptions)(config.dataSystem.dataSource) || (0, api_1.isStreamingOnlyOptions)(config.dataSystem.dataSource)) && config.dataSystem.dataSource.streamInitialReconnectDelay) {
          reconnectTimeMillis = (0, js_sdk_common_1.secondsToMillis)(config.dataSystem.dataSource.streamInitialReconnectDelay);
        }
      } else {
        reconnectTimeMillis = (0, js_sdk_common_1.secondsToMillis)(config.streamInitialReconnectDelay);
      }
      let streamDisabled;
      if ((_c = config.dataSystem) === null || _c === void 0 ? void 0 : _c.dataSource) {
        streamDisabled = (0, api_1.isPollingOnlyOptions)((_d = config.dataSystem) === null || _d === void 0 ? void 0 : _d.dataSource);
      } else {
        streamDisabled = !config.stream;
      }
      return Object.assign(Object.assign(Object.assign({
        customBaseURI: config.serviceEndpoints.polling !== Configuration_1.defaultValues.baseUri,
        customStreamURI: config.serviceEndpoints.streaming !== Configuration_1.defaultValues.streamUri,
        customEventsURI: config.serviceEndpoints.events !== Configuration_1.defaultValues.eventsUri,
        eventsCapacity: config.eventsCapacity,
        // Node doesn't distinguish between these two kinds of timeouts. It is unlikely other web
        // based implementations would be able to either.
        connectTimeoutMillis: (0, js_sdk_common_1.secondsToMillis)(config.timeout),
        socketTimeoutMillis: (0, js_sdk_common_1.secondsToMillis)(config.timeout),
        eventsFlushIntervalMillis: (0, js_sdk_common_1.secondsToMillis)(config.flushInterval)
      }, pollingIntervalMillis ? { pollingIntervalMillis } : null), reconnectTimeMillis ? { reconnectTimeMillis } : null), { contextKeysFlushIntervalMillis: (0, js_sdk_common_1.secondsToMillis)(config.contextKeysFlushInterval), diagnosticRecordingIntervalMillis: (0, js_sdk_common_1.secondsToMillis)(config.diagnosticRecordingInterval), streamingDisabled: streamDisabled, usingRelayDaemon: (_f = (_e = config.dataSystem) === null || _e === void 0 ? void 0 : _e.useLdd) !== null && _f !== void 0 ? _f : config.useLdd, offline: config.offline, allAttributesPrivate: config.allAttributesPrivate, contextKeysCapacity: config.contextKeysCapacity, usingProxy: !!((_h = (_g = platform.requests).usingProxy) === null || _h === void 0 ? void 0 : _h.call(_g)), usingProxyAuthenticator: !!((_k = (_j = platform.requests).usingProxyAuth) === null || _k === void 0 ? void 0 : _k.call(_j)), dataStoreType: (_m = (_l = featureStore.getDescription) === null || _l === void 0 ? void 0 : _l.call(featureStore)) !== null && _m !== void 0 ? _m : "memory" });
    };
    exports2.default = createDiagnosticsInitConfig;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/collection.js
var require_collection = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/collection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.allAsync = exports2.firstSeriesAsync = exports2.allSeriesAsync = exports2.firstResult = void 0;
    function firstResult(collection, operator) {
      let res;
      collection === null || collection === void 0 ? void 0 : collection.some((item, index) => {
        res = operator(item, index);
        return !!res;
      });
      return res;
    }
    exports2.firstResult = firstResult;
    var ITERATION_RECURSION_LIMIT = 50;
    function seriesAsync(collection, check, all, index, cb) {
      if (!collection) {
        cb(false);
        return;
      }
      if (index < (collection === null || collection === void 0 ? void 0 : collection.length)) {
        check(collection[index], index, (res) => {
          if (all) {
            if (!res) {
              cb(false);
              return;
            }
          } else if (res) {
            cb(true);
            return;
          }
          if (collection.length > ITERATION_RECURSION_LIMIT) {
            Promise.resolve().then(() => {
              seriesAsync(collection, check, all, index + 1, cb);
            });
          } else {
            seriesAsync(collection, check, all, index + 1, cb);
          }
        });
      } else {
        cb(all);
      }
    }
    function allSeriesAsync(collection, check, cb) {
      seriesAsync(collection, check, true, 0, cb);
    }
    exports2.allSeriesAsync = allSeriesAsync;
    function firstSeriesAsync(collection, check, cb) {
      seriesAsync(collection, check, false, 0, cb);
    }
    exports2.firstSeriesAsync = firstSeriesAsync;
    function allAsync(collection, check, cb) {
      if (!collection) {
        cb(false);
        return;
      }
      Promise.all(collection === null || collection === void 0 ? void 0 : collection.map((item) => new Promise((resolve) => {
        check(item, resolve);
      }))).then((results) => {
        cb(results.every((success) => success));
      });
    }
    exports2.allAsync = allAsync;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Reasons.js
var require_Reasons = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Reasons.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Reasons = class {
      static prerequisiteFailed(prerequisiteKey) {
        return { kind: "PREREQUISITE_FAILED", prerequisiteKey };
      }
      static ruleMatch(ruleId, ruleIndex) {
        return { kind: "RULE_MATCH", ruleId, ruleIndex };
      }
    };
    Reasons.Fallthrough = { kind: "FALLTHROUGH" };
    Reasons.Off = { kind: "OFF" };
    Reasons.TargetMatch = { kind: "TARGET_MATCH" };
    exports2.default = Reasons;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/EvalResult.js
var require_EvalResult = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/EvalResult.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Reasons_1 = require_Reasons();
    var EvalResult = class _EvalResult {
      constructor(isError, detail, message) {
        this.isError = isError;
        this.detail = detail;
        this.message = message;
        this.isError = isError;
        this.detail = detail;
        this.message = message;
      }
      get isOff() {
        return this.detail.reason.kind === Reasons_1.default.Off.kind;
      }
      setDefault(def) {
        this.detail.value = def;
      }
      static forError(errorKind, message, def) {
        return new _EvalResult(true, {
          value: def !== null && def !== void 0 ? def : null,
          variationIndex: null,
          reason: { kind: "ERROR", errorKind }
        }, message);
      }
      static forSuccess(value, reason, variationIndex) {
        return new _EvalResult(false, {
          value,
          variationIndex: variationIndex === void 0 ? null : variationIndex,
          reason
        });
      }
    };
    exports2.default = EvalResult;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Bucketer.js
var require_Bucketer = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Bucketer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function valueForBucketing(value) {
      if (typeof value === "string") {
        return value;
      }
      if (Number.isInteger(value)) {
        return String(value);
      }
      return null;
    }
    var Bucketer = class {
      constructor(crypto) {
        this._crypto = crypto;
      }
      _sha1Hex(value) {
        const hash = this._crypto.createHash("sha1");
        hash.update(value);
        if (!hash.digest) {
          throw new Error("Platform must implement digest or asyncDigest");
        }
        return hash.digest("hex");
      }
      /**
       * Bucket the provided context using the provided parameters.
       * @param context The context to bucket. Can be a 'multi' kind context, but
       * the bucketing will be by a specific contained kind.
       * @param key A key to use in hashing. Typically the flag key or the segment key.
       * @param attr The attribute to use for bucketing.
       * @param salt A salt to use in hashing.
       * @param kindForRollout The kind to use for bucketing.
       * @param seed A seed to use in hashing.
       *
       * @returns A tuple where the first value is the bucket, and the second value indicates if there
       * was a context for the value specified by `kindForRollout`. If there was not a context for the
       * specified kind, then the `inExperiment` attribute should be `false`.
       */
      bucket(context, key, attr, salt, kindForRollout = "user", seed) {
        const value = context.valueForKind(attr, kindForRollout);
        const bucketableValue = valueForBucketing(value);
        if (bucketableValue === null) {
          const hadContext = context.kinds.indexOf(kindForRollout) >= 0;
          return [0, hadContext];
        }
        const prefix = seed ? Number(seed) : `${key}.${salt}`;
        const hashKey = `${prefix}.${bucketableValue}`;
        const hashVal = parseInt(this._sha1Hex(hashKey).substring(0, 15), 16);
        return [hashVal / 1152921504606847e3, true];
      }
    };
    exports2.default = Bucketer;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/variations.js
var require_variations = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/variations.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBucketBy = exports2.getOffVariation = exports2.getVariation = void 0;
    var js_sdk_common_1 = require_cjs();
    var EvalResult_1 = require_EvalResult();
    var { ErrorKinds } = js_sdk_common_1.internal;
    var KEY_ATTR_REF = new js_sdk_common_1.AttributeReference("key");
    function getVariation(flag, index, reason) {
      if (js_sdk_common_1.TypeValidators.Number.is(index) && index >= 0 && index < flag.variations.length) {
        return EvalResult_1.default.forSuccess(flag.variations[index], reason, index);
      }
      return EvalResult_1.default.forError(ErrorKinds.MalformedFlag, "Invalid variation index in flag");
    }
    exports2.getVariation = getVariation;
    function getOffVariation(flag, reason) {
      if (!js_sdk_common_1.TypeValidators.Number.is(flag.offVariation)) {
        return EvalResult_1.default.forSuccess(null, reason);
      }
      return getVariation(flag, flag.offVariation, reason);
    }
    exports2.getOffVariation = getOffVariation;
    function getBucketBy(isExperiment, bucketByAttributeReference) {
      var _a;
      return (_a = isExperiment ? void 0 : bucketByAttributeReference) !== null && _a !== void 0 ? _a : KEY_ATTR_REF;
    }
    exports2.getBucketBy = getBucketBy;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/evalTargets.js
var require_evalTargets = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/evalTargets.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var collection_1 = require_collection();
    var Reasons_1 = require_Reasons();
    var variations_1 = require_variations();
    function evalTarget(flag, target, context) {
      const contextKey = context.key(target.contextKind);
      if (contextKey !== void 0) {
        const found = target.values.indexOf(contextKey) >= 0;
        if (found) {
          return (0, variations_1.getVariation)(flag, target.variation, Reasons_1.default.TargetMatch);
        }
      }
      return void 0;
    }
    function evalTargets(flag, context) {
      var _a;
      if (!((_a = flag.contextTargets) === null || _a === void 0 ? void 0 : _a.length)) {
        return (0, collection_1.firstResult)(flag.targets, (target) => evalTarget(flag, target, context));
      }
      return (0, collection_1.firstResult)(flag.contextTargets, (target) => {
        if (!target.contextKind || target.contextKind === js_sdk_common_1.Context.UserKind) {
          const userTarget = (flag.targets || []).find((ut) => ut.variation === target.variation);
          if (userTarget) {
            return evalTarget(flag, userTarget, context);
          }
          return void 0;
        }
        return evalTarget(flag, target, context);
      });
    }
    exports2.default = evalTargets;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/makeBigSegmentRef.js
var require_makeBigSegmentRef = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/makeBigSegmentRef.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function makeBigSegmentRef(segment) {
      return `${segment.key}.g${segment.generation}`;
    }
    exports2.default = makeBigSegmentRef;
  }
});

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports2, module2) {
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports2, module2) {
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports2, module2) {
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = exports2.re = [];
    var safeRe = exports2.safeRe = [];
    var src = exports2.src = [];
    var t = exports2.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NUMERICIDENTIFIER]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NUMERICIDENTIFIERLOOSE]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCE", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports2, module2) {
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports2, module2) {
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports2, module2) {
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (!identifier && identifierBase === false) {
              throw new Error("invalid increment argument: identifier is empty");
            }
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports2, module2) {
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse;
  }
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/semver/functions/valid.js"(exports2, module2) {
    var parse = require_parse();
    var valid = (version, options) => {
      const v = parse(version, options);
      return v ? v.version : null;
    };
    module2.exports = valid;
  }
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/semver/functions/clean.js"(exports2, module2) {
    var parse = require_parse();
    var clean = (version, options) => {
      const s = parse(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module2.exports = clean;
  }
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/semver/functions/inc.js"(exports2, module2) {
    var SemVer = require_semver();
    var inc = (version, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version instanceof SemVer ? version.version : version,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module2.exports = inc;
  }
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/semver/functions/diff.js"(exports2, module2) {
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (highVersion.patch) {
          return "patch";
        }
        if (highVersion.minor) {
          return "minor";
        }
        return "major";
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module2.exports = diff;
  }
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/semver/functions/major.js"(exports2, module2) {
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module2.exports = major;
  }
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/semver/functions/minor.js"(exports2, module2) {
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module2.exports = minor;
  }
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/semver/functions/patch.js"(exports2, module2) {
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module2.exports = patch;
  }
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/semver/functions/prerelease.js"(exports2, module2) {
    var parse = require_parse();
    var prerelease = (version, options) => {
      const parsed = parse(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module2.exports = prerelease;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports2, module2) {
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/semver/functions/rcompare.js"(exports2, module2) {
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module2.exports = rcompare;
  }
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/semver/functions/compare-loose.js"(exports2, module2) {
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module2.exports = compareLoose;
  }
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/semver/functions/compare-build.js"(exports2, module2) {
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module2.exports = compareBuild;
  }
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/semver/functions/sort.js"(exports2, module2) {
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module2.exports = sort;
  }
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/semver/functions/rsort.js"(exports2, module2) {
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module2.exports = rsort;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports2, module2) {
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports2, module2) {
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports2, module2) {
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports2, module2) {
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports2, module2) {
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports2, module2) {
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports2, module2) {
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports2, module2) {
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(re[t.COERCE]);
      } else {
        let next;
        while ((next = re[t.COERCERTL].exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          re[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
        }
        re[t.COERCERTL].lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      return parse(`${match[2]}.${match[3] || "0"}.${match[4] || "0"}`, options);
    };
    module2.exports = coerce;
  }
});

// node_modules/yallist/iterator.js
var require_iterator = __commonJS({
  "node_modules/yallist/iterator.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Yallist) {
      Yallist.prototype[Symbol.iterator] = function* () {
        for (let walker = this.head; walker; walker = walker.next) {
          yield walker.value;
        }
      };
    };
  }
});

// node_modules/yallist/yallist.js
var require_yallist = __commonJS({
  "node_modules/yallist/yallist.js"(exports2, module2) {
    "use strict";
    module2.exports = Yallist;
    Yallist.Node = Node;
    Yallist.create = Yallist;
    function Yallist(list) {
      var self = this;
      if (!(self instanceof Yallist)) {
        self = new Yallist();
      }
      self.tail = null;
      self.head = null;
      self.length = 0;
      if (list && typeof list.forEach === "function") {
        list.forEach(function(item) {
          self.push(item);
        });
      } else if (arguments.length > 0) {
        for (var i = 0, l = arguments.length; i < l; i++) {
          self.push(arguments[i]);
        }
      }
      return self;
    }
    Yallist.prototype.removeNode = function(node) {
      if (node.list !== this) {
        throw new Error("removing node which does not belong to this list");
      }
      var next = node.next;
      var prev = node.prev;
      if (next) {
        next.prev = prev;
      }
      if (prev) {
        prev.next = next;
      }
      if (node === this.head) {
        this.head = next;
      }
      if (node === this.tail) {
        this.tail = prev;
      }
      node.list.length--;
      node.next = null;
      node.prev = null;
      node.list = null;
      return next;
    };
    Yallist.prototype.unshiftNode = function(node) {
      if (node === this.head) {
        return;
      }
      if (node.list) {
        node.list.removeNode(node);
      }
      var head = this.head;
      node.list = this;
      node.next = head;
      if (head) {
        head.prev = node;
      }
      this.head = node;
      if (!this.tail) {
        this.tail = node;
      }
      this.length++;
    };
    Yallist.prototype.pushNode = function(node) {
      if (node === this.tail) {
        return;
      }
      if (node.list) {
        node.list.removeNode(node);
      }
      var tail = this.tail;
      node.list = this;
      node.prev = tail;
      if (tail) {
        tail.next = node;
      }
      this.tail = node;
      if (!this.head) {
        this.head = node;
      }
      this.length++;
    };
    Yallist.prototype.push = function() {
      for (var i = 0, l = arguments.length; i < l; i++) {
        push(this, arguments[i]);
      }
      return this.length;
    };
    Yallist.prototype.unshift = function() {
      for (var i = 0, l = arguments.length; i < l; i++) {
        unshift(this, arguments[i]);
      }
      return this.length;
    };
    Yallist.prototype.pop = function() {
      if (!this.tail) {
        return void 0;
      }
      var res = this.tail.value;
      this.tail = this.tail.prev;
      if (this.tail) {
        this.tail.next = null;
      } else {
        this.head = null;
      }
      this.length--;
      return res;
    };
    Yallist.prototype.shift = function() {
      if (!this.head) {
        return void 0;
      }
      var res = this.head.value;
      this.head = this.head.next;
      if (this.head) {
        this.head.prev = null;
      } else {
        this.tail = null;
      }
      this.length--;
      return res;
    };
    Yallist.prototype.forEach = function(fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.head, i = 0; walker !== null; i++) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.next;
      }
    };
    Yallist.prototype.forEachReverse = function(fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.prev;
      }
    };
    Yallist.prototype.get = function(n) {
      for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
        walker = walker.next;
      }
      if (i === n && walker !== null) {
        return walker.value;
      }
    };
    Yallist.prototype.getReverse = function(n) {
      for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
        walker = walker.prev;
      }
      if (i === n && walker !== null) {
        return walker.value;
      }
    };
    Yallist.prototype.map = function(fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.head; walker !== null; ) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.next;
      }
      return res;
    };
    Yallist.prototype.mapReverse = function(fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.tail; walker !== null; ) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.prev;
      }
      return res;
    };
    Yallist.prototype.reduce = function(fn, initial) {
      var acc;
      var walker = this.head;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.head) {
        walker = this.head.next;
        acc = this.head.value;
      } else {
        throw new TypeError("Reduce of empty list with no initial value");
      }
      for (var i = 0; walker !== null; i++) {
        acc = fn(acc, walker.value, i);
        walker = walker.next;
      }
      return acc;
    };
    Yallist.prototype.reduceReverse = function(fn, initial) {
      var acc;
      var walker = this.tail;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.tail) {
        walker = this.tail.prev;
        acc = this.tail.value;
      } else {
        throw new TypeError("Reduce of empty list with no initial value");
      }
      for (var i = this.length - 1; walker !== null; i--) {
        acc = fn(acc, walker.value, i);
        walker = walker.prev;
      }
      return acc;
    };
    Yallist.prototype.toArray = function() {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.head; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.next;
      }
      return arr;
    };
    Yallist.prototype.toArrayReverse = function() {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.tail; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.prev;
      }
      return arr;
    };
    Yallist.prototype.slice = function(from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret;
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
        walker = walker.next;
      }
      for (; walker !== null && i < to; i++, walker = walker.next) {
        ret.push(walker.value);
      }
      return ret;
    };
    Yallist.prototype.sliceReverse = function(from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret;
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
        walker = walker.prev;
      }
      for (; walker !== null && i > from; i--, walker = walker.prev) {
        ret.push(walker.value);
      }
      return ret;
    };
    Yallist.prototype.splice = function(start, deleteCount, ...nodes) {
      if (start > this.length) {
        start = this.length - 1;
      }
      if (start < 0) {
        start = this.length + start;
      }
      for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
        walker = walker.next;
      }
      var ret = [];
      for (var i = 0; walker && i < deleteCount; i++) {
        ret.push(walker.value);
        walker = this.removeNode(walker);
      }
      if (walker === null) {
        walker = this.tail;
      }
      if (walker !== this.head && walker !== this.tail) {
        walker = walker.prev;
      }
      for (var i = 0; i < nodes.length; i++) {
        walker = insert(this, walker, nodes[i]);
      }
      return ret;
    };
    Yallist.prototype.reverse = function() {
      var head = this.head;
      var tail = this.tail;
      for (var walker = head; walker !== null; walker = walker.prev) {
        var p = walker.prev;
        walker.prev = walker.next;
        walker.next = p;
      }
      this.head = tail;
      this.tail = head;
      return this;
    };
    function insert(self, node, value) {
      var inserted = node === self.head ? new Node(value, null, node, self) : new Node(value, node, node.next, self);
      if (inserted.next === null) {
        self.tail = inserted;
      }
      if (inserted.prev === null) {
        self.head = inserted;
      }
      self.length++;
      return inserted;
    }
    function push(self, item) {
      self.tail = new Node(item, self.tail, null, self);
      if (!self.head) {
        self.head = self.tail;
      }
      self.length++;
    }
    function unshift(self, item) {
      self.head = new Node(item, null, self.head, self);
      if (!self.tail) {
        self.tail = self.head;
      }
      self.length++;
    }
    function Node(value, prev, next, list) {
      if (!(this instanceof Node)) {
        return new Node(value, prev, next, list);
      }
      this.list = list;
      this.value = value;
      if (prev) {
        prev.next = this;
        this.prev = prev;
      } else {
        this.prev = null;
      }
      if (next) {
        next.prev = this;
        this.next = next;
      } else {
        this.next = null;
      }
    }
    try {
      require_iterator()(Yallist);
    } catch (er) {
    }
  }
});

// node_modules/lru-cache/index.js
var require_lru_cache = __commonJS({
  "node_modules/lru-cache/index.js"(exports2, module2) {
    "use strict";
    var Yallist = require_yallist();
    var MAX = /* @__PURE__ */ Symbol("max");
    var LENGTH = /* @__PURE__ */ Symbol("length");
    var LENGTH_CALCULATOR = /* @__PURE__ */ Symbol("lengthCalculator");
    var ALLOW_STALE = /* @__PURE__ */ Symbol("allowStale");
    var MAX_AGE = /* @__PURE__ */ Symbol("maxAge");
    var DISPOSE = /* @__PURE__ */ Symbol("dispose");
    var NO_DISPOSE_ON_SET = /* @__PURE__ */ Symbol("noDisposeOnSet");
    var LRU_LIST = /* @__PURE__ */ Symbol("lruList");
    var CACHE = /* @__PURE__ */ Symbol("cache");
    var UPDATE_AGE_ON_GET = /* @__PURE__ */ Symbol("updateAgeOnGet");
    var naiveLength = () => 1;
    var LRUCache = class {
      constructor(options) {
        if (typeof options === "number")
          options = { max: options };
        if (!options)
          options = {};
        if (options.max && (typeof options.max !== "number" || options.max < 0))
          throw new TypeError("max must be a non-negative number");
        const max = this[MAX] = options.max || Infinity;
        const lc = options.length || naiveLength;
        this[LENGTH_CALCULATOR] = typeof lc !== "function" ? naiveLength : lc;
        this[ALLOW_STALE] = options.stale || false;
        if (options.maxAge && typeof options.maxAge !== "number")
          throw new TypeError("maxAge must be a number");
        this[MAX_AGE] = options.maxAge || 0;
        this[DISPOSE] = options.dispose;
        this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
        this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
        this.reset();
      }
      // resize the cache when the max changes.
      set max(mL) {
        if (typeof mL !== "number" || mL < 0)
          throw new TypeError("max must be a non-negative number");
        this[MAX] = mL || Infinity;
        trim(this);
      }
      get max() {
        return this[MAX];
      }
      set allowStale(allowStale) {
        this[ALLOW_STALE] = !!allowStale;
      }
      get allowStale() {
        return this[ALLOW_STALE];
      }
      set maxAge(mA) {
        if (typeof mA !== "number")
          throw new TypeError("maxAge must be a non-negative number");
        this[MAX_AGE] = mA;
        trim(this);
      }
      get maxAge() {
        return this[MAX_AGE];
      }
      // resize the cache when the lengthCalculator changes.
      set lengthCalculator(lC) {
        if (typeof lC !== "function")
          lC = naiveLength;
        if (lC !== this[LENGTH_CALCULATOR]) {
          this[LENGTH_CALCULATOR] = lC;
          this[LENGTH] = 0;
          this[LRU_LIST].forEach((hit) => {
            hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
            this[LENGTH] += hit.length;
          });
        }
        trim(this);
      }
      get lengthCalculator() {
        return this[LENGTH_CALCULATOR];
      }
      get length() {
        return this[LENGTH];
      }
      get itemCount() {
        return this[LRU_LIST].length;
      }
      rforEach(fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].tail; walker !== null; ) {
          const prev = walker.prev;
          forEachStep(this, fn, walker, thisp);
          walker = prev;
        }
      }
      forEach(fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].head; walker !== null; ) {
          const next = walker.next;
          forEachStep(this, fn, walker, thisp);
          walker = next;
        }
      }
      keys() {
        return this[LRU_LIST].toArray().map((k) => k.key);
      }
      values() {
        return this[LRU_LIST].toArray().map((k) => k.value);
      }
      reset() {
        if (this[DISPOSE] && this[LRU_LIST] && this[LRU_LIST].length) {
          this[LRU_LIST].forEach((hit) => this[DISPOSE](hit.key, hit.value));
        }
        this[CACHE] = /* @__PURE__ */ new Map();
        this[LRU_LIST] = new Yallist();
        this[LENGTH] = 0;
      }
      dump() {
        return this[LRU_LIST].map((hit) => isStale(this, hit) ? false : {
          k: hit.key,
          v: hit.value,
          e: hit.now + (hit.maxAge || 0)
        }).toArray().filter((h) => h);
      }
      dumpLru() {
        return this[LRU_LIST];
      }
      set(key, value, maxAge) {
        maxAge = maxAge || this[MAX_AGE];
        if (maxAge && typeof maxAge !== "number")
          throw new TypeError("maxAge must be a number");
        const now = maxAge ? Date.now() : 0;
        const len = this[LENGTH_CALCULATOR](value, key);
        if (this[CACHE].has(key)) {
          if (len > this[MAX]) {
            del(this, this[CACHE].get(key));
            return false;
          }
          const node = this[CACHE].get(key);
          const item = node.value;
          if (this[DISPOSE]) {
            if (!this[NO_DISPOSE_ON_SET])
              this[DISPOSE](key, item.value);
          }
          item.now = now;
          item.maxAge = maxAge;
          item.value = value;
          this[LENGTH] += len - item.length;
          item.length = len;
          this.get(key);
          trim(this);
          return true;
        }
        const hit = new Entry(key, value, len, now, maxAge);
        if (hit.length > this[MAX]) {
          if (this[DISPOSE])
            this[DISPOSE](key, value);
          return false;
        }
        this[LENGTH] += hit.length;
        this[LRU_LIST].unshift(hit);
        this[CACHE].set(key, this[LRU_LIST].head);
        trim(this);
        return true;
      }
      has(key) {
        if (!this[CACHE].has(key)) return false;
        const hit = this[CACHE].get(key).value;
        return !isStale(this, hit);
      }
      get(key) {
        return get(this, key, true);
      }
      peek(key) {
        return get(this, key, false);
      }
      pop() {
        const node = this[LRU_LIST].tail;
        if (!node)
          return null;
        del(this, node);
        return node.value;
      }
      del(key) {
        del(this, this[CACHE].get(key));
      }
      load(arr) {
        this.reset();
        const now = Date.now();
        for (let l = arr.length - 1; l >= 0; l--) {
          const hit = arr[l];
          const expiresAt = hit.e || 0;
          if (expiresAt === 0)
            this.set(hit.k, hit.v);
          else {
            const maxAge = expiresAt - now;
            if (maxAge > 0) {
              this.set(hit.k, hit.v, maxAge);
            }
          }
        }
      }
      prune() {
        this[CACHE].forEach((value, key) => get(this, key, false));
      }
    };
    var get = (self, key, doUse) => {
      const node = self[CACHE].get(key);
      if (node) {
        const hit = node.value;
        if (isStale(self, hit)) {
          del(self, node);
          if (!self[ALLOW_STALE])
            return void 0;
        } else {
          if (doUse) {
            if (self[UPDATE_AGE_ON_GET])
              node.value.now = Date.now();
            self[LRU_LIST].unshiftNode(node);
          }
        }
        return hit.value;
      }
    };
    var isStale = (self, hit) => {
      if (!hit || !hit.maxAge && !self[MAX_AGE])
        return false;
      const diff = Date.now() - hit.now;
      return hit.maxAge ? diff > hit.maxAge : self[MAX_AGE] && diff > self[MAX_AGE];
    };
    var trim = (self) => {
      if (self[LENGTH] > self[MAX]) {
        for (let walker = self[LRU_LIST].tail; self[LENGTH] > self[MAX] && walker !== null; ) {
          const prev = walker.prev;
          del(self, walker);
          walker = prev;
        }
      }
    };
    var del = (self, node) => {
      if (node) {
        const hit = node.value;
        if (self[DISPOSE])
          self[DISPOSE](hit.key, hit.value);
        self[LENGTH] -= hit.length;
        self[CACHE].delete(hit.key);
        self[LRU_LIST].removeNode(node);
      }
    };
    var Entry = class {
      constructor(key, value, length, now, maxAge) {
        this.key = key;
        this.value = value;
        this.length = length;
        this.now = now;
        this.maxAge = maxAge || 0;
      }
    };
    var forEachStep = (self, fn, node, thisp) => {
      let hit = node.value;
      if (isStale(self, hit)) {
        del(self, node);
        if (!self[ALLOW_STALE])
          hit = void 0;
      }
      if (hit)
        fn.call(thisp, hit.value, hit.key, self);
    };
    module2.exports = LRUCache;
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports2, module2) {
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.format();
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().split(/\s+/).join(" ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.format();
      }
      format() {
        this.range = this.set.map((comps) => comps.join(" ").trim()).join("||").trim();
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lru_cache();
    var cache = new LRU({ max: 1e3 });
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports2, module2) {
    var ANY = /* @__PURE__ */ Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports2, module2) {
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  }
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/semver/ranges/to-comparators.js"(exports2, module2) {
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module2.exports = toComparators;
  }
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/semver/ranges/max-satisfying.js"(exports2, module2) {
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module2.exports = maxSatisfying;
  }
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/semver/ranges/min-satisfying.js"(exports2, module2) {
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module2.exports = minSatisfying;
  }
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/semver/ranges/min-version.js"(exports2, module2) {
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module2.exports = minVersion;
  }
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/semver/ranges/valid.js"(exports2, module2) {
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module2.exports = validRange;
  }
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/semver/ranges/outside.js"(exports2, module2) {
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options) => {
      version = new SemVer(version, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module2.exports = outside;
  }
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/semver/ranges/gtr.js"(exports2, module2) {
    var outside = require_outside();
    var gtr = (version, range, options) => outside(version, range, ">", options);
    module2.exports = gtr;
  }
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/semver/ranges/ltr.js"(exports2, module2) {
    var outside = require_outside();
    var ltr = (version, range, options) => outside(version, range, "<", options);
    module2.exports = ltr;
  }
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/semver/ranges/intersects.js"(exports2, module2) {
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module2.exports = intersects;
  }
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/semver/ranges/simplify.js"(exports2, module2) {
    var satisfies = require_satisfies();
    var compare = require_compare();
    module2.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        const included = satisfies(version, range, options);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/semver/ranges/subset.js"(exports2, module2) {
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !satisfies(gt.semver, String(c), options)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !satisfies(lt.semver, String(c), options)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module2.exports = subset;
  }
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/semver/index.js"(exports2, module2) {
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module2.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Operations.js
var require_Operations = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Operations.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var semver_1 = require_semver2();
    var js_sdk_common_1 = require_cjs();
    var VERSION_COMPONENTS_REGEX = /^\d+(\.\d+)?(\.\d+)?/;
    function parseSemver(input) {
      if (js_sdk_common_1.TypeValidators.String.is(input) && !input.startsWith("v")) {
        const parsed = (0, semver_1.parse)(input);
        if (parsed) {
          return parsed;
        }
        const components = VERSION_COMPONENTS_REGEX.exec(input);
        if (components) {
          let transformed = components[0];
          for (let i = 1; i < components.length; i += 1) {
            if (components[i] === void 0) {
              transformed += ".0";
            }
          }
          transformed += input.substring(components[0].length);
          return (0, semver_1.parse)(transformed);
        }
      }
      return null;
    }
    function semVerOperator(fn) {
      return (a, b) => {
        const aVer = parseSemver(a);
        const bVer = parseSemver(b);
        return !!(aVer && bVer && fn(aVer, bVer));
      };
    }
    function makeOperator(fn, validator, converter) {
      return (a, b) => {
        if (validator.is(a) && validator.is(b)) {
          if (converter) {
            return fn(converter(a), converter(b));
          }
          return fn(a, b);
        }
        return false;
      };
    }
    function parseDate(input) {
      if (typeof input === "number") {
        return input;
      }
      return Date.parse(input);
    }
    function safeRegexMatch(pattern, value) {
      try {
        return new RegExp(pattern).test(value);
      } catch (_a) {
        return false;
      }
    }
    var operators = {
      in: (a, b) => a === b,
      endsWith: makeOperator((a, b) => a.endsWith(b), js_sdk_common_1.TypeValidators.String),
      startsWith: makeOperator((a, b) => a.startsWith(b), js_sdk_common_1.TypeValidators.String),
      matches: makeOperator((value, pattern) => safeRegexMatch(pattern, value), js_sdk_common_1.TypeValidators.String),
      contains: makeOperator((a, b) => a.indexOf(b) > -1, js_sdk_common_1.TypeValidators.String),
      lessThan: makeOperator((a, b) => a < b, js_sdk_common_1.TypeValidators.Number),
      lessThanOrEqual: makeOperator((a, b) => a <= b, js_sdk_common_1.TypeValidators.Number),
      greaterThan: makeOperator((a, b) => a > b, js_sdk_common_1.TypeValidators.Number),
      greaterThanOrEqual: makeOperator((a, b) => a >= b, js_sdk_common_1.TypeValidators.Number),
      before: makeOperator((a, b) => a < b, js_sdk_common_1.TypeValidators.Date, parseDate),
      after: makeOperator((a, b) => a > b, js_sdk_common_1.TypeValidators.Date, parseDate),
      semVerEqual: semVerOperator((a, b) => a.compare(b) === 0),
      semVerLessThan: semVerOperator((a, b) => a.compare(b) < 0),
      semVerGreaterThan: semVerOperator((a, b) => a.compare(b) > 0)
    };
    var Operators = class {
      static is(op) {
        return Object.prototype.hasOwnProperty.call(operators, op);
      }
      static execute(op, a, b) {
        var _a, _b;
        return (_b = (_a = operators[op]) === null || _a === void 0 ? void 0 : _a.call(operators, a, b)) !== null && _b !== void 0 ? _b : false;
      }
    };
    exports2.default = Operators;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/matchClause.js
var require_matchClause = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/matchClause.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.maybeNegate = void 0;
    var Operations_1 = require_Operations();
    function maybeNegate(clause, value) {
      if (clause.negate) {
        return !value;
      }
      return value;
    }
    exports2.maybeNegate = maybeNegate;
    function matchAny(op, value, values) {
      return values.some((testValue) => Operations_1.default.execute(op, value, testValue));
    }
    function matchClauseWithoutSegmentOperations(clause, context) {
      const contextValue = context.valueForKind(clause.attributeReference, clause.contextKind);
      if (contextValue === null || contextValue === void 0) {
        return false;
      }
      if (Array.isArray(contextValue)) {
        return maybeNegate(clause, contextValue.some((value) => matchAny(clause.op, value, clause.values)));
      }
      return maybeNegate(clause, matchAny(clause.op, contextValue, clause.values));
    }
    exports2.default = matchClauseWithoutSegmentOperations;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/matchSegmentTargets.js
var require_matchSegmentTargets = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/matchSegmentTargets.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function segmentSearch(context, contextTargets, userTargets, userTargetSet) {
      if (contextTargets) {
        for (let targetIndex = 0; targetIndex < contextTargets.length; targetIndex += 1) {
          const target = contextTargets[targetIndex];
          const key = context.key(target.contextKind);
          if (key) {
            if (target.generated_valuesSet) {
              if (target.generated_valuesSet.has(key)) {
                return true;
              }
            } else if (target.values.includes(key)) {
              return true;
            }
          }
        }
      }
      if (userTargetSet) {
        const userKey = context.key("user");
        if (userKey) {
          if (userTargetSet.has(userKey)) {
            return true;
          }
        }
      } else if (userTargets) {
        const userKey = context.key("user");
        if (userKey) {
          if (userTargets.includes(userKey)) {
            return true;
          }
        }
      }
      return false;
    }
    function matchSegmentTargets(segment, context) {
      const included = segmentSearch(context, segment.includedContexts, segment.included, segment.generated_includedSet);
      if (included) {
        return true;
      }
      const excluded = segmentSearch(context, segment.excludedContexts, segment.excluded, segment.generated_excludedSet);
      if (excluded) {
        return !excluded;
      }
      return void 0;
    }
    exports2.default = matchSegmentTargets;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Evaluator.js
var require_Evaluator = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/evaluation/Evaluator.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var Bucketer_1 = require_Bucketer();
    var collection_1 = require_collection();
    var EvalResult_1 = require_EvalResult();
    var evalTargets_1 = require_evalTargets();
    var makeBigSegmentRef_1 = require_makeBigSegmentRef();
    var matchClause_1 = require_matchClause();
    var matchSegmentTargets_1 = require_matchSegmentTargets();
    var Reasons_1 = require_Reasons();
    var variations_1 = require_variations();
    var { ErrorKinds } = js_sdk_common_1.internal;
    var bigSegmentsStatusPriority = {
      HEALTHY: 1,
      STALE: 2,
      STORE_ERROR: 3,
      NOT_CONFIGURED: 4
    };
    function getBigSegmentsStatusPriority(status) {
      if (status !== void 0) {
        return bigSegmentsStatusPriority[status] || 0;
      }
      return 0;
    }
    function computeUpdatedBigSegmentsStatus(old, latest) {
      if (old !== void 0 && getBigSegmentsStatusPriority(old) > getBigSegmentsStatusPriority(latest)) {
        return old;
      }
      return latest;
    }
    function makeMatch(match) {
      return { error: false, isMatch: match, result: void 0 };
    }
    function makeError(result) {
      return { error: true, isMatch: false, result };
    }
    var Evaluator = class {
      constructor(platform, queries) {
        this._queries = queries;
        this._bucketer = new Bucketer_1.default(platform.crypto);
      }
      async evaluate(flag, context, eventFactory) {
        return new Promise((resolve) => {
          this.evaluateCb(flag, context, resolve, eventFactory);
        });
      }
      evaluateCb(flag, context, cb, eventFactory) {
        const state = {};
        this._evaluateInternal(flag, context, state, [], (res) => {
          if (state.bigSegmentsStatus) {
            res.detail.reason = Object.assign(Object.assign({}, res.detail.reason), { bigSegmentsStatus: state.bigSegmentsStatus });
          }
          if (state.prerequisites) {
            res.prerequisites = state.prerequisites;
          }
          res.events = state.events;
          cb(res);
        }, true, eventFactory);
      }
      /**
       * Evaluate the given flag against the given context. This internal method is entered
       * initially from the external evaluation method, but may be recursively executed during
       * prerequisite evaluations.
       * @param flag The flag to evaluate.
       * @param context The context to evaluate the flag against.
       * @param state The current evaluation state.
       * @param visitedFlags The flags that have been visited during this evaluation.
       * This is not part of the state, because it needs to be forked during prerequisite evaluations.
       * @param topLevel True when this function is being called in the direct evaluation of a flag,
       * versus the evaluataion of a prerequisite.
       */
      _evaluateInternal(flag, context, state, visitedFlags, cb, topLevel, eventFactory) {
        if (!flag.on) {
          cb((0, variations_1.getOffVariation)(flag, Reasons_1.default.Off));
          return;
        }
        this._checkPrerequisites(flag, context, state, visitedFlags, (res) => {
          if (res) {
            cb(res);
            return;
          }
          const targetRes = (0, evalTargets_1.default)(flag, context);
          if (targetRes) {
            cb(targetRes);
            return;
          }
          this._evaluateRules(flag, context, state, (evalRes) => {
            if (evalRes) {
              cb(evalRes);
              return;
            }
            cb(this._variationForContext(flag.fallthrough, context, flag, Reasons_1.default.Fallthrough));
          });
        }, topLevel, eventFactory);
      }
      /**
       * Evaluate the prerequisite flags for the given flag.
       * @param flag The flag to evaluate prerequisites for.
       * @param context The context to evaluate the prerequisites against.
       * @param state used to accumulate prerequisite events.
       * @param visitedFlags Used to detect cycles in prerequisite evaluation.
       * @param cb A callback which is executed when prerequisite checks are complete it is called with
       * an {@link EvalResult} containing an error result or `undefined` if the prerequisites
       * are met.
       * @param topLevel True when this function is being called in the direct evaluation of a flag,
       * versus the evaluataion of a prerequisite.
       */
      _checkPrerequisites(flag, context, state, visitedFlags, cb, topLevel, eventFactory) {
        let prereqResult;
        if (!flag.prerequisites || !flag.prerequisites.length) {
          cb(void 0);
          return;
        }
        (0, collection_1.allSeriesAsync)(flag.prerequisites, (prereq, _index, iterCb) => {
          if (visitedFlags.indexOf(prereq.key) !== -1) {
            prereqResult = EvalResult_1.default.forError(ErrorKinds.MalformedFlag, `Prerequisite of ${flag.key} causing a circular reference. This is probably a temporary condition due to an incomplete update.`);
            iterCb(true);
            return;
          }
          const updatedVisitedFlags = [...visitedFlags, prereq.key];
          this._queries.getFlag(prereq.key, (prereqFlag) => {
            if (!prereqFlag) {
              prereqResult = (0, variations_1.getOffVariation)(flag, Reasons_1.default.prerequisiteFailed(prereq.key));
              iterCb(false);
              return;
            }
            this._evaluateInternal(
              prereqFlag,
              context,
              state,
              updatedVisitedFlags,
              (res) => {
                var _a, _b;
                (_a = state.events) !== null && _a !== void 0 ? _a : state.events = [];
                if (topLevel) {
                  (_b = state.prerequisites) !== null && _b !== void 0 ? _b : state.prerequisites = [];
                  state.prerequisites.push(prereqFlag.key);
                }
                if (eventFactory) {
                  state.events.push(eventFactory.evalEventServer(prereqFlag, context, res.detail, null, flag));
                }
                if (res.isError) {
                  prereqResult = res;
                  return iterCb(false);
                }
                if (res.isOff || res.detail.variationIndex !== prereq.variation) {
                  prereqResult = (0, variations_1.getOffVariation)(flag, Reasons_1.default.prerequisiteFailed(prereq.key));
                  return iterCb(false);
                }
                return iterCb(true);
              },
              false,
              // topLevel false evaluating the prerequisite.
              eventFactory
            );
          });
        }, () => {
          cb(prereqResult);
        });
      }
      /**
       * Evaluate the rules for a flag and return an {@link EvalResult} if there is
       * a match or error.
       * @param flag The flag to evaluate rules for.
       * @param context The context to evaluate the rules against.
       * @param state The current evaluation state.
       * @param cb Callback called when rule evaluation is complete, it will be called with either
       * an {@link EvalResult} or 'undefined'.
       */
      _evaluateRules(flag, context, state, cb) {
        let ruleResult;
        (0, collection_1.firstSeriesAsync)(flag.rules, (rule, ruleIndex, iterCb) => {
          this._ruleMatchContext(flag, rule, ruleIndex, context, state, [], (res) => {
            ruleResult = res;
            iterCb(!!res);
          });
        }, () => cb(ruleResult));
      }
      _clauseMatchContext(clause, context, segmentsVisited, state, cb) {
        let errorResult;
        if (clause.op === "segmentMatch") {
          (0, collection_1.firstSeriesAsync)(clause.values, (value, _index, iterCb) => {
            this._queries.getSegment(value, (segment) => {
              if (segment) {
                if (segmentsVisited.includes(segment.key)) {
                  errorResult = EvalResult_1.default.forError(ErrorKinds.MalformedFlag, `Segment rule referencing segment ${segment.key} caused a circular reference. This is probably a temporary condition due to an incomplete update`);
                  iterCb(true);
                  return;
                }
                const newVisited = [...segmentsVisited, segment === null || segment === void 0 ? void 0 : segment.key];
                this.segmentMatchContext(segment, context, state, newVisited, (res) => {
                  if (res.error) {
                    errorResult = res.result;
                  }
                  iterCb(res.error || res.isMatch);
                });
              } else {
                iterCb(false);
              }
            });
          }, (match) => {
            if (errorResult) {
              return cb(makeError(errorResult));
            }
            return cb(makeMatch((0, matchClause_1.maybeNegate)(clause, match)));
          });
          return;
        }
        if (!clause.attributeReference.isValid) {
          cb(makeError(EvalResult_1.default.forError(ErrorKinds.MalformedFlag, "Invalid attribute reference in clause")));
          return;
        }
        cb(makeMatch((0, matchClause_1.default)(clause, context)));
      }
      /**
       * Evaluate a flag rule against the given context.
       * @param flag The flag the rule is part of.
       * @param rule The rule to match.
       * @param rule The index of the rule.
       * @param context The context to match the rule against.
       * @param cb Called when matching is complete with an {@link EvalResult} or `undefined` if there
       * are no matches or errors.
       */
      _ruleMatchContext(flag, rule, ruleIndex, context, state, segmentsVisited, cb) {
        if (!rule.clauses) {
          cb(void 0);
          return;
        }
        let errorResult;
        (0, collection_1.allSeriesAsync)(rule.clauses, (clause, _index, iterCb) => {
          this._clauseMatchContext(clause, context, segmentsVisited, state, (res) => {
            errorResult = res.result;
            return iterCb(res.error || res.isMatch);
          });
        }, (match) => {
          if (errorResult) {
            return cb(errorResult);
          }
          if (match) {
            return cb(this._variationForContext(rule, context, flag, Reasons_1.default.ruleMatch(rule.id, ruleIndex)));
          }
          return cb(void 0);
        });
      }
      _variationForContext(varOrRollout, context, flag, reason) {
        if (varOrRollout === void 0) {
          return EvalResult_1.default.forError(ErrorKinds.MalformedFlag, "Fallthrough variation undefined");
        }
        if (varOrRollout.variation !== void 0) {
          return (0, variations_1.getVariation)(flag, varOrRollout.variation, reason);
        }
        if (varOrRollout.rollout) {
          const { rollout } = varOrRollout;
          const { variations } = rollout;
          const isExperiment = rollout.kind === "experiment";
          if (variations && variations.length) {
            const bucketBy = (0, variations_1.getBucketBy)(isExperiment, rollout.bucketByAttributeReference);
            if (!bucketBy.isValid) {
              return EvalResult_1.default.forError(ErrorKinds.MalformedFlag, "Invalid attribute reference for bucketBy in rollout");
            }
            const [bucket, hadContext] = this._bucketer.bucket(context, flag.key, bucketBy, flag.salt || "", rollout.contextKind, rollout.seed);
            const updatedReason = Object.assign({}, reason);
            let sum = 0;
            for (let i = 0; i < variations.length; i += 1) {
              const variate = variations[i];
              sum += variate.weight / 1e5;
              if (bucket < sum) {
                if (isExperiment && hadContext && !variate.untracked) {
                  updatedReason.inExperiment = true;
                }
                return (0, variations_1.getVariation)(flag, variate.variation, updatedReason);
              }
            }
            const lastVariate = variations[variations.length - 1];
            if (isExperiment && !lastVariate.untracked) {
              updatedReason.inExperiment = true;
            }
            return (0, variations_1.getVariation)(flag, lastVariate.variation, updatedReason);
          }
        }
        return EvalResult_1.default.forError(ErrorKinds.MalformedFlag, "Variation/rollout object with no variation or rollout");
      }
      segmentRuleMatchContext(segment, rule, context, state, segmentsVisited, cb) {
        let errorResult;
        (0, collection_1.allSeriesAsync)(rule.clauses, (clause, _index, iterCb) => {
          this._clauseMatchContext(clause, context, segmentsVisited, state, (res) => {
            errorResult = res.result;
            iterCb(res.error || res.isMatch);
          });
        }, (match) => {
          if (errorResult) {
            return cb(makeError(errorResult));
          }
          if (match) {
            if (rule.weight === void 0) {
              return cb(makeMatch(match));
            }
            const bucketBy = (0, variations_1.getBucketBy)(false, rule.bucketByAttributeReference);
            if (!bucketBy.isValid) {
              return cb(makeError(EvalResult_1.default.forError(ErrorKinds.MalformedFlag, "Invalid attribute reference in clause")));
            }
            const [bucket] = this._bucketer.bucket(context, segment.key, bucketBy, segment.salt || "", rule.rolloutContextKind);
            return cb(makeMatch(bucket < rule.weight / 1e5));
          }
          return cb(makeMatch(false));
        });
      }
      simpleSegmentMatchContext(segment, context, state, segmentsVisited, cb) {
        if (!segment.unbounded) {
          const includeExclude = (0, matchSegmentTargets_1.default)(segment, context);
          if (includeExclude !== void 0) {
            cb(makeMatch(includeExclude));
            return;
          }
        }
        let evalResult;
        (0, collection_1.firstSeriesAsync)(segment.rules, (rule, _index, iterCb) => {
          this.segmentRuleMatchContext(segment, rule, context, state, segmentsVisited, (res) => {
            evalResult = res.result;
            return iterCb(res.error || res.isMatch);
          });
        }, (matched) => {
          if (evalResult) {
            return cb(makeError(evalResult));
          }
          return cb(makeMatch(matched));
        });
      }
      segmentMatchContext(segment, context, state, segmentsVisited, cb) {
        if (!segment.unbounded) {
          this.simpleSegmentMatchContext(segment, context, state, segmentsVisited, cb);
          return;
        }
        const bigSegmentKind = segment.unboundedContextKind || "user";
        const keyForBigSegment = context.key(bigSegmentKind);
        if (!keyForBigSegment) {
          cb(makeMatch(false));
          return;
        }
        if (!segment.generation) {
          state.bigSegmentsStatus = computeUpdatedBigSegmentsStatus(state.bigSegmentsStatus, "NOT_CONFIGURED");
          cb(makeMatch(false));
          return;
        }
        if (state.bigSegmentsMembership && state.bigSegmentsMembership[keyForBigSegment]) {
          this.bigSegmentMatchContext(state.bigSegmentsMembership[keyForBigSegment], segment, context, state).then(cb);
          return;
        }
        this._queries.getBigSegmentsMembership(keyForBigSegment).then((result) => {
          state.bigSegmentsMembership = state.bigSegmentsMembership || {};
          if (result) {
            const [membership, status] = result;
            state.bigSegmentsMembership[keyForBigSegment] = membership;
            state.bigSegmentsStatus = computeUpdatedBigSegmentsStatus(state.bigSegmentsStatus, status);
          } else {
            state.bigSegmentsStatus = computeUpdatedBigSegmentsStatus(state.bigSegmentsStatus, "NOT_CONFIGURED");
          }
          this.bigSegmentMatchContext(state.bigSegmentsMembership[keyForBigSegment], segment, context, state).then(cb);
        });
      }
      bigSegmentMatchContext(membership, segment, context, state) {
        const segmentRef = (0, makeBigSegmentRef_1.default)(segment);
        const included = membership === null || membership === void 0 ? void 0 : membership[segmentRef];
        return new Promise((resolve) => {
          if (included !== void 0 && included !== null) {
            resolve(makeMatch(included));
            return;
          }
          this.simpleSegmentMatchContext(segment, context, state, [], resolve);
        });
      }
    };
    exports2.default = Evaluator;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/events/ContextDeduplicator.js
var require_ContextDeduplicator = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/events/ContextDeduplicator.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var LruCache_1 = require_LruCache();
    var ContextDeduplicator = class {
      constructor(options) {
        this._contextKeysCache = new LruCache_1.default({ max: options.contextKeysCapacity });
        this.flushInterval = options.contextKeysFlushInterval;
      }
      processContext(context) {
        const { canonicalKey } = context;
        const inCache = this._contextKeysCache.get(canonicalKey);
        this._contextKeysCache.set(canonicalKey, true);
        return !inCache;
      }
      flush() {
        this._contextKeysCache.clear();
      }
    };
    exports2.default = ContextDeduplicator;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/events/isExperiment.js
var require_isExperiment = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/events/isExperiment.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function isExperiment(flag, reason) {
      if (reason) {
        if (reason.inExperiment) {
          return true;
        }
        switch (reason.kind) {
          case "RULE_MATCH": {
            const index = reason.ruleIndex;
            if (index !== void 0) {
              const rules = flag.rules || [];
              return index >= 0 && index < rules.length && !!rules[index].trackEvents;
            }
            break;
          }
          case "FALLTHROUGH":
            return !!flag.trackEventsFallthrough;
          default:
        }
      }
      return false;
    }
    exports2.default = isExperiment;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/events/EventFactory.js
var require_EventFactory = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/events/EventFactory.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var isExperiment_1 = require_isExperiment();
    var EventFactory = class extends js_sdk_common_1.internal.EventFactoryBase {
      evalEventServer(flag, context, detail, defaultVal, prereqOfFlag) {
        var _a;
        const addExperimentData = (0, isExperiment_1.default)(flag, detail.reason);
        return super.evalEvent({
          addExperimentData,
          context,
          debugEventsUntilDate: flag.debugEventsUntilDate,
          defaultVal,
          excludeFromSummaries: flag.excludeFromSummaries,
          flagKey: flag.key,
          prereqOfFlagKey: prereqOfFlag === null || prereqOfFlag === void 0 ? void 0 : prereqOfFlag.key,
          reason: detail.reason,
          samplingRatio: flag.samplingRatio,
          trackEvents: flag.trackEvents || addExperimentData,
          value: detail.value,
          variation: (_a = detail.variationIndex) !== null && _a !== void 0 ? _a : void 0,
          version: flag.version
        });
      }
    };
    exports2.default = EventFactory;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/FlagsStateBuilder.js
var require_FlagsStateBuilder = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/FlagsStateBuilder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var FlagsStateBuilder = class {
      constructor(_valid, _withReasons) {
        this._valid = _valid;
        this._withReasons = _withReasons;
        this._flagValues = {};
        this._flagMetadata = {};
      }
      addFlag(flag, value, variation, reason, trackEvents, trackReason, detailsOnlyIfTracked, prerequisites) {
        this._flagValues[flag.key] = value;
        const meta = {};
        if (variation !== void 0) {
          meta.variation = variation;
        }
        const omitDetails = detailsOnlyIfTracked && !trackEvents && !trackReason && flag.debugEventsUntilDate === void 0;
        if (!omitDetails) {
          meta.version = flag.version;
        }
        if (reason && (trackReason || this._withReasons && !omitDetails)) {
          meta.reason = reason;
        }
        if (trackEvents) {
          meta.trackEvents = true;
        }
        if (trackReason) {
          meta.trackReason = true;
        }
        if (flag.debugEventsUntilDate !== void 0) {
          meta.debugEventsUntilDate = flag.debugEventsUntilDate;
        }
        if (prerequisites && prerequisites.length) {
          meta.prerequisites = prerequisites;
        }
        this._flagMetadata[flag.key] = meta;
      }
      build() {
        return {
          valid: this._valid,
          allValues: () => this._flagValues,
          getFlagValue: (key) => this._flagValues[key],
          getFlagReason: (key) => {
            var _a;
            return (_a = this._flagMetadata[key] ? this._flagMetadata[key].reason : null) !== null && _a !== void 0 ? _a : null;
          },
          toJSON: () => Object.assign(Object.assign({}, this._flagValues), { $flagsState: this._flagMetadata, $valid: this._valid })
        };
      }
    };
    exports2.default = FlagsStateBuilder;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/hooks/HookRunner.js
var require_HookRunner = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/hooks/HookRunner.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var BEFORE_EVALUATION_STAGE_NAME = "beforeEvaluation";
    var AFTER_EVALUATION_STAGE_NAME = "afterEvaluation";
    var UNKNOWN_HOOK_NAME = "unknown hook";
    var HookRunner = class {
      constructor(_logger, hooks) {
        this._logger = _logger;
        this._hooks = [];
        this._hooks.push(...hooks);
      }
      async withEvaluationSeries(key, context, defaultValue, methodName, method, environmentId) {
        if (this._hooks.length === 0) {
          return method();
        }
        return this.withEvaluationSeriesExtraDetail(key, context, defaultValue, methodName, async () => {
          const detail = await method();
          return { detail };
        }, environmentId).then(({ detail }) => detail);
      }
      /**
       * This function allows extra information to be returned with the detail for situations like
       * migrations where a tracker is returned with the detail.
       */
      async withEvaluationSeriesExtraDetail(key, context, defaultValue, methodName, method, environmentId) {
        if (this._hooks.length === 0) {
          return method();
        }
        const { hooks, hookContext } = this._prepareHooks(key, context, defaultValue, methodName, environmentId);
        const hookData = this._executeBeforeEvaluation(hooks, hookContext);
        const result = await method();
        this._executeAfterEvaluation(hooks, hookContext, hookData, result.detail);
        return result;
      }
      _tryExecuteStage(method, hookName, stage) {
        var _a;
        try {
          return stage();
        } catch (err) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.error(`An error was encountered in "${method}" of the "${hookName}" hook: ${err}`);
          return {};
        }
      }
      _hookName(hook) {
        var _a, _b;
        try {
          return (_a = hook === null || hook === void 0 ? void 0 : hook.getMetadata().name) !== null && _a !== void 0 ? _a : UNKNOWN_HOOK_NAME;
        } catch (_c) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error(`Exception thrown getting metadata for hook. Unable to get hook name.`);
          return UNKNOWN_HOOK_NAME;
        }
      }
      _executeAfterEvaluation(hooks, hookContext, updatedData, result) {
        var _a;
        for (let hookIndex = hooks.length - 1; hookIndex >= 0; hookIndex -= 1) {
          const hook = hooks[hookIndex];
          const data = (_a = updatedData[hookIndex]) !== null && _a !== void 0 ? _a : {};
          this._tryExecuteStage(AFTER_EVALUATION_STAGE_NAME, this._hookName(hook), () => {
            var _a2, _b;
            return (_b = (_a2 = hook === null || hook === void 0 ? void 0 : hook.afterEvaluation) === null || _a2 === void 0 ? void 0 : _a2.call(hook, hookContext, data, result)) !== null && _b !== void 0 ? _b : {};
          });
        }
      }
      _executeBeforeEvaluation(hooks, hookContext) {
        return hooks.map((hook) => this._tryExecuteStage(BEFORE_EVALUATION_STAGE_NAME, this._hookName(hook), () => {
          var _a, _b;
          return (_b = (_a = hook === null || hook === void 0 ? void 0 : hook.beforeEvaluation) === null || _a === void 0 ? void 0 : _a.call(hook, hookContext, {})) !== null && _b !== void 0 ? _b : {};
        }));
      }
      _prepareHooks(key, context, defaultValue, methodName, environmentId) {
        const hooks = [...this._hooks];
        const hookContext = {
          flagKey: key,
          context,
          defaultValue,
          method: methodName,
          environmentId
        };
        return { hooks, hookContext };
      }
      addHook(hook) {
        this._hooks.push(hook);
      }
    };
    exports2.default = HookRunner;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/MigrationOpEventConversion.js
var require_MigrationOpEventConversion = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/MigrationOpEventConversion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    function isOperation(value) {
      if (!js_sdk_common_1.TypeValidators.String.is(value)) {
        return false;
      }
      return value === "read" || value === "write";
    }
    function isLatencyMeasurement(value) {
      return value.key === "latency_ms";
    }
    function isErrorMeasurement(value) {
      return value.key === "error";
    }
    function isInvokedMeasurement(value) {
      return value.key === "invoked";
    }
    function isConsistencyMeasurement(value) {
      return value.key === "consistent";
    }
    function areValidNumbers(values) {
      const oldValue = values.old;
      const newValue = values.new;
      if (oldValue !== void 0 && !js_sdk_common_1.TypeValidators.Number.is(oldValue)) {
        return false;
      }
      if (newValue !== void 0 && !js_sdk_common_1.TypeValidators.Number.is(newValue)) {
        return false;
      }
      return true;
    }
    function areValidBooleans(values) {
      const oldValue = values.old;
      const newValue = values.new;
      if (oldValue !== void 0 && !js_sdk_common_1.TypeValidators.Boolean.is(oldValue)) {
        return false;
      }
      if (newValue !== void 0 && !js_sdk_common_1.TypeValidators.Boolean.is(newValue)) {
        return false;
      }
      return true;
    }
    function validateMeasurement(measurement) {
      if (!js_sdk_common_1.TypeValidators.String.is(measurement.key) || measurement.key === "") {
        return void 0;
      }
      if (isLatencyMeasurement(measurement)) {
        if (!js_sdk_common_1.TypeValidators.Object.is(measurement.values)) {
          return void 0;
        }
        if (!areValidNumbers(measurement.values)) {
          return void 0;
        }
        return {
          key: measurement.key,
          values: {
            old: measurement.values.old,
            new: measurement.values.new
          }
        };
      }
      if (isErrorMeasurement(measurement)) {
        if (!js_sdk_common_1.TypeValidators.Object.is(measurement.values)) {
          return void 0;
        }
        if (!areValidBooleans(measurement.values)) {
          return void 0;
        }
        return {
          key: measurement.key,
          values: {
            old: measurement.values.old,
            new: measurement.values.new
          }
        };
      }
      if (isConsistencyMeasurement(measurement)) {
        if (!js_sdk_common_1.TypeValidators.Boolean.is(measurement.value) || !js_sdk_common_1.TypeValidators.Number.is(measurement.samplingRatio)) {
          return void 0;
        }
        return {
          key: measurement.key,
          value: measurement.value,
          samplingRatio: measurement.samplingRatio
        };
      }
      if (isInvokedMeasurement(measurement)) {
        if (!js_sdk_common_1.TypeValidators.Object.is(measurement.values)) {
          return void 0;
        }
        if (!areValidBooleans(measurement.values)) {
          return void 0;
        }
        return {
          key: measurement.key,
          values: {
            old: measurement.values.old,
            new: measurement.values.new
          }
        };
      }
      return void 0;
    }
    function validateMeasurements(measurements) {
      return measurements.map(validateMeasurement).filter((value) => value !== void 0);
    }
    function validateEvaluation(evaluation) {
      if (!js_sdk_common_1.TypeValidators.String.is(evaluation.key) || evaluation.key === "") {
        return void 0;
      }
      if (!js_sdk_common_1.TypeValidators.Object.is(evaluation.reason)) {
        return void 0;
      }
      if (!js_sdk_common_1.TypeValidators.String.is(evaluation.reason.kind) || evaluation.reason.kind === "") {
        return void 0;
      }
      const validated = {
        key: evaluation.key,
        value: evaluation.value,
        default: evaluation.default,
        reason: {
          kind: evaluation.reason.kind
        }
      };
      const inReason = evaluation.reason;
      const outReason = validated.reason;
      if (js_sdk_common_1.TypeValidators.String.is(inReason.errorKind)) {
        outReason.errorKind = inReason.errorKind;
      }
      if (js_sdk_common_1.TypeValidators.String.is(inReason.ruleId)) {
        outReason.ruleId = inReason.ruleId;
      }
      if (js_sdk_common_1.TypeValidators.String.is(inReason.prerequisiteKey)) {
        outReason.prerequisiteKey = inReason.prerequisiteKey;
      }
      if (js_sdk_common_1.TypeValidators.Boolean.is(inReason.inExperiment)) {
        outReason.inExperiment = inReason.inExperiment;
      }
      if (js_sdk_common_1.TypeValidators.Number.is(inReason.ruleIndex)) {
        outReason.ruleIndex = inReason.ruleIndex;
      }
      if (js_sdk_common_1.TypeValidators.String.is(inReason.bigSegmentsStatus)) {
        outReason.bigSegmentsStatus = inReason.bigSegmentsStatus;
      }
      if (evaluation.variation !== void 0 && js_sdk_common_1.TypeValidators.Number.is(evaluation.variation)) {
        validated.variation = evaluation.variation;
      }
      if (evaluation.version !== void 0 && js_sdk_common_1.TypeValidators.Number.is(evaluation.version)) {
        validated.version = evaluation.version;
      }
      return validated;
    }
    function MigrationOpEventToInputEvent(inEvent) {
      var _a;
      if (inEvent.kind !== "migration_op") {
        return void 0;
      }
      if (!isOperation(inEvent.operation)) {
        return void 0;
      }
      if (!js_sdk_common_1.TypeValidators.Number.is(inEvent.creationDate)) {
        return void 0;
      }
      const contextKeysOrContext = {};
      if (js_sdk_common_1.TypeValidators.Object.is(inEvent.context)) {
        const context = js_sdk_common_1.Context.fromLDContext(inEvent.context);
        if (context.valid) {
          contextKeysOrContext.context = context;
        }
      } else if (js_sdk_common_1.TypeValidators.Object.is(inEvent.contextKeys)) {
        if (Object.keys(inEvent.contextKeys).every((key) => js_sdk_common_1.TypeValidators.Kind.is(key)) && Object.values(inEvent.contextKeys).every((value) => js_sdk_common_1.TypeValidators.String.is(value) && value !== "")) {
          contextKeysOrContext.contextKeys = Object.assign({}, inEvent.contextKeys);
        }
      }
      if (!contextKeysOrContext.context && !contextKeysOrContext.contextKeys) {
        return void 0;
      }
      const samplingRatio = (_a = inEvent.samplingRatio) !== null && _a !== void 0 ? _a : 1;
      if (!js_sdk_common_1.TypeValidators.Number.is(samplingRatio)) {
        return void 0;
      }
      const evaluation = validateEvaluation(inEvent.evaluation);
      if (!evaluation) {
        return void 0;
      }
      return Object.assign(Object.assign({ kind: inEvent.kind, operation: inEvent.operation, creationDate: inEvent.creationDate }, contextKeysOrContext), {
        measurements: validateMeasurements(inEvent.measurements),
        evaluation,
        samplingRatio
      });
    }
    exports2.default = MigrationOpEventToInputEvent;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/MigrationOpTracker.js
var require_MigrationOpTracker = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/MigrationOpTracker.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var data_1 = require_data();
    function isPopulated(data) {
      return !Number.isNaN(data);
    }
    var MigrationOpTracker = class {
      constructor(_flagKey, _context, _defaultStage, _stage, _reason, _checkRatio, _variation, _version, _samplingRatio, _logger) {
        this._flagKey = _flagKey;
        this._context = _context;
        this._defaultStage = _defaultStage;
        this._stage = _stage;
        this._reason = _reason;
        this._checkRatio = _checkRatio;
        this._variation = _variation;
        this._version = _version;
        this._samplingRatio = _samplingRatio;
        this._logger = _logger;
        this._errors = {
          old: false,
          new: false
        };
        this._wasInvoked = {
          old: false,
          new: false
        };
        this._consistencyCheck = data_1.LDConsistencyCheck.NotChecked;
        this._latencyMeasurement = {
          old: NaN,
          new: NaN
        };
      }
      op(op) {
        this._operation = op;
      }
      error(origin) {
        this._errors[origin] = true;
      }
      consistency(check) {
        var _a, _b;
        if (js_sdk_common_1.internal.shouldSample((_a = this._checkRatio) !== null && _a !== void 0 ? _a : 1)) {
          try {
            const res = check();
            this._consistencyCheck = res ? data_1.LDConsistencyCheck.Consistent : data_1.LDConsistencyCheck.Inconsistent;
          } catch (exception) {
            (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error(`Exception when executing consistency check function for migration '${this._flagKey}' the consistency check will not be included in the generated migration op event. Exception: ${exception}`);
          }
        }
      }
      latency(origin, value) {
        this._latencyMeasurement[origin] = value;
      }
      invoked(origin) {
        this._wasInvoked[origin] = true;
      }
      createEvent() {
        var _a, _b, _c, _d, _e;
        if (!js_sdk_common_1.TypeValidators.String.is(this._flagKey) || this._flagKey === "") {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.error("The flag key for a migration operation must be a non-empty string.");
          return void 0;
        }
        if (!this._operation) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error('The operation must be set using "op" before an event can be created.');
          return void 0;
        }
        if (!js_sdk_common_1.Context.fromLDContext(this._context).valid) {
          (_c = this._logger) === null || _c === void 0 ? void 0 : _c.error("The migration was not done against a valid context and cannot generate an event.");
          return void 0;
        }
        if (!this._wasInvoked.old && !this._wasInvoked.new) {
          (_d = this._logger) === null || _d === void 0 ? void 0 : _d.error('The migration invoked neither the "old" or "new" implementation andan event cannot be generated');
          return void 0;
        }
        if (!this._measurementConsistencyCheck()) {
          return void 0;
        }
        const measurements = [];
        this._populateInvoked(measurements);
        this._populateConsistency(measurements);
        this._populateLatency(measurements);
        this._populateErrors(measurements);
        return {
          kind: "migration_op",
          operation: this._operation,
          creationDate: Date.now(),
          context: this._context,
          evaluation: {
            key: this._flagKey,
            value: this._stage,
            default: this._defaultStage,
            reason: this._reason,
            variation: this._variation,
            version: this._version
          },
          measurements,
          samplingRatio: (_e = this._samplingRatio) !== null && _e !== void 0 ? _e : 1
        };
      }
      _logTag() {
        return `For migration ${this._operation}-${this._flagKey}:`;
      }
      _latencyConsistencyMessage(origin) {
        return `Latency measurement for "${origin}", but "${origin}" was not invoked.`;
      }
      _errorConsistencyMessage(origin) {
        return `Error occurred for "${origin}", but "${origin}" was not invoked.`;
      }
      _consistencyCheckConsistencyMessage(origin) {
        return `Consistency check was done, but "${origin}" was not invoked.Both "old" and "new" must be invoked to do a consistency check.`;
      }
      _checkOriginEventConsistency(origin) {
        var _a, _b, _c;
        if (this._wasInvoked[origin]) {
          return true;
        }
        if (!Number.isNaN(this._latencyMeasurement[origin])) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.error(`${this._logTag()} ${this._latencyConsistencyMessage(origin)}`);
          return false;
        }
        if (this._errors[origin]) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error(`${this._logTag()} ${this._errorConsistencyMessage(origin)}`);
          return false;
        }
        if (this._consistencyCheck !== data_1.LDConsistencyCheck.NotChecked) {
          (_c = this._logger) === null || _c === void 0 ? void 0 : _c.error(`${this._logTag()} ${this._consistencyCheckConsistencyMessage(origin)}`);
          return false;
        }
        return true;
      }
      /**
       * Check that the latency, error, consistency and invoked measurements are self-consistent.
       */
      _measurementConsistencyCheck() {
        return this._checkOriginEventConsistency("old") && this._checkOriginEventConsistency("new");
      }
      _populateInvoked(measurements) {
        var _a;
        const measurement = {
          key: "invoked",
          values: {}
        };
        if (!this._wasInvoked.old && !this._wasInvoked.new) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.error("Migration op completed without executing any origins (old/new).");
        }
        if (this._wasInvoked.old) {
          measurement.values.old = true;
        }
        if (this._wasInvoked.new) {
          measurement.values.new = true;
        }
        measurements.push(measurement);
      }
      _populateConsistency(measurements) {
        var _a;
        if (this._consistencyCheck !== void 0 && this._consistencyCheck !== data_1.LDConsistencyCheck.NotChecked) {
          measurements.push({
            key: "consistent",
            value: this._consistencyCheck === data_1.LDConsistencyCheck.Consistent,
            samplingRatio: (_a = this._checkRatio) !== null && _a !== void 0 ? _a : 1
          });
        }
      }
      _populateErrors(measurements) {
        if (this._errors.new || this._errors.old) {
          const measurement = {
            key: "error",
            values: {}
          };
          if (this._errors.new) {
            measurement.values.new = true;
          }
          if (this._errors.old) {
            measurement.values.old = true;
          }
          measurements.push(measurement);
        }
      }
      _populateLatency(measurements) {
        const newIsPopulated = isPopulated(this._latencyMeasurement.new);
        const oldIsPopulated = isPopulated(this._latencyMeasurement.old);
        if (newIsPopulated || oldIsPopulated) {
          const values = {};
          if (newIsPopulated) {
            values.new = this._latencyMeasurement.new;
          }
          if (oldIsPopulated) {
            values.old = this._latencyMeasurement.old;
          }
          measurements.push({
            key: "latency_ms",
            values
          });
        }
      }
    };
    exports2.default = MigrationOpTracker;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/LDClientImpl.js
var require_LDClientImpl = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/LDClientImpl.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var api_1 = require_api();
    var LDDataSystemOptions_1 = require_LDDataSystemOptions();
    var BigSegmentsManager_1 = require_BigSegmentsManager();
    var createPluginEnvironmentMetadata_1 = require_createPluginEnvironmentMetadata();
    var createPayloadListenerFDv2_1 = require_createPayloadListenerFDv2();
    var createStreamListeners_1 = require_createStreamListeners();
    var DataSourceUpdates_1 = require_DataSourceUpdates();
    var fileDataInitilizerFDv2_1 = require_fileDataInitilizerFDv2();
    var OneShotInitializerFDv2_1 = require_OneShotInitializerFDv2();
    var PollingProcessor_1 = require_PollingProcessor();
    var PollingProcessorFDv2_1 = require_PollingProcessorFDv2();
    var Requestor_1 = require_Requestor();
    var StreamingProcessor_1 = require_StreamingProcessor();
    var StreamingProcessorFDv2_1 = require_StreamingProcessorFDv2();
    var TransactionalDataSourceUpdates_1 = require_TransactionalDataSourceUpdates();
    var createDiagnosticsInitConfig_1 = require_createDiagnosticsInitConfig();
    var collection_1 = require_collection();
    var EvalResult_1 = require_EvalResult();
    var Evaluator_1 = require_Evaluator();
    var ContextDeduplicator_1 = require_ContextDeduplicator();
    var EventFactory_1 = require_EventFactory();
    var isExperiment_1 = require_isExperiment();
    var FlagsStateBuilder_1 = require_FlagsStateBuilder();
    var HookRunner_1 = require_HookRunner();
    var MigrationOpEventConversion_1 = require_MigrationOpEventConversion();
    var MigrationOpTracker_1 = require_MigrationOpTracker();
    var Configuration_1 = require_Configuration();
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var { ClientMessages, ErrorKinds, NullEventProcessor } = js_sdk_common_1.internal;
    var InitState;
    (function(InitState2) {
      InitState2[InitState2["Initializing"] = 0] = "Initializing";
      InitState2[InitState2["Initialized"] = 1] = "Initialized";
      InitState2[InitState2["Failed"] = 2] = "Failed";
    })(InitState || (InitState = {}));
    var HIGH_TIMEOUT_THRESHOLD = 60;
    var BOOL_VARIATION_METHOD_NAME = "LDClient.boolVariation";
    var NUMBER_VARIATION_METHOD_NAME = "LDClient.numberVariation";
    var STRING_VARIATION_METHOD_NAME = "LDClient.stringVariation";
    var JSON_VARIATION_METHOD_NAME = "LDClient.jsonVariation";
    var VARIATION_METHOD_NAME = "LDClient.variation";
    var MIGRATION_VARIATION_METHOD_NAME = "LDClient.migrationVariation";
    var BOOL_VARIATION_DETAIL_METHOD_NAME = "LDClient.boolVariationDetail";
    var NUMBER_VARIATION_DETAIL_METHOD_NAME = "LDClient.numberVariationDetail";
    var STRING_VARIATION_DETAIL_METHOD_NAME = "LDClient.stringVariationDetail";
    var JSON_VARIATION_DETAIL_METHOD_NAME = "LDClient.jsonVariationDetail";
    var VARIATION_METHOD_DETAIL_NAME = "LDClient.variationDetail";
    function constructFDv1(sdkKey, platform, config, callbacks, initSuccess, dataSourceErrorHandler, hooks, instanceId) {
      var _a, _b, _c, _d, _e;
      const { onUpdate, hasEventListeners } = callbacks;
      const hookRunner = new HookRunner_1.default(config.logger, hooks);
      if (!sdkKey && !config.offline) {
        throw new Error("You must configure the client with an SDK key");
      }
      const { logger } = config;
      const baseHeaders = (0, js_sdk_common_1.defaultHeaders)(sdkKey, platform.info, config.tags, true, "user-agent", instanceId);
      const clientContext = new js_sdk_common_1.ClientContext(sdkKey, config, platform);
      const featureStore = config.featureStoreFactory(clientContext);
      const dataSourceUpdates = new DataSourceUpdates_1.default(featureStore, hasEventListeners, onUpdate);
      let diagnosticsManager;
      if (config.sendEvents && !config.offline && !config.diagnosticOptOut) {
        diagnosticsManager = new js_sdk_common_1.internal.DiagnosticsManager(sdkKey, platform, (0, createDiagnosticsInitConfig_1.default)(config, platform, featureStore));
      }
      let eventProcessor;
      if (!config.sendEvents || config.offline) {
        eventProcessor = new NullEventProcessor();
      } else {
        eventProcessor = new js_sdk_common_1.internal.EventProcessor(config, clientContext, baseHeaders, new ContextDeduplicator_1.default(config), diagnosticsManager);
      }
      const bigSegmentsManager = new BigSegmentsManager_1.default((_b = (_a = config.bigSegments) === null || _a === void 0 ? void 0 : _a.store) === null || _b === void 0 ? void 0 : _b.call(_a, clientContext), (_c = config.bigSegments) !== null && _c !== void 0 ? _c : {}, config.logger, platform.crypto);
      const queries = {
        getFlag(key, cb) {
          featureStore.get(VersionedDataKinds_1.default.Features, key, (item) => cb(item));
        },
        getSegment(key, cb) {
          featureStore.get(VersionedDataKinds_1.default.Segments, key, (item) => cb(item));
        },
        getBigSegmentsMembership(userKey) {
          return bigSegmentsManager.getUserMembership(userKey);
        }
      };
      const evaluator = new Evaluator_1.default(platform, queries);
      const listeners = (0, createStreamListeners_1.createStreamListeners)(dataSourceUpdates, logger, {
        put: initSuccess
      });
      const makeDefaultProcessor = () => config.stream ? new StreamingProcessor_1.default(clientContext, "/all", [], listeners, baseHeaders, diagnosticsManager, dataSourceErrorHandler, config.streamInitialReconnectDelay) : new PollingProcessor_1.default(new Requestor_1.default(config, platform.requests, baseHeaders), config.pollInterval, dataSourceUpdates, config.logger, initSuccess, dataSourceErrorHandler);
      let updateProcessor;
      if (!(config.offline || config.useLdd)) {
        updateProcessor = (_e = (_d = config.updateProcessorFactory) === null || _d === void 0 ? void 0 : _d.call(config, clientContext, dataSourceUpdates, initSuccess, dataSourceErrorHandler)) !== null && _e !== void 0 ? _e : makeDefaultProcessor();
      }
      return {
        config,
        logger,
        evaluator,
        featureStore,
        updateProcessor,
        eventProcessor,
        bigSegmentsManager,
        hookRunner,
        onError: callbacks.onError,
        onFailed: callbacks.onFailed,
        onReady: callbacks.onReady
      };
    }
    function constructFDv2(sdkKey, platform, config, callbacks, initSuccess, hooks, instanceId) {
      var _a, _b, _c, _d, _e, _f;
      const { onUpdate, hasEventListeners } = callbacks;
      const hookRunner = new HookRunner_1.default(config.logger, hooks);
      if (!sdkKey && !config.offline) {
        throw new Error("You must configure the client with an SDK key");
      }
      const { logger } = config;
      const baseHeaders = (0, js_sdk_common_1.defaultHeaders)(sdkKey, platform.info, config.tags, true, "user-agent", instanceId);
      const clientContext = new js_sdk_common_1.ClientContext(sdkKey, config, platform);
      const dataSystem = config.dataSystem;
      const featureStore = dataSystem.featureStoreFactory(clientContext);
      const dataSourceUpdates = new TransactionalDataSourceUpdates_1.default(featureStore, hasEventListeners, onUpdate);
      let diagnosticsManager;
      if (config.sendEvents && !config.offline && !config.diagnosticOptOut) {
        diagnosticsManager = new js_sdk_common_1.internal.DiagnosticsManager(sdkKey, platform, (0, createDiagnosticsInitConfig_1.default)(config, platform, featureStore));
      }
      let eventProcessor;
      if (!config.sendEvents || config.offline) {
        eventProcessor = new NullEventProcessor();
      } else {
        eventProcessor = new js_sdk_common_1.internal.EventProcessor(config, clientContext, baseHeaders, new ContextDeduplicator_1.default(config), diagnosticsManager);
      }
      const bigSegmentsManager = new BigSegmentsManager_1.default((_b = (_a = config.bigSegments) === null || _a === void 0 ? void 0 : _a.store) === null || _b === void 0 ? void 0 : _b.call(_a, clientContext), (_c = config.bigSegments) !== null && _c !== void 0 ? _c : {}, config.logger, platform.crypto);
      const queries = {
        getFlag(key, cb) {
          featureStore.get(VersionedDataKinds_1.default.Features, key, (item) => cb(item));
        },
        getSegment(key, cb) {
          featureStore.get(VersionedDataKinds_1.default.Segments, key, (item) => cb(item));
        },
        getBigSegmentsMembership(userKey) {
          return bigSegmentsManager.getUserMembership(userKey);
        }
      };
      const evaluator = new Evaluator_1.default(platform, queries);
      let dataSource;
      let payloadListener;
      if (!(config.offline || config.dataSystem.useLdd)) {
        const initializers = [];
        const synchronizers = [];
        const fdv1FallbackSynchronizers = [];
        if ((0, LDDataSystemOptions_1.isCustomOptions)(dataSystem.dataSource)) {
          const { initializers: initializerConfigs = [], synchronizers: synchronizerConfigs = [] } = dataSystem.dataSource;
          initializerConfigs.forEach((initializerConfig) => {
            switch (initializerConfig.type) {
              case "file": {
                initializers.push(() => new fileDataInitilizerFDv2_1.default(initializerConfig, platform, config.logger));
                break;
              }
              case "polling": {
                initializers.push(() => new OneShotInitializerFDv2_1.default(new Requestor_1.default(config, platform.requests, baseHeaders, "/sdk/poll", config.logger), config.logger));
                break;
              }
              default: {
                throw new Error("Unsupported initializer type");
              }
            }
          });
          synchronizerConfigs.forEach((synchronizerConfig) => {
            switch (synchronizerConfig.type) {
              case "streaming": {
                const { streamInitialReconnectDelay = Configuration_1.DEFAULT_STREAM_RECONNECT_DELAY } = synchronizerConfig;
                synchronizers.push(() => new StreamingProcessorFDv2_1.default(clientContext, "/sdk/stream", [], baseHeaders, diagnosticsManager, streamInitialReconnectDelay));
                break;
              }
              case "polling": {
                const { pollInterval = Configuration_1.DEFAULT_POLL_INTERVAL } = synchronizerConfig;
                synchronizers.push(() => new PollingProcessorFDv2_1.default(new Requestor_1.default(config, platform.requests, baseHeaders, "/sdk/poll", config.logger), pollInterval, config.logger));
                break;
              }
              default: {
                throw new Error("Unsupported synchronizer type");
              }
            }
          });
        } else {
          if ((0, LDDataSystemOptions_1.isStandardOptions)(dataSystem.dataSource)) {
            initializers.push(() => new OneShotInitializerFDv2_1.default(new Requestor_1.default(config, platform.requests, baseHeaders, "/sdk/poll", config.logger), config.logger));
          }
          if ((0, LDDataSystemOptions_1.isStandardOptions)(dataSystem.dataSource) || (0, LDDataSystemOptions_1.isStreamingOnlyOptions)(dataSystem.dataSource)) {
            const reconnectDelay = dataSystem.dataSource.streamInitialReconnectDelay;
            synchronizers.push(() => new StreamingProcessorFDv2_1.default(clientContext, "/sdk/stream", [], baseHeaders, diagnosticsManager, reconnectDelay));
          }
          let pollingInterval = Configuration_1.DEFAULT_POLL_INTERVAL;
          if ((0, LDDataSystemOptions_1.isStandardOptions)(dataSystem.dataSource) || (0, LDDataSystemOptions_1.isPollingOnlyOptions)(dataSystem.dataSource)) {
            pollingInterval = (_d = dataSystem.dataSource.pollInterval) !== null && _d !== void 0 ? _d : Configuration_1.DEFAULT_POLL_INTERVAL;
            synchronizers.push(() => new PollingProcessorFDv2_1.default(new Requestor_1.default(config, platform.requests, baseHeaders, "/sdk/poll", logger), pollingInterval, logger));
          }
        }
        const fdv1FallbackConfig = dataSystem.fdv1Fallback;
        if (fdv1FallbackConfig !== null) {
          const fdv1FallbackPollInterval = (_f = (_e = fdv1FallbackConfig === null || fdv1FallbackConfig === void 0 ? void 0 : fdv1FallbackConfig.pollInterval) !== null && _e !== void 0 ? _e : config.pollInterval) !== null && _f !== void 0 ? _f : Configuration_1.DEFAULT_POLL_INTERVAL;
          const fdv1FallbackEndpoints = (fdv1FallbackConfig === null || fdv1FallbackConfig === void 0 ? void 0 : fdv1FallbackConfig.baseUri) ? new js_sdk_common_1.ServiceEndpoints(config.serviceEndpoints.streaming, fdv1FallbackConfig.baseUri, config.serviceEndpoints.events, config.serviceEndpoints.analyticsEventPath, config.serviceEndpoints.diagnosticEventPath, config.serviceEndpoints.includeAuthorizationHeader, config.serviceEndpoints.payloadFilterKey) : void 0;
          fdv1FallbackSynchronizers.push(() => new PollingProcessorFDv2_1.default(new Requestor_1.default(config, platform.requests, baseHeaders, "/sdk/latest-all", config.logger, fdv1FallbackEndpoints), fdv1FallbackPollInterval, config.logger, true));
        }
        dataSource = new js_sdk_common_1.CompositeDataSource(initializers, synchronizers, fdv1FallbackSynchronizers, logger);
        payloadListener = (0, createPayloadListenerFDv2_1.createPayloadListener)(dataSourceUpdates, logger, initSuccess);
      }
      return {
        config,
        logger,
        evaluator,
        featureStore,
        dataSource,
        payloadListener,
        eventProcessor,
        bigSegmentsManager,
        hookRunner,
        onError: callbacks.onError,
        onFailed: callbacks.onFailed,
        onReady: callbacks.onReady
      };
    }
    var LDClientImpl = class {
      get logger() {
        return this._logger;
      }
      constructor(_sdkKey, _platform, options, callbacks, internalOptions) {
        this._sdkKey = _sdkKey;
        this._platform = _platform;
        this._initState = InitState.Initializing;
        this._eventFactoryDefault = new EventFactory_1.default(false);
        this._eventFactoryWithReasons = new EventFactory_1.default(true);
        const config = new Configuration_1.default(options, internalOptions);
        this.environmentMetadata = (0, createPluginEnvironmentMetadata_1.createPluginEnvironmentMetadata)(_platform, _sdkKey, config);
        const hooks = [];
        if (config.hooks) {
          hooks.push(...config.hooks);
        }
        config.getImplementationHooks(this.environmentMetadata).forEach((hook) => {
          hooks.push(hook);
        });
        if (!config.dataSystem) {
          ({
            config: this._config,
            logger: this._logger,
            evaluator: this._evaluator,
            featureStore: this._featureStore,
            updateProcessor: this._updateProcessor,
            eventProcessor: this._eventProcessor,
            bigSegmentsManager: this._bigSegmentsManager,
            hookRunner: this._hookRunner,
            onError: this._onError,
            onFailed: this._onFailed,
            onReady: this._onReady
          } = constructFDv1(_sdkKey, _platform, config, callbacks, () => this._initSuccess(), (e) => this._dataSourceErrorHandler(e), hooks, internalOptions === null || internalOptions === void 0 ? void 0 : internalOptions.instanceId));
          this.bigSegmentStatusProviderInternal = this._bigSegmentsManager.statusProvider;
          if (this._updateProcessor) {
            this._updateProcessor.start();
          } else {
            setTimeout(() => this._initSuccess(), 0);
          }
        } else {
          let transactionalStore;
          let payloadListener;
          ({
            config: this._config,
            logger: this._logger,
            evaluator: this._evaluator,
            featureStore: transactionalStore,
            dataSource: this._dataSource,
            payloadListener,
            eventProcessor: this._eventProcessor,
            bigSegmentsManager: this._bigSegmentsManager,
            hookRunner: this._hookRunner,
            onError: this._onError,
            onFailed: this._onFailed,
            onReady: this._onReady
          } = constructFDv2(_sdkKey, _platform, config, callbacks, () => this._initSuccess(), hooks, internalOptions === null || internalOptions === void 0 ? void 0 : internalOptions.instanceId));
          this._featureStore = transactionalStore;
          this.bigSegmentStatusProviderInternal = this._bigSegmentsManager.statusProvider;
          if (this._dataSource) {
            this._dataSource.start((_, payload) => {
              payloadListener === null || payloadListener === void 0 ? void 0 : payloadListener(payload);
            }, (state, err) => {
              if (state === js_sdk_common_1.subsystem.DataSourceState.Closed && err) {
                this._dataSourceErrorHandler(err);
              }
            }, () => {
              var _a;
              return (_a = transactionalStore.getSelector) === null || _a === void 0 ? void 0 : _a.call(transactionalStore);
            });
          } else {
            setTimeout(() => this._initSuccess(), 0);
          }
        }
      }
      initialized() {
        return this._initState === InitState.Initialized;
      }
      waitForInitialization(options) {
        var _a, _b;
        if ((options === null || options === void 0 ? void 0 : options.timeout) === void 0 && (this._updateProcessor !== void 0 || this._dataSource !== void 0)) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.warn("The waitForInitialization function was called without a timeout specified. In a future version a default timeout will be applied.");
        }
        if ((options === null || options === void 0 ? void 0 : options.timeout) !== void 0 && (options === null || options === void 0 ? void 0 : options.timeout) > HIGH_TIMEOUT_THRESHOLD && (this._updateProcessor !== void 0 || this._dataSource !== void 0)) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.warn(`The waitForInitialization function was called with a timeout greater than ${HIGH_TIMEOUT_THRESHOLD} seconds. We recommend a timeout of less than ${HIGH_TIMEOUT_THRESHOLD} seconds.`);
        }
        if (this._initializedPromise) {
          return this._clientWithTimeout(this._initializedPromise, options === null || options === void 0 ? void 0 : options.timeout, this._logger);
        }
        if (this._initState === InitState.Initialized) {
          this._initializedPromise = Promise.resolve(this);
          return this._initializedPromise;
        }
        if (this._initState === InitState.Failed) {
          this._initializedPromise = Promise.reject(this._rejectionReason);
          return this._initializedPromise;
        }
        if (!this._initializedPromise) {
          this._initializedPromise = new Promise((resolve, reject) => {
            this._initResolve = resolve;
            this._initReject = reject;
          });
        }
        return this._clientWithTimeout(this._initializedPromise, options === null || options === void 0 ? void 0 : options.timeout, this._logger);
      }
      variation(key, context, defaultValue, callback) {
        var _a, _b, _c;
        return this._hookRunner.withEvaluationSeries(key, context, defaultValue, VARIATION_METHOD_NAME, () => new Promise((resolve) => {
          this._evaluateIfPossible(key, context, defaultValue, this._eventFactoryDefault, (res) => {
            resolve(res.detail);
          });
        }), (_c = (_b = (_a = this._featureStore).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.environmentId).then((detail) => {
          callback === null || callback === void 0 ? void 0 : callback(null, detail.value);
          return detail.value;
        });
      }
      variationDetail(key, context, defaultValue, callback) {
        var _a, _b, _c;
        return this._hookRunner.withEvaluationSeries(key, context, defaultValue, VARIATION_METHOD_DETAIL_NAME, () => new Promise((resolve) => {
          this._evaluateIfPossible(key, context, defaultValue, this._eventFactoryWithReasons, (res) => {
            resolve(res.detail);
            callback === null || callback === void 0 ? void 0 : callback(null, res.detail);
          });
        }), (_c = (_b = (_a = this._featureStore).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.environmentId);
      }
      _typedEval(key, context, defaultValue, eventFactory, methodName, typeChecker) {
        var _a, _b, _c;
        return this._hookRunner.withEvaluationSeries(key, context, defaultValue, methodName, () => new Promise((resolve) => {
          this._evaluateIfPossible(key, context, defaultValue, eventFactory, (res) => {
            const typedRes = {
              value: res.detail.value,
              reason: res.detail.reason,
              variationIndex: res.detail.variationIndex
            };
            resolve(typedRes);
          }, typeChecker);
        }), (_c = (_b = (_a = this._featureStore).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.environmentId);
      }
      async boolVariation(key, context, defaultValue) {
        return (await this._typedEval(key, context, defaultValue, this._eventFactoryDefault, BOOL_VARIATION_METHOD_NAME, (value) => [js_sdk_common_1.TypeValidators.Boolean.is(value), js_sdk_common_1.TypeValidators.Boolean.getType()])).value;
      }
      async numberVariation(key, context, defaultValue) {
        return (await this._typedEval(key, context, defaultValue, this._eventFactoryDefault, NUMBER_VARIATION_METHOD_NAME, (value) => [js_sdk_common_1.TypeValidators.Number.is(value), js_sdk_common_1.TypeValidators.Number.getType()])).value;
      }
      async stringVariation(key, context, defaultValue) {
        return (await this._typedEval(key, context, defaultValue, this._eventFactoryDefault, STRING_VARIATION_METHOD_NAME, (value) => [js_sdk_common_1.TypeValidators.String.is(value), js_sdk_common_1.TypeValidators.String.getType()])).value;
      }
      jsonVariation(key, context, defaultValue) {
        var _a, _b, _c;
        return this._hookRunner.withEvaluationSeries(key, context, defaultValue, JSON_VARIATION_METHOD_NAME, () => new Promise((resolve) => {
          this._evaluateIfPossible(key, context, defaultValue, this._eventFactoryDefault, (res) => {
            resolve(res.detail);
          });
        }), (_c = (_b = (_a = this._featureStore).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.environmentId).then((detail) => detail.value);
      }
      boolVariationDetail(key, context, defaultValue) {
        return this._typedEval(key, context, defaultValue, this._eventFactoryWithReasons, BOOL_VARIATION_DETAIL_METHOD_NAME, (value) => [js_sdk_common_1.TypeValidators.Boolean.is(value), js_sdk_common_1.TypeValidators.Boolean.getType()]);
      }
      numberVariationDetail(key, context, defaultValue) {
        return this._typedEval(key, context, defaultValue, this._eventFactoryWithReasons, NUMBER_VARIATION_DETAIL_METHOD_NAME, (value) => [js_sdk_common_1.TypeValidators.Number.is(value), js_sdk_common_1.TypeValidators.Number.getType()]);
      }
      stringVariationDetail(key, context, defaultValue) {
        return this._typedEval(key, context, defaultValue, this._eventFactoryWithReasons, STRING_VARIATION_DETAIL_METHOD_NAME, (value) => [js_sdk_common_1.TypeValidators.String.is(value), js_sdk_common_1.TypeValidators.String.getType()]);
      }
      jsonVariationDetail(key, context, defaultValue) {
        var _a, _b, _c;
        return this._hookRunner.withEvaluationSeries(key, context, defaultValue, JSON_VARIATION_DETAIL_METHOD_NAME, () => new Promise((resolve) => {
          this._evaluateIfPossible(key, context, defaultValue, this._eventFactoryWithReasons, (res) => {
            resolve(res.detail);
          });
        }), (_c = (_b = (_a = this._featureStore).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.environmentId);
      }
      async _migrationVariationInternal(key, context, defaultValue) {
        var _a;
        const res = await new Promise((resolve) => {
          this._evaluateIfPossible(key, context, defaultValue, this._eventFactoryWithReasons, ({ detail: detail2 }, flag2) => {
            if (!(0, api_1.IsMigrationStage)(detail2.value)) {
              const error = new Error(`Unrecognized MigrationState for "${key}"; returning default value.`);
              this._onError(error);
              const reason = {
                kind: "ERROR",
                errorKind: ErrorKinds.WrongType
              };
              resolve({
                detail: {
                  value: defaultValue,
                  reason
                },
                flag: flag2
              });
              return;
            }
            resolve({ detail: detail2, flag: flag2 });
          });
        });
        const { detail, flag } = res;
        const checkRatio = (_a = flag === null || flag === void 0 ? void 0 : flag.migration) === null || _a === void 0 ? void 0 : _a.checkRatio;
        const samplingRatio = flag === null || flag === void 0 ? void 0 : flag.samplingRatio;
        return {
          detail,
          migration: {
            value: detail.value,
            tracker: new MigrationOpTracker_1.default(
              key,
              context,
              defaultValue,
              detail.value,
              detail.reason,
              checkRatio,
              // Can be null for compatibility reasons.
              detail.variationIndex === null ? void 0 : detail.variationIndex,
              flag === null || flag === void 0 ? void 0 : flag.version,
              samplingRatio,
              this._logger
            )
          }
        };
      }
      async migrationVariation(key, context, defaultValue) {
        var _a, _b, _c;
        const res = await this._hookRunner.withEvaluationSeriesExtraDetail(key, context, defaultValue, MIGRATION_VARIATION_METHOD_NAME, () => this._migrationVariationInternal(key, context, defaultValue), (_c = (_b = (_a = this._featureStore).getInitMetaData) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.environmentId);
        return res.migration;
      }
      allFlagsState(context, options, callback) {
        var _a, _b, _c;
        if (this._config.offline) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.info("allFlagsState() called in offline mode. Returning empty state.");
          const allFlagState = new FlagsStateBuilder_1.default(false, false).build();
          callback === null || callback === void 0 ? void 0 : callback(null, allFlagState);
          return Promise.resolve(allFlagState);
        }
        const evalContext = js_sdk_common_1.Context.fromLDContext(context);
        if (!evalContext.valid) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.info(`${(_c = evalContext.message) !== null && _c !== void 0 ? _c : "Invalid context."}. Returning empty state.`);
          return Promise.resolve(new FlagsStateBuilder_1.default(false, false).build());
        }
        return new Promise((resolve) => {
          const doEval = (valid) => this._featureStore.all(VersionedDataKinds_1.default.Features, (allFlags) => {
            const builder = new FlagsStateBuilder_1.default(valid, !!(options === null || options === void 0 ? void 0 : options.withReasons));
            const clientOnly = !!(options === null || options === void 0 ? void 0 : options.clientSideOnly);
            const detailsOnlyIfTracked = !!(options === null || options === void 0 ? void 0 : options.detailsOnlyForTrackedFlags);
            (0, collection_1.allAsync)(Object.values(allFlags), (storeItem, iterCb) => {
              var _a2;
              const flag = storeItem;
              if (clientOnly && !((_a2 = flag.clientSideAvailability) === null || _a2 === void 0 ? void 0 : _a2.usingEnvironmentId)) {
                iterCb(true);
                return;
              }
              this._evaluator.evaluateCb(flag, evalContext, (res) => {
                var _a3;
                if (res.isError) {
                  this._onError(new Error(`Error for feature flag "${flag.key}" while evaluating all flags: ${res.message}`));
                }
                const requireExperimentData = (0, isExperiment_1.default)(flag, res.detail.reason);
                builder.addFlag(flag, res.detail.value, (_a3 = res.detail.variationIndex) !== null && _a3 !== void 0 ? _a3 : void 0, res.detail.reason, flag.trackEvents || requireExperimentData, requireExperimentData, detailsOnlyIfTracked, res.prerequisites);
                iterCb(true);
              });
            }, () => {
              const res = builder.build();
              callback === null || callback === void 0 ? void 0 : callback(null, res);
              resolve(res);
            });
          });
          if (!this.initialized()) {
            this._featureStore.initialized((storeInitialized) => {
              var _a2, _b2;
              let valid = true;
              if (storeInitialized) {
                (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.warn("Called allFlagsState before client initialization; using last known values from data store");
              } else {
                (_b2 = this._logger) === null || _b2 === void 0 ? void 0 : _b2.warn("Called allFlagsState before client initialization. Data store not available; returning empty state");
                valid = false;
              }
              doEval(valid);
            });
          } else {
            doEval(true);
          }
        });
      }
      secureModeHash(context) {
        const checkedContext = js_sdk_common_1.Context.fromLDContext(context);
        const key = checkedContext.valid ? checkedContext.canonicalKey : void 0;
        if (!this._platform.crypto.createHmac) {
          throw new Error("Platform must implement createHmac");
        }
        const hmac = this._platform.crypto.createHmac("sha256", this._sdkKey);
        if (key === void 0) {
          throw new js_sdk_common_1.LDClientError("Could not generate secure mode hash for invalid context");
        }
        hmac.update(key);
        return hmac.digest("hex");
      }
      close() {
        var _a, _b;
        this._eventProcessor.close();
        (_a = this._updateProcessor) === null || _a === void 0 ? void 0 : _a.close();
        (_b = this._dataSource) === null || _b === void 0 ? void 0 : _b.stop();
        this._featureStore.close();
        this._bigSegmentsManager.close();
      }
      isOffline() {
        return this._config.offline;
      }
      track(key, context, data, metricValue) {
        var _a, _b;
        const checkedContext = js_sdk_common_1.Context.fromLDContext(context);
        if (!checkedContext.valid) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.warn(ClientMessages.MissingContextKeyNoEvent);
          return;
        }
        if (metricValue !== void 0 && !js_sdk_common_1.TypeValidators.Number.is(metricValue)) {
          (_b = this._logger) === null || _b === void 0 ? void 0 : _b.warn(ClientMessages.invalidMetricValue(typeof metricValue));
        }
        this._eventProcessor.sendEvent(this._eventFactoryDefault.customEvent(key, checkedContext, data, metricValue));
      }
      trackMigration(event) {
        const converted = (0, MigrationOpEventConversion_1.default)(event);
        if (!converted) {
          return;
        }
        this._eventProcessor.sendEvent(converted);
      }
      identify(context) {
        var _a;
        const checkedContext = js_sdk_common_1.Context.fromLDContext(context);
        if (!checkedContext.valid) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.warn(ClientMessages.MissingContextKeyNoEvent);
          return;
        }
        this._eventProcessor.sendEvent(this._eventFactoryDefault.identifyEvent(checkedContext));
      }
      async flush(callback) {
        try {
          await this._eventProcessor.flush();
        } catch (err) {
          return callback === null || callback === void 0 ? void 0 : callback(err, false);
        }
        return callback === null || callback === void 0 ? void 0 : callback(null, true);
      }
      addHook(hook) {
        this._hookRunner.addHook(hook);
      }
      _variationInternal(flagKey, context, defaultValue, eventFactory, cb, typeChecker) {
        var _a, _b;
        if (this._config.offline) {
          (_a = this._logger) === null || _a === void 0 ? void 0 : _a.info("Variation called in offline mode. Returning default value.");
          cb(EvalResult_1.default.forError(ErrorKinds.ClientNotReady, void 0, defaultValue));
          return;
        }
        const evalContext = js_sdk_common_1.Context.fromLDContext(context);
        if (!evalContext.valid) {
          this._onError(new js_sdk_common_1.LDClientError(`${(_b = evalContext.message) !== null && _b !== void 0 ? _b : "Context not valid;"} returning default value.`));
          cb(EvalResult_1.default.forError(ErrorKinds.UserNotSpecified, void 0, defaultValue));
          return;
        }
        this._featureStore.get(VersionedDataKinds_1.default.Features, flagKey, (item) => {
          const flag = item;
          if (!flag) {
            const error = new js_sdk_common_1.LDClientError(`Unknown feature flag "${flagKey}"; returning default value`);
            this._onError(error);
            const result = EvalResult_1.default.forError(ErrorKinds.FlagNotFound, void 0, defaultValue);
            this._eventProcessor.sendEvent(this._eventFactoryDefault.unknownFlagEvent(flagKey, defaultValue, evalContext));
            cb(result);
            return;
          }
          this._evaluator.evaluateCb(flag, evalContext, (evalRes) => {
            var _a2;
            if (evalRes.detail.variationIndex === void 0 || evalRes.detail.variationIndex === null) {
              (_a2 = this._logger) === null || _a2 === void 0 ? void 0 : _a2.debug("Result value is null in variation");
              evalRes.setDefault(defaultValue);
            }
            if (typeChecker) {
              const [matched, type] = typeChecker(evalRes.detail.value);
              if (!matched) {
                const errorRes = EvalResult_1.default.forError(ErrorKinds.WrongType, `Did not receive expected type (${type}) evaluating feature flag "${flagKey}"`, defaultValue);
                this._sendEvalEvent(errorRes, eventFactory, flag, evalContext, defaultValue);
                cb(errorRes, flag);
                return;
              }
            }
            this._sendEvalEvent(evalRes, eventFactory, flag, evalContext, defaultValue);
            cb(evalRes, flag);
          }, eventFactory);
        });
      }
      _sendEvalEvent(evalRes, eventFactory, flag, evalContext, defaultValue) {
        var _a;
        (_a = evalRes.events) === null || _a === void 0 ? void 0 : _a.forEach((event) => {
          this._eventProcessor.sendEvent(Object.assign({}, event));
        });
        this._eventProcessor.sendEvent(eventFactory.evalEventServer(flag, evalContext, evalRes.detail, defaultValue, void 0));
      }
      _evaluateIfPossible(flagKey, context, defaultValue, eventFactory, cb, typeChecker) {
        if (!this.initialized()) {
          this._featureStore.initialized((storeInitialized) => {
            var _a, _b;
            if (storeInitialized) {
              (_a = this._logger) === null || _a === void 0 ? void 0 : _a.warn("Variation called before LaunchDarkly client initialization completed (did you wait for the 'ready' event?) - using last known values from feature store");
              this._variationInternal(flagKey, context, defaultValue, eventFactory, cb, typeChecker);
              return;
            }
            (_b = this._logger) === null || _b === void 0 ? void 0 : _b.warn("Variation called before LaunchDarkly client initialization completed (did you wait for the'ready' event?) - using default value");
            cb(EvalResult_1.default.forError(ErrorKinds.ClientNotReady, void 0, defaultValue));
          });
          return;
        }
        this._variationInternal(flagKey, context, defaultValue, eventFactory, cb, typeChecker);
      }
      _dataSourceErrorHandler(e) {
        var _a;
        const error = e.code === 401 ? new Error("Authentication failed. Double check your SDK key.") : e;
        this._onError(error);
        this._onFailed(error);
        if (!this.initialized()) {
          this._initState = InitState.Failed;
          this._rejectionReason = error;
          (_a = this._initReject) === null || _a === void 0 ? void 0 : _a.call(this, error);
        }
      }
      _initSuccess() {
        var _a;
        if (!this.initialized()) {
          this._initState = InitState.Initialized;
          (_a = this._initResolve) === null || _a === void 0 ? void 0 : _a.call(this, this);
          this._onReady();
        }
      }
      /**
       * Apply a timeout promise to a base promise. This is for use with waitForInitialization.
       * Currently it returns a LDClient. In the future it should return a status.
       *
       * The client isn't always the expected type of the consumer. It returns an LDClient interface
       * which is less capable than, for example, the node client interface.
       *
       * @param basePromise The promise to race against a timeout.
       * @param timeout The timeout in seconds.
       * @param logger A logger to log when the timeout expires.
       * @returns
       */
      _clientWithTimeout(basePromise, timeout, logger) {
        if (timeout) {
          const cancelableTimeout = (0, js_sdk_common_1.cancelableTimedPromise)(timeout, "waitForInitialization");
          return Promise.race([
            basePromise.then(() => this),
            cancelableTimeout.promise.then(() => this)
          ]).catch((reason) => {
            if (reason instanceof js_sdk_common_1.LDTimeoutError) {
              logger === null || logger === void 0 ? void 0 : logger.error(reason.message);
            }
            throw reason;
          }).finally(() => cancelableTimeout.cancel());
        }
        return basePromise;
      }
    };
    exports2.default = LDClientImpl;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/Migration.js
var require_Migration = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/Migration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createMigration = exports2.LDMigrationError = exports2.LDMigrationSuccess = void 0;
    var api_1 = require_api();
    var LDMigrationOptions_1 = require_LDMigrationOptions();
    async function safeCall(method) {
      try {
        const res = await method();
        return res;
      } catch (error) {
        return {
          success: false,
          error
        };
      }
    }
    function LDMigrationSuccess(result) {
      return {
        success: true,
        result
      };
    }
    exports2.LDMigrationSuccess = LDMigrationSuccess;
    function LDMigrationError(error) {
      return {
        success: false,
        error
      };
    }
    exports2.LDMigrationError = LDMigrationError;
    var Migration = class {
      constructor(_client, _config) {
        var _a, _b;
        this._client = _client;
        this._config = _config;
        this._readTable = {
          [api_1.LDMigrationStage.Off]: async (context) => this._doSingleOp(context, "old", this._config.readOld.bind(this._config)),
          [api_1.LDMigrationStage.DualWrite]: async (context) => this._doSingleOp(context, "old", this._config.readOld.bind(this._config)),
          [api_1.LDMigrationStage.Shadow]: async (context) => {
            const { fromOld, fromNew } = await this._doRead(context);
            this._trackConsistency(context, fromOld, fromNew);
            return fromOld;
          },
          [api_1.LDMigrationStage.Live]: async (context) => {
            const { fromNew, fromOld } = await this._doRead(context);
            this._trackConsistency(context, fromOld, fromNew);
            return fromNew;
          },
          [api_1.LDMigrationStage.RampDown]: async (context) => this._doSingleOp(context, "new", this._config.readNew.bind(this._config)),
          [api_1.LDMigrationStage.Complete]: async (context) => this._doSingleOp(context, "new", this._config.readNew.bind(this._config))
        };
        this._writeTable = {
          [api_1.LDMigrationStage.Off]: async (context) => ({
            authoritative: await this._doSingleOp(context, "old", this._config.writeOld.bind(this._config))
          }),
          [api_1.LDMigrationStage.DualWrite]: async (context) => {
            const fromOld = await this._doSingleOp(context, "old", this._config.writeOld.bind(this._config));
            if (!fromOld.success) {
              return {
                authoritative: fromOld
              };
            }
            const fromNew = await this._doSingleOp(context, "new", this._config.writeNew.bind(this._config));
            return {
              authoritative: fromOld,
              nonAuthoritative: fromNew
            };
          },
          [api_1.LDMigrationStage.Shadow]: async (context) => {
            const fromOld = await this._doSingleOp(context, "old", this._config.writeOld.bind(this._config));
            if (!fromOld.success) {
              return {
                authoritative: fromOld
              };
            }
            const fromNew = await this._doSingleOp(context, "new", this._config.writeNew.bind(this._config));
            return {
              authoritative: fromOld,
              nonAuthoritative: fromNew
            };
          },
          [api_1.LDMigrationStage.Live]: async (context) => {
            const fromNew = await this._doSingleOp(context, "new", this._config.writeNew.bind(this._config));
            if (!fromNew.success) {
              return {
                authoritative: fromNew
              };
            }
            const fromOld = await this._doSingleOp(context, "old", this._config.writeOld.bind(this._config));
            return {
              authoritative: fromNew,
              nonAuthoritative: fromOld
            };
          },
          [api_1.LDMigrationStage.RampDown]: async (context) => {
            const fromNew = await this._doSingleOp(context, "new", this._config.writeNew.bind(this._config));
            if (!fromNew.success) {
              return {
                authoritative: fromNew
              };
            }
            const fromOld = await this._doSingleOp(context, "old", this._config.writeOld.bind(this._config));
            return {
              authoritative: fromNew,
              nonAuthoritative: fromOld
            };
          },
          [api_1.LDMigrationStage.Complete]: async (context) => ({
            authoritative: await this._doSingleOp(context, "new", this._config.writeNew.bind(this._config))
          })
        };
        if (this._config.execution) {
          this._execution = this._config.execution;
        } else {
          this._execution = new LDMigrationOptions_1.LDConcurrentExecution();
        }
        this._latencyTracking = (_a = this._config.latencyTracking) !== null && _a !== void 0 ? _a : true;
        this._errorTracking = (_b = this._config.errorTracking) !== null && _b !== void 0 ? _b : true;
      }
      async read(key, context, defaultStage, payload) {
        const stage = await this._client.migrationVariation(key, context, defaultStage);
        const res = await this._readTable[stage.value]({
          payload,
          tracker: stage.tracker
        });
        stage.tracker.op("read");
        this._sendEvent(stage.tracker);
        return res;
      }
      async write(key, context, defaultStage, payload) {
        const stage = await this._client.migrationVariation(key, context, defaultStage);
        const res = await this._writeTable[stage.value]({
          payload,
          tracker: stage.tracker
        });
        stage.tracker.op("write");
        this._sendEvent(stage.tracker);
        return res;
      }
      _sendEvent(tracker) {
        const event = tracker.createEvent();
        if (event) {
          this._client.trackMigration(event);
        }
      }
      _trackConsistency(context, oldValue, newValue) {
        if (!this._config.check) {
          return;
        }
        if (oldValue.success && newValue.success) {
          context.tracker.consistency(() => this._config.check(oldValue.result, newValue.result));
        }
      }
      async _readSequentialFixed(context) {
        const fromOld = await this._doSingleOp(context, "old", this._config.readOld.bind(this._config));
        const fromNew = await this._doSingleOp(context, "new", this._config.readNew.bind(this._config));
        return { fromOld, fromNew };
      }
      async _readConcurrent(context) {
        const fromOldPromise = this._doSingleOp(context, "old", this._config.readOld.bind(this._config));
        const fromNewPromise = this._doSingleOp(context, "new", this._config.readNew.bind(this._config));
        const [fromOld, fromNew] = await Promise.all([fromOldPromise, fromNewPromise]);
        return { fromOld, fromNew };
      }
      async _readSequentialRandom(context) {
        const randomIndex = Math.floor(Math.random() * 2);
        if (randomIndex === 0) {
          const fromOld2 = await this._doSingleOp(context, "old", this._config.readOld.bind(this._config));
          const fromNew2 = await this._doSingleOp(context, "new", this._config.readNew.bind(this._config));
          return { fromOld: fromOld2, fromNew: fromNew2 };
        }
        const fromNew = await this._doSingleOp(context, "new", this._config.readNew.bind(this._config));
        const fromOld = await this._doSingleOp(context, "old", this._config.readOld.bind(this._config));
        return { fromOld, fromNew };
      }
      async _doRead(context) {
        var _a;
        if (((_a = this._execution) === null || _a === void 0 ? void 0 : _a.type) === LDMigrationOptions_1.LDExecution.Serial) {
          const serial = this._execution;
          if (serial.ordering === LDMigrationOptions_1.LDExecutionOrdering.Fixed) {
            return this._readSequentialFixed(context);
          }
          return this._readSequentialRandom(context);
        }
        return this._readConcurrent(context);
      }
      async _doSingleOp(context, origin, method) {
        context.tracker.invoked(origin);
        const res = await this._trackLatency(context.tracker, origin, () => safeCall(() => method(context.payload)));
        if (!res.success && this._errorTracking) {
          context.tracker.error(origin);
        }
        return Object.assign({ origin }, res);
      }
      async _trackLatency(tracker, origin, method) {
        if (!this._latencyTracking) {
          return method();
        }
        let start;
        let end;
        let result;
        if (typeof performance !== "undefined") {
          start = performance.now();
          result = await method();
          end = performance.now();
        } else {
          start = Date.now();
          result = await method();
          end = Date.now();
        }
        const latency = end - start;
        tracker.latency(origin, latency);
        return result;
      }
    };
    function createMigration(client, config) {
      return new Migration(client, config);
    }
    exports2.createMigration = createMigration;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/FileDataSource.js
var require_FileDataSource = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/data_sources/FileDataSource.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var serialization_1 = require_serialization();
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var FileLoader_1 = require_FileLoader();
    function makeFlagWithValue(key, value, version) {
      return {
        key,
        on: true,
        fallthrough: { variation: 0 },
        variations: [value],
        version
      };
    }
    var FileDataSource = class {
      /**
       * This is internal because we want instances to only be created with the
       * factory.
       * @internal
       */
      constructor(options, filesystem, _featureStore, _initSuccessHandler = () => {
      }, _errorHandler) {
        var _a;
        this._featureStore = _featureStore;
        this._initSuccessHandler = _initSuccessHandler;
        this._errorHandler = _errorHandler;
        this._allData = {};
        this._fileLoader = new FileLoader_1.default(filesystem, options.paths, (_a = options.autoUpdate) !== null && _a !== void 0 ? _a : false, (results) => {
          var _a2, _b;
          try {
            this._processFileData(results);
          } catch (err) {
            (_a2 = this._errorHandler) === null || _a2 === void 0 ? void 0 : _a2.call(this, err);
            (_b = this._logger) === null || _b === void 0 ? void 0 : _b.error(`Error processing files: ${err}`);
          }
        });
        this._logger = options.logger;
        this._yamlParser = options.yamlParser;
      }
      start() {
        (async () => {
          var _a;
          try {
            await this._fileLoader.loadAndWatch();
          } catch (err) {
            (_a = this._errorHandler) === null || _a === void 0 ? void 0 : _a.call(this, err);
          }
        })();
      }
      stop() {
        this._fileLoader.close();
      }
      close() {
        this.stop();
      }
      _addItem(kind, item) {
        if (!this._allData[kind.namespace]) {
          this._allData[kind.namespace] = {};
        }
        if (this._allData[kind.namespace][item.key]) {
          throw new Error(`found duplicate key: "${item.key}"`);
        } else {
          this._allData[kind.namespace][item.key] = item;
        }
      }
      _processFileData(fileData) {
        const oldData = this._allData;
        this._allData = {};
        fileData.forEach((fd) => {
          let parsed;
          if (fd.path.endsWith(".yml") || fd.path.endsWith(".yaml")) {
            if (this._yamlParser) {
              parsed = this._yamlParser(fd.data);
            } else {
              throw new Error(`Attempted to parse yaml file (${fd.path}) without parser.`);
            }
          } else {
            parsed = JSON.parse(fd.data);
          }
          this._processParsedData(parsed, oldData);
        });
        this._featureStore.init(this._allData, () => {
          this._initSuccessHandler();
          this._initSuccessHandler = () => {
          };
        });
      }
      _processParsedData(parsed, oldData) {
        Object.keys(parsed.flags || {}).forEach((key) => {
          (0, serialization_1.processFlag)(parsed.flags[key]);
          this._addItem(VersionedDataKinds_1.default.Features, parsed.flags[key]);
        });
        Object.keys(parsed.flagValues || {}).forEach((key) => {
          var _a, _b;
          const previousInstance = (_a = oldData[VersionedDataKinds_1.default.Features.namespace]) === null || _a === void 0 ? void 0 : _a[key];
          let { version } = previousInstance !== null && previousInstance !== void 0 ? previousInstance : { version: 1 };
          if (previousInstance && JSON.stringify(parsed.flagValues[key]) !== JSON.stringify((_b = previousInstance === null || previousInstance === void 0 ? void 0 : previousInstance.variations) === null || _b === void 0 ? void 0 : _b[0])) {
            version += 1;
          }
          const flag = makeFlagWithValue(key, parsed.flagValues[key], version);
          (0, serialization_1.processFlag)(flag);
          this._addItem(VersionedDataKinds_1.default.Features, flag);
        });
        Object.keys(parsed.segments || {}).forEach((key) => {
          (0, serialization_1.processSegment)(parsed.segments[key]);
          this._addItem(VersionedDataKinds_1.default.Segments, parsed.segments[key]);
        });
      }
    };
    exports2.default = FileDataSource;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/FileDataSourceFactory.js
var require_FileDataSourceFactory = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/FileDataSourceFactory.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var FileDataSource_1 = require_FileDataSource();
    var FileDataSourceFactory = class {
      constructor(_options) {
        this._options = _options;
      }
      /**
       * Method for creating instances of the file data source. This method is intended to be used
       * by the SDK.
       *
       * @param config SDK configuration required by the file data source.
       * @param filesystem Platform abstraction used for filesystem access.
       * @returns a {@link FileDataSource}
       *
       * @internal
       */
      create(ldClientContext, featureStore, initSuccessHandler, errorHandler) {
        const updatedOptions = {
          paths: this._options.paths,
          autoUpdate: this._options.autoUpdate,
          logger: this._options.logger || ldClientContext.basicConfiguration.logger,
          yamlParser: this._options.yamlParser
        };
        return new FileDataSource_1.default(updatedOptions, ldClientContext.platform.fileSystem, featureStore, initSuccessHandler, errorHandler);
      }
      getFactory() {
        return (ldClientContext, featureStore, initSuccessHandler, errorHandler) => this.create(ldClientContext, featureStore, initSuccessHandler, errorHandler);
      }
    };
    exports2.default = FileDataSourceFactory;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/booleanVariation.js
var require_booleanVariation = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/booleanVariation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.variationForBoolean = exports2.FALSE_VARIATION_INDEX = exports2.TRUE_VARIATION_INDEX = void 0;
    exports2.TRUE_VARIATION_INDEX = 0;
    exports2.FALSE_VARIATION_INDEX = 1;
    function variationForBoolean(val) {
      return val ? exports2.TRUE_VARIATION_INDEX : exports2.FALSE_VARIATION_INDEX;
    }
    exports2.variationForBoolean = variationForBoolean;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestDataRuleBuilder.js
var require_TestDataRuleBuilder = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestDataRuleBuilder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var booleanVariation_1 = require_booleanVariation();
    var TestDataRuleBuilder = class _TestDataRuleBuilder {
      /**
       * @internal
       */
      constructor(_flagBuilder, clauses, variation) {
        this._flagBuilder = _flagBuilder;
        this._clauses = [];
        if (clauses) {
          this._clauses = [...clauses];
        }
        if (variation !== void 0) {
          this._variation = variation;
        }
      }
      /**
       * Adds another clause using the "is one of" operator.
       *
       * For example, this creates a rule that returns `true` if the name is
       * "Patsy" and the country is "gb":
       *
       *     testData.flag('flag')
       *             .ifMatch('name', 'Patsy')
       *             .andMatch('country', 'gb')
       *             .thenReturn(true)
       *
       * @param contextKind the kind of the context
       * @param attribute the user attribute to match against
       * @param values values to compare to
       * @return the flag rule builder
       */
      andMatch(contextKind, attribute, ...values) {
        this._clauses.push({
          contextKind,
          attribute,
          attributeReference: new js_sdk_common_1.AttributeReference(attribute),
          op: "in",
          values,
          negate: false
        });
        return this;
      }
      /**
       * Adds another clause using the "is not one of" operator.
       *
       * For example, this creates a rule that returns `true` if the name is
       * "Patsy" and the country is not "gb":
       *
       *     testData.flag('flag')
       *             .ifMatch('name', 'Patsy')
       *             .andNotMatch('country', 'gb')
       *             .thenReturn(true)
       *
       * @param contextKind the kind of the context
       * @param attribute the user attribute to match against
       * @param values values to compare to
       * @return the flag rule builder
       */
      andNotMatch(contextKind, attribute, ...values) {
        this._clauses.push({
          contextKind,
          attribute,
          attributeReference: new js_sdk_common_1.AttributeReference(attribute),
          op: "in",
          values,
          negate: true
        });
        return this;
      }
      /**
       * Finishes defining the rule, specifying the result value as either a boolean or an index
       *
       * If the variation is a boolean value and the flag was not already a boolean
       * flag, this also changes it to be a boolean flag.
       *
       * If the variation is an integer, it specifies a variation out of whatever
       * variation values have already been defined.
       *
       * @param variation
       *    either `true` or `false` or the index of the desired variation:
       *    0 for the first, 1 for the second, etc.
       * @return the flag rule builder
       */
      thenReturn(variation) {
        if (js_sdk_common_1.TypeValidators.Boolean.is(variation)) {
          this._flagBuilder.booleanFlag();
          return this.thenReturn((0, booleanVariation_1.variationForBoolean)(variation));
        }
        this._variation = variation;
        this._flagBuilder.addRule(this);
        return this._flagBuilder;
      }
      /**
       * @internal
       */
      build(id) {
        return {
          id: `rule${id}`,
          variation: this._variation,
          clauses: this._clauses
        };
      }
      /**
       * @internal
       */
      clone() {
        return new _TestDataRuleBuilder(this._flagBuilder, this._clauses, this._variation);
      }
    };
    exports2.default = TestDataRuleBuilder;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestDataFlagBuilder.js
var require_TestDataFlagBuilder = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestDataFlagBuilder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var js_sdk_common_1 = require_cjs();
    var booleanVariation_1 = require_booleanVariation();
    var TestDataRuleBuilder_1 = require_TestDataRuleBuilder();
    var TestDataFlagBuilder = class _TestDataFlagBuilder {
      /**
       * @internal
       */
      constructor(_key, data) {
        this._key = _key;
        this._data = {
          on: true,
          variations: []
        };
        if (data) {
          this._data = {
            on: data.on,
            variations: [...data.variations]
          };
          if (data.offVariation !== void 0) {
            this._data.offVariation = data.offVariation;
          }
          if (data.fallthroughVariation !== void 0) {
            this._data.fallthroughVariation = data.fallthroughVariation;
          }
          if (data.targetsByVariation) {
            this._data.targetsByVariation = JSON.parse(JSON.stringify(data.targetsByVariation));
          }
          if (data.rules) {
            this._data.rules = [];
            data.rules.forEach((rule) => {
              var _a;
              (_a = this._data.rules) === null || _a === void 0 ? void 0 : _a.push(rule.clone());
            });
          }
        }
      }
      get _isBooleanFlag() {
        return this._data.variations.length === 2 && this._data.variations[booleanVariation_1.TRUE_VARIATION_INDEX] === true && this._data.variations[booleanVariation_1.FALSE_VARIATION_INDEX] === false;
      }
      /**
       * A shortcut for setting the flag to use the standard boolean configuration.
       *
       * This is the default for all new flags created with {@link TestData.flag}. The
       * flag will have two variations, `true` and `false` (in that order). It
       * will return `false` whenever targeting is off and `true` when targeting
       * is on unless other settings specify otherwise.
       *
       * @return the flag builder
       */
      booleanFlag() {
        if (this._isBooleanFlag) {
          return this;
        }
        return this.variations(true, false).fallthroughVariation(booleanVariation_1.TRUE_VARIATION_INDEX).offVariation(booleanVariation_1.FALSE_VARIATION_INDEX);
      }
      /**
       * Sets the allowable variation values for the flag.
       *
       * The values may be of any JSON-compatible type: boolean, number, string, array,
       * or object. For instance, a boolean flag normally has `variations(true, false)`;
       * a string-valued flag might have `variations("red", "green")`; etc.
       *
       * @param values any number of variation values
       * @return the flag builder
       */
      variations(...values) {
        this._data.variations = [...values];
        return this;
      }
      /**
       * Sets targeting to be on or off for this flag.
       *
       * The effect of this depends on the rest of the flag configuration, just
       * as it does on the real LaunchDarkly dashboard. In the default configuration
       * that you get from calling {@link TestData.flag} with a new flag key, the flag
       * will return `false` whenever targeting is off and `true` when targeting
       * is on.
       *
       * @param targetingOn true if targeting should be on
       * @return the flag builder
       */
      on(targetingOn) {
        this._data.on = targetingOn;
        return this;
      }
      /**
       * Specifies the fallthrough variation for a flag. The fallthrough is
       * the value that is returned if targeting is on and the user was not
       * matched by a more specific target or rule.
       *
       * If a boolean is supplied, and the flag was previously configured with
       * other variations, this also changes it to a boolean flag.
       *
       * @param variation
       *    either `true` or `false` or the index of the desired fallthrough
       *    variation: 0 for the first, 1 for the second, etc.
       * @return the flag builder
       */
      fallthroughVariation(variation) {
        if (js_sdk_common_1.TypeValidators.Boolean.is(variation)) {
          return this.booleanFlag().fallthroughVariation((0, booleanVariation_1.variationForBoolean)(variation));
        }
        this._data.fallthroughVariation = variation;
        return this;
      }
      /**
       * Specifies the off variation for a flag. This is the variation that is
       * returned whenever targeting is off.
       *
       * If a boolean is supplied, and the flag was previously configured with
       * other variations, this also changes it to a boolean flag.
       *
       * @param variation
       *    either `true` or `false` or the index of the desired off
       *    variation: 0 for the first, 1 for the second, etc.
       * @return the flag builder
       */
      offVariation(variation) {
        if (js_sdk_common_1.TypeValidators.Boolean.is(variation)) {
          return this.booleanFlag().offVariation((0, booleanVariation_1.variationForBoolean)(variation));
        }
        this._data.offVariation = variation;
        return this;
      }
      /**
       * Sets the flag to always return the specified variation for all contexts.
       *
       * Targeting is switched on, any existing targets or rules are removed,
       * and the fallthrough variation is set to the specified value. The off
       * variation is left unchanged.
       *
       * If a boolean is supplied, and the flag was previously configured with
       * other variations, this also changes it to a boolean flag.
       *
       * @param varation
       *    either `true` or `false` or the index of the desired variation:
       *    0 for the first, 1 for the second, etc.
       * @return the flag builder
       */
      variationForAll(variation) {
        return this.on(true).clearRules().clearAllTargets().fallthroughVariation(variation);
      }
      /**
       * Sets the flag to always return the specified variation value for all contexts.
       *
       * The value may be of any valid JSON type. This method changes the flag to have
       * only a single variation, which is this value, and to return the same variation
       * regardless of whether targeting is on or off. Any existing targets or rules
       * are removed.
       *
       * @param value The desired value to be returned for all contexts.
       * @return the flag builder
       */
      valueForAll(value) {
        return this.variations(value).variationForAll(0);
      }
      /**
       * Sets the flag to return the specified variation for a specific context key
       * when targeting is on. The context kind for contexts created with this method
       * will be 'user'.
       *
       * This has no effect when targeting is turned off for the flag.
       *
       * If the variation is a boolean value and the flag was not already a boolean
       * flag, this also changes it to be a boolean flag.
       *
       * If the variation is an integer, it specifies a variation out of whatever
       * variation values have already been defined.
       *
       * @param contextKey a context key
       * @param variation
       *    either `true` or `false` or the index of the desired variation:
       *    0 for the first, 1 for the second, etc.
       * @return the flag builder
       */
      variationForUser(contextKey, variation) {
        return this.variationForContext("user", contextKey, variation);
      }
      /**
       * Sets the flag to return the specified variation for a specific context key
       * when targeting is on.
       *
       * This has no effect when targeting is turned off for the flag.
       *
       * If the variation is a boolean value and the flag was not already a boolean
       * flag, this also changes it to be a boolean flag.
       *
       * If the variation is an integer, it specifies a variation out of whatever
       * variation values have already been defined.
       *
       * @param contextKind a context kind
       * @param contextKey a context key
       * @param variation
       *    either `true` or `false` or the index of the desired variation:
       *    0 for the first, 1 for the second, etc.
       * @return the flag builder
       */
      variationForContext(contextKind, contextKey, variation) {
        if (js_sdk_common_1.TypeValidators.Boolean.is(variation)) {
          return this.booleanFlag().variationForContext(contextKind, contextKey, (0, booleanVariation_1.variationForBoolean)(variation));
        }
        if (!this._data.targetsByVariation) {
          this._data.targetsByVariation = {};
        }
        this._data.variations.forEach((_, i) => {
          if (i === variation) {
            const targetsForVariation = this._data.targetsByVariation[i] || {};
            if (!(contextKind in targetsForVariation)) {
              targetsForVariation[contextKind] = [];
            }
            const exists = targetsForVariation[contextKind].indexOf(contextKey) !== -1;
            if (!exists) {
              targetsForVariation[contextKind].push(contextKey);
            }
            this._data.targetsByVariation[i] = targetsForVariation;
          } else {
            const targetsForVariation = this._data.targetsByVariation[i];
            if (targetsForVariation) {
              const targetsForContextKind = targetsForVariation[contextKind];
              if (targetsForContextKind) {
                const targetIndex = targetsForContextKind.indexOf(contextKey);
                if (targetIndex !== -1) {
                  targetsForContextKind.splice(targetIndex, 1);
                  if (!targetsForContextKind.length) {
                    delete targetsForVariation[contextKind];
                  }
                }
              }
              if (!Object.keys(targetsForVariation).length) {
                delete this._data.targetsByVariation[i];
              }
            }
          }
        });
        return this;
      }
      /**
       * Removes any existing rules from the flag. This undoes the effect of methods
       * like {@link  ifMatch}.
       *
       * @return the same flag builder
       */
      clearRules() {
        delete this._data.rules;
        return this;
      }
      /**
       * Removes any existing targets from the flag. This undoes the effect of
       * methods like {@link variationForContext}.
       *
       * @return the same flag builder
       */
      clearAllTargets() {
        delete this._data.targetsByVariation;
        return this;
      }
      /**
       * Starts defining a flag rule using the "is one of" operator.
       *
       * For example, this creates a rule that returnes `true` if the name is
       * "Patsy" or "Edina":
       *
       *     testData.flag('flag')
       *             .ifMatch('user', name', 'Patsy', 'Edina')
       *             .thenReturn(true)
       *
       * @param contextKind the kind of the context
       * @param attribute the context attribute to match against
       * @param values values to compare to
       * @return
       *    a flag rule builder; call `thenReturn` to finish the rule
       *    or add more tests with another method like `andMatch`
       */
      ifMatch(contextKind, attribute, ...values) {
        const flagRuleBuilder = new TestDataRuleBuilder_1.default(this);
        return flagRuleBuilder.andMatch(contextKind, attribute, ...values);
      }
      /**
       * Starts defining a flag rule using the "is not one of" operator.
       *
       * For example, this creates a rule that returns `true` if the name is
       * neither "Saffron" nor "Bubble":
       *
       *     testData.flag('flag')
       *             .ifNotMatch('user', 'name', 'Saffron', 'Bubble')
       *             .thenReturn(true)
       *
       * @param contextKind the kind of the context
       * @param attribute the user attribute to match against
       * @param values values to compare to
       * @return
       *    a flag rule builder; call `thenReturn` to finish the rule
       *    or add more tests with another method like `andNotMatch`
       */
      ifNotMatch(contextKind, attribute, ...values) {
        const flagRuleBuilder = new TestDataRuleBuilder_1.default(this);
        return flagRuleBuilder.andNotMatch(contextKind, attribute, ...values);
      }
      checkRatio(ratio) {
        var _a;
        this._data.migration = (_a = this._data.migration) !== null && _a !== void 0 ? _a : {};
        this._data.migration.checkRatio = ratio;
        return this;
      }
      samplingRatio(ratio) {
        this._data.samplingRatio = ratio;
        return this;
      }
      /**
       * @internal
       */
      addRule(flagRuleBuilder) {
        if (!this._data.rules) {
          this._data.rules = [];
        }
        this._data.rules.push(flagRuleBuilder);
      }
      /**
       * @internal
       */
      build(version) {
        const baseFlagObject = {
          key: this._key,
          version,
          on: this._data.on,
          offVariation: this._data.offVariation,
          fallthrough: {
            variation: this._data.fallthroughVariation
          },
          variations: [...this._data.variations],
          migration: this._data.migration,
          samplingRatio: this._data.samplingRatio
        };
        if (this._data.targetsByVariation) {
          const contextTargets = [];
          const userTargets = [];
          Object.entries(this._data.targetsByVariation).forEach(([variation, contextTargetsForVariation]) => {
            Object.entries(contextTargetsForVariation).forEach(([contextKind, values]) => {
              const numberVariation = parseInt(variation, 10);
              contextTargets.push({
                contextKind,
                values: contextKind === "user" ? [] : values,
                // Iterating the object it will be a string.
                variation: numberVariation
              });
              if (contextKind === "user") {
                userTargets.push({ values, variation: numberVariation });
              }
            });
          });
          baseFlagObject.targets = userTargets;
          baseFlagObject.contextTargets = contextTargets;
        }
        if (this._data.rules) {
          baseFlagObject.rules = this._data.rules.map((rule, i) => rule.build(String(i)));
        }
        return baseFlagObject;
      }
      /**
       * @internal
       */
      clone() {
        return new _TestDataFlagBuilder(this._key, this._data);
      }
      /**
       * @internal
       */
      getKey() {
        return this._key;
      }
    };
    exports2.default = TestDataFlagBuilder;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestDataSource.js
var require_TestDataSource = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestDataSource.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var TestDataSource = class {
      constructor(_featureStore, initialFlags, initialSegments, _onStop, _listeners) {
        this._featureStore = _featureStore;
        this._onStop = _onStop;
        this._listeners = _listeners;
        this._flags = Object.assign({}, initialFlags);
        this._segments = Object.assign({}, initialSegments);
      }
      async start() {
        this._listeners.forEach(({ processJson }) => {
          const dataJson = { data: { flags: this._flags, segments: this._segments } };
          processJson(dataJson);
        });
      }
      stop() {
        this._onStop(this);
      }
      close() {
        this.stop();
      }
      async upsert(kind, value) {
        return this._featureStore.upsert(kind, value);
      }
    };
    exports2.default = TestDataSource;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestData.js
var require_TestData = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/TestData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var createStreamListeners_1 = require_createStreamListeners();
    var AsyncStoreFacade_1 = require_AsyncStoreFacade();
    var serialization_1 = require_serialization();
    var VersionedDataKinds_1 = require_VersionedDataKinds();
    var TestDataFlagBuilder_1 = require_TestDataFlagBuilder();
    var TestDataSource_1 = require_TestDataSource();
    var TestData = class {
      constructor() {
        this._currentFlags = {};
        this._currentSegments = {};
        this._dataSources = [];
        this._flagBuilders = {};
      }
      /**
       * Get a factory for update processors that will be attached to this TestData instance.
       * @returns An update processor factory.
       */
      getFactory() {
        return (clientContext, featureStore, initSuccessHandler, _errorHandler) => {
          const listeners = (0, createStreamListeners_1.createStreamListeners)(featureStore, clientContext.basicConfiguration.logger, {
            put: initSuccessHandler
          });
          const newSource = new TestDataSource_1.default(new AsyncStoreFacade_1.default(featureStore), this._currentFlags, this._currentSegments, (tds) => {
            this._dataSources.splice(this._dataSources.indexOf(tds));
          }, listeners);
          this._dataSources.push(newSource);
          return newSource;
        };
      }
      /**
       * Creates or copies a {@link TestDataFlagBuilder} for building a test flag configuration.
       *
       * If the flag key has already been defined in this `TestData` instance,
       * then the builder starts with the same configuration that was last
       * provided for this flag.
       *
       * Otherwise, it starts with a new default configuration in which the flag
       * has `true` and `false` variations, is `true` for all users when targeting
       * is turned on and `false` otherwise, and currently has targeting turned on.
       * You can change any of those properties and provide more complex behavior
       * using the `TestDataFlagBuilder` methods.
       *
       * Once you have set the desired configuration, pass the builder to
       * {@link TestData.update}.
       *
       * @param key the flag key
       * @returns a flag configuration builder
       *
       */
      flag(key) {
        if (this._flagBuilders[key]) {
          return this._flagBuilders[key].clone();
        }
        return new TestDataFlagBuilder_1.default(key).booleanFlag();
      }
      /**
       * Updates the test data with the specified flag configuration.
       *
       * This has the same effect as if a flag were added or modified in the
       * LaunchDarkly dashboard. It immediately propagates the flag changes to
       * any `LDClient` instance(s) that you have already configured to use
       * this `TestData`. If no `LDClient` has been started yet, it simply adds
       * this flag to the test data which will be provided to any `LDClient`
       * that you subsequently configure.
       *
       * Any subsequent changes to this `TestDataFlagBuilder` instance do not affect
       * the test data unless you call `update` again.
       *
       * @param flagBuilder a flag configuration builder
       * @return a promise that will resolve when the feature stores are updated
       */
      update(flagBuilder) {
        const flagKey = flagBuilder.getKey();
        const oldItem = this._currentFlags[flagKey];
        const oldVersion = oldItem ? oldItem.version : 0;
        const newFlag = flagBuilder.build(oldVersion + 1);
        this._currentFlags[flagKey] = newFlag;
        this._flagBuilders[flagKey] = flagBuilder.clone();
        return Promise.all(this._dataSources.map((impl) => impl.upsert(VersionedDataKinds_1.default.Features, newFlag)));
      }
      /**
       * Copies a full feature flag data model object into the test data.
       *
       * It immediately propagates the flag change to any `LDClient` instance(s) that you have already
       * configured to use this `TestData`. If no `LDClient` has been started yet, it simply adds this
       * flag to the test data which will be provided to any LDClient that you subsequently configure.
       *
       * Use this method if you need to use advanced flag configuration properties that are not
       * supported by the simplified {@link TestDataFlagBuilder} API. Otherwise it is recommended to use
       * the regular {@link flag}/{@link update} mechanism to avoid dependencies on details of the data
       * model.
       *
       * You cannot make incremental changes with {@link flag}/{@link update} to a flag that has been
       * added in this way; you can only replace it with an entirely new flag configuration.
       *
       * @param flagConfig the flag configuration as a JSON object
       * @return a promise that will resolve when the feature stores are updated
       */
      usePreconfiguredFlag(inConfig) {
        const flagConfig = JSON.parse(JSON.stringify(inConfig));
        const oldItem = this._currentFlags[flagConfig.key];
        const newItem = Object.assign(Object.assign({}, flagConfig), { version: oldItem ? oldItem.version + 1 : flagConfig.version });
        (0, serialization_1.processFlag)(newItem);
        this._currentFlags[flagConfig.key] = newItem;
        return Promise.all(this._dataSources.map((impl) => impl.upsert(VersionedDataKinds_1.default.Features, newItem)));
      }
      /**
       * Copies a full segment data model object into the test data.
       *
       * It immediately propagates the change to any `LDClient` instance(s) that you have already
       * configured to use this `TestData`. If no `LDClient` has been started yet, it simply adds
       * this segment to the test data which will be provided to any LDClient that you subsequently
       * configure.
       *
       * This method is currently the only way to inject segment data, since there is no builder
       * API for segments. It is mainly intended for the SDK's own tests of segment functionality,
       * since application tests that need to produce a desired evaluation state could do so more easily
       * by just setting flag values.
       *
       * @param segmentConfig the segment configuration as a JSON object
       * @return a promise that will resolve when the feature stores are updated
       */
      usePreconfiguredSegment(inConfig) {
        const segmentConfig = JSON.parse(JSON.stringify(inConfig));
        const oldItem = this._currentSegments[segmentConfig.key];
        const newItem = Object.assign(Object.assign({}, segmentConfig), { version: oldItem ? oldItem.version + 1 : segmentConfig.version });
        (0, serialization_1.processSegment)(newItem);
        this._currentSegments[segmentConfig.key] = newItem;
        return Promise.all(this._dataSources.map((impl) => impl.upsert(VersionedDataKinds_1.default.Segments, newItem)));
      }
    };
    exports2.default = TestData;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/index.js
var require_test_data = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/test_data/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TestDataRuleBuilder = exports2.TestDataFlagBuilder = exports2.TestData = void 0;
    var TestData_1 = require_TestData();
    exports2.TestData = TestData_1.default;
    var TestDataFlagBuilder_1 = require_TestDataFlagBuilder();
    exports2.TestDataFlagBuilder = TestDataFlagBuilder_1.default;
    var TestDataRuleBuilder_1 = require_TestDataRuleBuilder();
    exports2.TestDataRuleBuilder = TestDataRuleBuilder_1.default;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/index.js
var require_integrations2 = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/integrations/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FileDataSourceFactory = void 0;
    var FileDataSourceFactory_1 = require_FileDataSourceFactory();
    exports2.FileDataSourceFactory = FileDataSourceFactory_1.default;
    __exportStar(require_test_data(), exports2);
    __exportStar(require_integrations(), exports2);
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/events/NullEventSource.js
var require_NullEventSource = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/events/NullEventSource.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var NullEventSource = class {
      constructor(url, options) {
        this.handlers = {};
        this.closed = false;
        this.url = url;
        this.options = options;
      }
      addEventListener(type, listener) {
        this.handlers[type] = listener;
      }
      close() {
        this.closed = true;
      }
      simulateError(error) {
        const shouldRetry = this.options.errorFilter(error);
        if (!shouldRetry) {
          this.closed = true;
        }
      }
    };
    exports2.default = NullEventSource;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/events/index.js
var require_events = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/events/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NullEventSource = void 0;
    var NullEventSource_1 = require_NullEventSource();
    exports2.NullEventSource = NullEventSource_1.default;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/internal/index.js
var require_internal = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/internal/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TtlCache = void 0;
    var TtlCache_1 = require_TtlCache();
    exports2.TtlCache = TtlCache_1.default;
  }
});

// node_modules/@launchdarkly/js-server-sdk-common/dist/index.js
var require_dist = __commonJS({
  "node_modules/@launchdarkly/js-server-sdk-common/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createMigration = exports2.LDMigrationSuccess = exports2.LDMigrationError = exports2.BigSegmentStoreStatusProviderImpl = exports2.LDClientImpl = exports2.internalServer = exports2.platform = exports2.integrations = void 0;
    var BigSegmentStatusProviderImpl_1 = require_BigSegmentStatusProviderImpl();
    exports2.BigSegmentStoreStatusProviderImpl = BigSegmentStatusProviderImpl_1.default;
    var LDClientImpl_1 = require_LDClientImpl();
    exports2.LDClientImpl = LDClientImpl_1.default;
    var Migration_1 = require_Migration();
    Object.defineProperty(exports2, "createMigration", { enumerable: true, get: function() {
      return Migration_1.createMigration;
    } });
    Object.defineProperty(exports2, "LDMigrationError", { enumerable: true, get: function() {
      return Migration_1.LDMigrationError;
    } });
    Object.defineProperty(exports2, "LDMigrationSuccess", { enumerable: true, get: function() {
      return Migration_1.LDMigrationSuccess;
    } });
    exports2.integrations = require_integrations2();
    exports2.platform = require_cjs();
    __exportStar(require_api(), exports2);
    __exportStar(require_store(), exports2);
    __exportStar(require_events(), exports2);
    __exportStar(require_cjs(), exports2);
    exports2.internalServer = require_internal();
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/Emits.js
var require_Emits = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/Emits.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Emits = void 0;
    function Emits(Base) {
      return class WithEvents extends Base {
        on(eventName, listener) {
          this.emitter.on(eventName, listener);
          return this;
        }
        addListener(eventName, listener) {
          this.emitter.addListener(eventName, listener);
          return this;
        }
        once(eventName, listener) {
          this.emitter.once(eventName, listener);
          return this;
        }
        removeListener(eventName, listener) {
          this.emitter.removeListener(eventName, listener);
          return this;
        }
        off(eventName, listener) {
          this.emitter.off(eventName, listener);
          return this;
        }
        removeAllListeners(event) {
          this.emitter.removeAllListeners(event);
          return this;
        }
        setMaxListeners(n) {
          this.emitter.setMaxListeners(n);
          return this;
        }
        getMaxListeners() {
          return this.emitter.getMaxListeners();
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        listeners(eventName) {
          return this.emitter.listeners(eventName);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        rawListeners(eventName) {
          return this.emitter.rawListeners(eventName);
        }
        emit(eventName, ...args) {
          return this.emitter.emit(eventName, args);
        }
        listenerCount(eventName) {
          return this.emitter.listenerCount(eventName);
        }
        prependListener(eventName, listener) {
          this.emitter.prependListener(eventName, listener);
          return this;
        }
        prependOnceListener(eventName, listener) {
          this.emitter.prependOnceListener(eventName, listener);
          return this;
        }
        eventNames() {
          return this.emitter.eventNames();
        }
      };
    }
    exports2.Emits = Emits;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/BigSegmentsStoreStatusProviderNode.js
var require_BigSegmentsStoreStatusProviderNode = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/BigSegmentsStoreStatusProviderNode.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var events_1 = require("events");
    var Emits_1 = require_Emits();
    var BigSegmentStoreStatusProviderNode = class {
      constructor(_provider) {
        this._provider = _provider;
        this.emitter = new events_1.EventEmitter();
        this._provider.setListener((status) => {
          this.dispatch("change", status);
        });
      }
      getStatus() {
        return this._provider.getStatus();
      }
      requireStatus() {
        return this._provider.requireStatus();
      }
      dispatch(eventType, status) {
        this.emitter.emit(eventType, status);
      }
      on(event, listener) {
        this.emitter.on(event, listener);
        return this;
      }
    };
    exports2.default = (0, Emits_1.Emits)(BigSegmentStoreStatusProviderNode);
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeCrypto.js
var require_NodeCrypto = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeCrypto.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var crypto_1 = require("crypto");
    var NodeCrypto = class {
      createHash(algorithm) {
        return (0, crypto_1.createHash)(algorithm);
      }
      createHmac(algorithm, key) {
        return (0, crypto_1.createHmac)(algorithm, key);
      }
      randomUUID() {
        return (0, crypto_1.randomUUID)();
      }
    };
    exports2.default = NodeCrypto;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeFilesystem.js
var require_NodeFilesystem = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeFilesystem.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var fs = require("fs");
    var fsPromises = fs.promises;
    var NodeFilesystem = class {
      async getFileTimestamp(path3) {
        const stat = await fsPromises.stat(path3);
        return stat.mtimeMs;
      }
      async readFile(path3) {
        return fsPromises.readFile(path3, "utf8");
      }
      watch(path3, callback) {
        return fs.watch(path3, { persistent: false }, (eventType) => {
          callback(eventType, path3);
        });
      }
    };
    exports2.default = NodeFilesystem;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeInfo.js
var require_NodeInfo = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var os2 = require("os");
    var sdkName = "@launchdarkly/node-server-sdk";
    var sdkVersion = "9.11.3";
    function processPlatformName(name) {
      switch (name) {
        case "darwin":
          return "MacOS";
        case "win32":
          return "Windows";
        case "linux":
          return "Linux";
        default:
          return name;
      }
    }
    var NodeInfo = class {
      constructor(_config) {
        this._config = _config;
      }
      platformData() {
        return {
          os: {
            name: processPlatformName(os2.platform()),
            version: os2.version(),
            arch: os2.arch()
          },
          name: "Node",
          additional: {
            nodeVersion: process.versions.node
          }
        };
      }
      sdkData() {
        return {
          name: sdkName,
          version: sdkVersion,
          userAgentBase: "NodeJSClient",
          wrapperName: this._config.wrapperName,
          wrapperVersion: this._config.wrapperVersion
        };
      }
    };
    exports2.default = NodeInfo;
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug(...args) {
          if (!debug.enabled) {
            return;
          }
          const self = debug;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend;
        debug.destroy = createDebug.destroy;
        Object.defineProperty(debug, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        return debug;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module2.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util = require("util");
    exports2.init = init;
    exports2.log = log2;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require("supports-color");
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log2(...args) {
      return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// node_modules/agent-base/dist/helpers.js
var require_helpers = __commonJS({
  "node_modules/agent-base/dist/helpers.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.req = exports2.json = exports2.toBuffer = void 0;
    var http = __importStar(require("http"));
    var https = __importStar(require("https"));
    async function toBuffer(stream) {
      let length = 0;
      const chunks = [];
      for await (const chunk of stream) {
        length += chunk.length;
        chunks.push(chunk);
      }
      return Buffer.concat(chunks, length);
    }
    exports2.toBuffer = toBuffer;
    async function json(stream) {
      const buf = await toBuffer(stream);
      const str = buf.toString("utf8");
      try {
        return JSON.parse(str);
      } catch (_err) {
        const err = _err;
        err.message += ` (input: ${str})`;
        throw err;
      }
    }
    exports2.json = json;
    function req(url, opts = {}) {
      const href = typeof url === "string" ? url : url.href;
      const req2 = (href.startsWith("https:") ? https : http).request(url, opts);
      const promise = new Promise((resolve, reject) => {
        req2.once("response", resolve).once("error", reject).end();
      });
      req2.then = promise.then.bind(promise);
      return req2;
    }
    exports2.req = req;
  }
});

// node_modules/agent-base/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/agent-base/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Agent = void 0;
    var net = __importStar(require("net"));
    var http = __importStar(require("http"));
    var https_1 = require("https");
    __exportStar(require_helpers(), exports2);
    var INTERNAL = /* @__PURE__ */ Symbol("AgentBaseInternalState");
    var Agent = class extends http.Agent {
      constructor(opts) {
        super(opts);
        this[INTERNAL] = {};
      }
      /**
       * Determine whether this is an `http` or `https` request.
       */
      isSecureEndpoint(options) {
        if (options) {
          if (typeof options.secureEndpoint === "boolean") {
            return options.secureEndpoint;
          }
          if (typeof options.protocol === "string") {
            return options.protocol === "https:";
          }
        }
        const { stack } = new Error();
        if (typeof stack !== "string")
          return false;
        return stack.split("\n").some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
      }
      // In order to support async signatures in `connect()` and Node's native
      // connection pooling in `http.Agent`, the array of sockets for each origin
      // has to be updated synchronously. This is so the length of the array is
      // accurate when `addRequest()` is next called. We achieve this by creating a
      // fake socket and adding it to `sockets[origin]` and incrementing
      // `totalSocketCount`.
      incrementSockets(name) {
        if (this.maxSockets === Infinity && this.maxTotalSockets === Infinity) {
          return null;
        }
        if (!this.sockets[name]) {
          this.sockets[name] = [];
        }
        const fakeSocket = new net.Socket({ writable: false });
        this.sockets[name].push(fakeSocket);
        this.totalSocketCount++;
        return fakeSocket;
      }
      decrementSockets(name, socket) {
        if (!this.sockets[name] || socket === null) {
          return;
        }
        const sockets = this.sockets[name];
        const index = sockets.indexOf(socket);
        if (index !== -1) {
          sockets.splice(index, 1);
          this.totalSocketCount--;
          if (sockets.length === 0) {
            delete this.sockets[name];
          }
        }
      }
      // In order to properly update the socket pool, we need to call `getName()` on
      // the core `https.Agent` if it is a secureEndpoint.
      getName(options) {
        const secureEndpoint = this.isSecureEndpoint(options);
        if (secureEndpoint) {
          return https_1.Agent.prototype.getName.call(this, options);
        }
        return super.getName(options);
      }
      createSocket(req, options, cb) {
        const connectOpts = {
          ...options,
          secureEndpoint: this.isSecureEndpoint(options)
        };
        const name = this.getName(connectOpts);
        const fakeSocket = this.incrementSockets(name);
        Promise.resolve().then(() => this.connect(req, connectOpts)).then((socket) => {
          this.decrementSockets(name, fakeSocket);
          if (socket instanceof http.Agent) {
            try {
              return socket.addRequest(req, connectOpts);
            } catch (err) {
              return cb(err);
            }
          }
          this[INTERNAL].currentSocket = socket;
          super.createSocket(req, options, cb);
        }, (err) => {
          this.decrementSockets(name, fakeSocket);
          cb(err);
        });
      }
      createConnection() {
        const socket = this[INTERNAL].currentSocket;
        this[INTERNAL].currentSocket = void 0;
        if (!socket) {
          throw new Error("No socket was returned in the `connect()` function");
        }
        return socket;
      }
      get defaultPort() {
        return this[INTERNAL].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
      }
      set defaultPort(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].defaultPort = v;
        }
      }
      get protocol() {
        return this[INTERNAL].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
      }
      set protocol(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].protocol = v;
        }
      }
    };
    exports2.Agent = Agent;
  }
});

// node_modules/https-proxy-agent/dist/parse-proxy-response.js
var require_parse_proxy_response = __commonJS({
  "node_modules/https-proxy-agent/dist/parse-proxy-response.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseProxyResponse = void 0;
    var debug_1 = __importDefault(require_src());
    var debug = (0, debug_1.default)("https-proxy-agent:parse-proxy-response");
    function parseProxyResponse(socket) {
      return new Promise((resolve, reject) => {
        let buffersLength = 0;
        const buffers = [];
        function read() {
          const b = socket.read();
          if (b)
            ondata(b);
          else
            socket.once("readable", read);
        }
        function cleanup() {
          socket.removeListener("end", onend);
          socket.removeListener("error", onerror);
          socket.removeListener("readable", read);
        }
        function onend() {
          cleanup();
          debug("onend");
          reject(new Error("Proxy connection ended before receiving CONNECT response"));
        }
        function onerror(err) {
          cleanup();
          debug("onerror %o", err);
          reject(err);
        }
        function ondata(b) {
          buffers.push(b);
          buffersLength += b.length;
          const buffered = Buffer.concat(buffers, buffersLength);
          const endOfHeaders = buffered.indexOf("\r\n\r\n");
          if (endOfHeaders === -1) {
            debug("have not received end of HTTP headers yet...");
            read();
            return;
          }
          const headerParts = buffered.slice(0, endOfHeaders).toString("ascii").split("\r\n");
          const firstLine = headerParts.shift();
          if (!firstLine) {
            socket.destroy();
            return reject(new Error("No header received from proxy CONNECT response"));
          }
          const firstLineParts = firstLine.split(" ");
          const statusCode = +firstLineParts[1];
          const statusText = firstLineParts.slice(2).join(" ");
          const headers = {};
          for (const header of headerParts) {
            if (!header)
              continue;
            const firstColon = header.indexOf(":");
            if (firstColon === -1) {
              socket.destroy();
              return reject(new Error(`Invalid header from proxy CONNECT response: "${header}"`));
            }
            const key = header.slice(0, firstColon).toLowerCase();
            const value = header.slice(firstColon + 1).trimStart();
            const current = headers[key];
            if (typeof current === "string") {
              headers[key] = [current, value];
            } else if (Array.isArray(current)) {
              current.push(value);
            } else {
              headers[key] = value;
            }
          }
          debug("got proxy server response: %o %o", firstLine, headers);
          cleanup();
          resolve({
            connect: {
              statusCode,
              statusText,
              headers
            },
            buffered
          });
        }
        socket.on("error", onerror);
        socket.on("end", onend);
        read();
      });
    }
    exports2.parseProxyResponse = parseProxyResponse;
  }
});

// node_modules/https-proxy-agent/dist/index.js
var require_dist3 = __commonJS({
  "node_modules/https-proxy-agent/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.HttpsProxyAgent = void 0;
    var net = __importStar(require("net"));
    var tls = __importStar(require("tls"));
    var assert_1 = __importDefault(require("assert"));
    var debug_1 = __importDefault(require_src());
    var agent_base_1 = require_dist2();
    var url_1 = require("url");
    var parse_proxy_response_1 = require_parse_proxy_response();
    var debug = (0, debug_1.default)("https-proxy-agent");
    var setServernameFromNonIpHost = (options) => {
      if (options.servername === void 0 && options.host && !net.isIP(options.host)) {
        return {
          ...options,
          servername: options.host
        };
      }
      return options;
    };
    var HttpsProxyAgent = class extends agent_base_1.Agent {
      constructor(proxy, opts) {
        super(opts);
        this.options = { path: void 0 };
        this.proxy = typeof proxy === "string" ? new url_1.URL(proxy) : proxy;
        this.proxyHeaders = opts?.headers ?? {};
        debug("Creating new HttpsProxyAgent instance: %o", this.proxy.href);
        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, "");
        const port = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
        this.connectOpts = {
          // Attempt to negotiate http/1.1 for proxy servers that support http/2
          ALPNProtocols: ["http/1.1"],
          ...opts ? omit(opts, "headers") : null,
          host,
          port
        };
      }
      /**
       * Called when the node-core HTTP client library is creating a
       * new HTTP request.
       */
      async connect(req, opts) {
        const { proxy } = this;
        if (!opts.host) {
          throw new TypeError('No "host" provided');
        }
        let socket;
        if (proxy.protocol === "https:") {
          debug("Creating `tls.Socket`: %o", this.connectOpts);
          socket = tls.connect(setServernameFromNonIpHost(this.connectOpts));
        } else {
          debug("Creating `net.Socket`: %o", this.connectOpts);
          socket = net.connect(this.connectOpts);
        }
        const headers = typeof this.proxyHeaders === "function" ? this.proxyHeaders() : { ...this.proxyHeaders };
        const host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host;
        let payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r
`;
        if (proxy.username || proxy.password) {
          const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
          headers["Proxy-Authorization"] = `Basic ${Buffer.from(auth).toString("base64")}`;
        }
        headers.Host = `${host}:${opts.port}`;
        if (!headers["Proxy-Connection"]) {
          headers["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close";
        }
        for (const name of Object.keys(headers)) {
          payload += `${name}: ${headers[name]}\r
`;
        }
        const proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
        socket.write(`${payload}\r
`);
        const { connect, buffered } = await proxyResponsePromise;
        req.emit("proxyConnect", connect);
        this.emit("proxyConnect", connect, req);
        if (connect.statusCode === 200) {
          req.once("socket", resume);
          if (opts.secureEndpoint) {
            debug("Upgrading socket connection to TLS");
            return tls.connect({
              ...omit(setServernameFromNonIpHost(opts), "host", "path", "port"),
              socket
            });
          }
          return socket;
        }
        socket.destroy();
        const fakeSocket = new net.Socket({ writable: false });
        fakeSocket.readable = true;
        req.once("socket", (s) => {
          debug("Replaying proxy buffer for failed request");
          (0, assert_1.default)(s.listenerCount("data") > 0);
          s.push(buffered);
          s.push(null);
        });
        return fakeSocket;
      }
    };
    HttpsProxyAgent.protocols = ["http", "https"];
    exports2.HttpsProxyAgent = HttpsProxyAgent;
    function resume(socket) {
      socket.resume();
    }
    function omit(obj, ...keys) {
      const ret = {};
      let key;
      for (key in obj) {
        if (!keys.includes(key)) {
          ret[key] = obj[key];
        }
      }
      return ret;
    }
  }
});

// node_modules/launchdarkly-eventsource/lib/retry-delay.js
var require_retry_delay = __commonJS({
  "node_modules/launchdarkly-eventsource/lib/retry-delay.js"(exports2, module2) {
    function RetryDelayStrategy(baseDelayMillis, resetIntervalMillis, backoff, jitter) {
      var currentBaseDelay = baseDelayMillis;
      var retryCount = 0;
      var goodSince;
      return {
        nextRetryDelay: function(currentTimeMillis) {
          if (goodSince && resetIntervalMillis && currentTimeMillis - goodSince >= resetIntervalMillis) {
            retryCount = 0;
          }
          goodSince = null;
          var delay = backoff ? backoff(currentBaseDelay, retryCount) : currentBaseDelay;
          retryCount++;
          return jitter ? jitter(delay) : delay;
        },
        setGoodSince: function(goodSinceTimeMillis) {
          goodSince = goodSinceTimeMillis;
        },
        setBaseDelay: function(baseDelay) {
          currentBaseDelay = baseDelay;
          retryCount = 0;
        }
      };
    }
    function defaultBackoff(maxDelayMillis) {
      return function(baseDelayMillis, retryCount) {
        var d = baseDelayMillis * Math.pow(2, retryCount);
        return d > maxDelayMillis ? maxDelayMillis : d;
      };
    }
    function defaultJitter(ratio) {
      return function(computedDelayMillis) {
        return computedDelayMillis - Math.trunc(Math.random() * ratio * computedDelayMillis);
      };
    }
    module2.exports = {
      RetryDelayStrategy,
      defaultBackoff,
      defaultJitter
    };
  }
});

// node_modules/launchdarkly-eventsource/lib/capacity.js
var require_capacity = __commonJS({
  "node_modules/launchdarkly-eventsource/lib/capacity.js"(exports2, module2) {
    function CalculateCapacity(currentCapacity, requiredCapacity, maxOverAllocation) {
      if (requiredCapacity > currentCapacity) {
        let newCapacity = requiredCapacity;
        if (newCapacity < Buffer.poolSize) {
          newCapacity = Buffer.poolSize;
        }
        let doubleCapacity = currentCapacity * 2;
        if (newCapacity < doubleCapacity) {
          newCapacity = doubleCapacity;
        }
        const overAllocation = newCapacity - requiredCapacity;
        if (overAllocation > maxOverAllocation) {
          newCapacity = requiredCapacity + maxOverAllocation;
        }
        return [true, newCapacity];
      }
      return [false, 0];
    }
    module2.exports = CalculateCapacity;
  }
});

// node_modules/launchdarkly-eventsource/lib/eventsource.js
var require_eventsource = __commonJS({
  "node_modules/launchdarkly-eventsource/lib/eventsource.js"(exports2, module2) {
    var retryDelay = require_retry_delay();
    var CalculateCapacity = require_capacity();
    var parse = require("url").parse;
    var URL = require("url").URL;
    var events = require("events");
    var https = require("https");
    var http = require("http");
    var util = require("util");
    var httpsOptions = [
      "pfx",
      "key",
      "passphrase",
      "cert",
      "ca",
      "ciphers",
      "rejectUnauthorized",
      "secureProtocol",
      "servername",
      "checkServerIdentity"
    ];
    var bom = [239, 187, 191];
    var colon = 58;
    var space = 32;
    var lineFeed = 10;
    var carriageReturn = 13;
    var MAX_OVER_ALLOCATION = 1024 * 1024;
    function hasBom(buf) {
      return bom.every(function(charCode, index) {
        return buf[index] === charCode;
      });
    }
    function once(cb) {
      let called = false;
      return (...params) => {
        if (!called) {
          called = true;
          cb(...params);
        }
      };
    }
    function EventSource(url, eventSourceInitDict) {
      var readyState = EventSource.CONNECTING;
      var config = eventSourceInitDict || {};
      Object.defineProperty(this, "readyState", {
        get: function() {
          return readyState;
        }
      });
      Object.defineProperty(this, "url", {
        get: function() {
          return url;
        }
      });
      var self = this;
      self.reconnectInterval = 1e3;
      var req;
      var lastEventId = "";
      if (config.headers && config.headers["Last-Event-ID"]) {
        lastEventId = config.headers["Last-Event-ID"];
      }
      var discardTrailingNewline = false;
      var data, eventName, eventId;
      var reconnectUrl = null;
      var retryDelayStrategy = new retryDelay.RetryDelayStrategy(
        config.initialRetryDelayMillis !== null && config.initialRetryDelayMillis !== void 0 ? config.initialRetryDelayMillis : 1e3,
        config.retryResetIntervalMillis,
        config.maxBackoffMillis ? retryDelay.defaultBackoff(config.maxBackoffMillis) : null,
        config.jitterRatio ? retryDelay.defaultJitter(config.jitterRatio) : null
      );
      var streamOriginUrl = new URL(url).origin;
      let reconnectTimer;
      function makeRequestUrlAndOptions() {
        var actualUrl = url;
        var options = { headers: {} };
        if (!config.skipDefaultHeaders) {
          options.headers["Cache-Control"] = "no-cache";
          options.headers["Accept"] = "text/event-stream";
        }
        if (lastEventId) options.headers["Last-Event-ID"] = lastEventId;
        if (config.headers) {
          for (var key in config.headers) {
            if (config.headers.hasOwnProperty(key)) {
              options.headers[key] = config.headers[key];
            }
          }
        }
        options.rejectUnauthorized = !!config.rejectUnauthorized;
        if (config.proxy) {
          actualUrl = null;
          var parsedUrl = parse(url);
          var proxy = parse(config.proxy);
          options.protocol = proxy.protocol === "https:" ? "https:" : "http:";
          options.path = url;
          options.headers.Host = parsedUrl.host;
          options.hostname = proxy.hostname;
          options.host = proxy.host;
          options.port = proxy.port;
          if (proxy.username) {
            options.auth = proxy.username + ":" + proxy.password;
          }
        }
        if (config.agent) {
          options.agent = config.agent;
        }
        if (config.https) {
          for (var optName in config.https) {
            if (httpsOptions.indexOf(optName) === -1) {
              continue;
            }
            var option = config.https[optName];
            if (option !== void 0) {
              options[optName] = option;
            }
          }
        }
        if (config.withCredentials !== void 0) {
          options.withCredentials = config.withCredentials;
        }
        if (config.method) {
          options.method = config.method;
        }
        return { url: actualUrl, options };
      }
      function defaultErrorFilter(error) {
        if (error.status) {
          var s = error.status;
          return s === 500 || s === 502 || s === 503 || s === 504;
        }
        return true;
      }
      function failed(error) {
        if (readyState === EventSource.CLOSED) {
          return;
        }
        var errorEvent = error ? new Event("error", error) : new Event("end", { message: "the request completed unexpectedly" });
        var shouldRetry = (config.errorFilter || defaultErrorFilter)(errorEvent);
        if (shouldRetry) {
          readyState = EventSource.CONNECTING;
          _emit(errorEvent);
          scheduleReconnect();
        } else {
          _emit(errorEvent);
          readyState = EventSource.CLOSED;
          _emit(new Event("closed"));
        }
      }
      function scheduleReconnect() {
        if (readyState !== EventSource.CONNECTING) return;
        var delay = retryDelayStrategy.nextRetryDelay((/* @__PURE__ */ new Date()).getTime());
        if (reconnectUrl) {
          url = reconnectUrl;
          reconnectUrl = null;
        }
        var event = new Event("retrying");
        event.delayMillis = delay;
        _emit(event);
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(function() {
          if (readyState !== EventSource.CONNECTING) return;
          connect();
        }, delay);
      }
      function destroyRequest() {
        if (req.destroy) req.destroy();
        if (req.xhr && req.xhr.abort) req.xhr.abort();
      }
      function connect() {
        var urlAndOptions = makeRequestUrlAndOptions();
        var isSecure = urlAndOptions.options.protocol === "https:" || urlAndOptions.url && urlAndOptions.url.startsWith("https:");
        const failOnce = once(failed);
        var callback = function(res) {
          if (res.statusCode === 301 || res.statusCode === 307) {
            if (!res.headers.location) {
              failOnce({ status: res.statusCode, headers: res.headers, message: res.statusMessage });
              return;
            }
            if (res.statusCode === 307) reconnectUrl = url;
            url = res.headers.location;
            process.nextTick(connect);
            return;
          }
          if (res.statusCode !== 200) {
            failOnce({ status: res.statusCode, headers: res.headers, message: res.statusMessage });
            return;
          }
          data = "";
          eventName = "";
          eventId = void 0;
          readyState = EventSource.OPEN;
          res.on("close", function() {
            res.removeAllListeners("close");
            res.removeAllListeners("end");
            failOnce();
          });
          res.on("end", function() {
            res.removeAllListeners("close");
            res.removeAllListeners("end");
            failOnce();
          });
          _emit(new Event("open", { headers: res.headers }));
          var isFirst = true;
          var buf;
          var startingPos = 0;
          var startingFieldLength = -1;
          let sizeUsed = 0;
          res.on("data", function(chunk) {
            if (!buf) {
              buf = chunk;
              if (isFirst && hasBom(buf)) {
                buf = buf.slice(bom.length);
                sizeUsed -= bom.length;
              }
            } else {
              const [resize, newCapacity] = CalculateCapacity(buf.length, chunk.length + sizeUsed, MAX_OVER_ALLOCATION);
              if (resize) {
                let newBuffer = Buffer.alloc(newCapacity);
                buf.copy(newBuffer, 0, 0, sizeUsed);
                buf = newBuffer;
              }
              chunk.copy(buf, sizeUsed);
            }
            sizeUsed += chunk.length;
            isFirst = false;
            let pos = 0;
            const length = sizeUsed;
            while (pos < length) {
              if (discardTrailingNewline) {
                if (buf[pos] === lineFeed) {
                  ++pos;
                }
                discardTrailingNewline = false;
              }
              var lineLength = -1;
              var fieldLength = startingFieldLength;
              var c;
              for (var i2 = startingPos; lineLength < 0 && i2 < length; ++i2) {
                c = buf[i2];
                if (c === colon) {
                  if (fieldLength < 0) {
                    fieldLength = i2 - pos;
                  }
                } else if (c === carriageReturn) {
                  discardTrailingNewline = true;
                  lineLength = i2 - pos;
                } else if (c === lineFeed) {
                  lineLength = i2 - pos;
                }
              }
              if (lineLength < 0) {
                startingPos = length - pos;
                startingFieldLength = fieldLength;
                break;
              } else {
                startingPos = 0;
                startingFieldLength = -1;
              }
              parseEventStreamLine(buf, pos, fieldLength, lineLength);
              pos += lineLength + 1;
            }
            if (pos === length) {
              buf = void 0;
              sizeUsed = 0;
            } else if (pos > 0) {
              buf = buf.slice(pos);
              sizeUsed = sizeUsed - pos;
            }
          });
        };
        var api = isSecure ? https : http;
        req = urlAndOptions.url ? api.request(urlAndOptions.url, urlAndOptions.options, callback) : api.request(urlAndOptions.options, callback);
        if (config.readTimeoutMillis) {
          req.setTimeout(config.readTimeoutMillis);
        }
        if (config.body) {
          req.write(config.body);
        }
        req.on("error", function(err) {
          failOnce({ message: err.message });
        });
        req.on("timeout", function() {
          failOnce({ message: "Read timeout, received no data in " + config.readTimeoutMillis + "ms, assuming connection is dead" });
          destroyRequest();
        });
        if (req.setNoDelay) req.setNoDelay(true);
        req.end();
      }
      connect();
      function _emit(event) {
        if (event) {
          self.emit(event.type, event);
        }
      }
      this._close = function() {
        clearTimeout(reconnectTimer);
        if (readyState === EventSource.CLOSED) return;
        readyState = EventSource.CLOSED;
        destroyRequest();
        _emit(new Event("closed"));
      };
      function receivedEvent(event) {
        retryDelayStrategy.setGoodSince((/* @__PURE__ */ new Date()).getTime());
        _emit(event);
      }
      function parseEventStreamLine(buf, pos, fieldLength, lineLength) {
        if (lineLength === 0) {
          if (data.length > 0) {
            var type = eventName || "message";
            if (eventId !== void 0) {
              lastEventId = eventId;
            }
            var event = new MessageEvent(type, {
              data: data.slice(0, -1),
              // remove trailing newline
              lastEventId,
              origin: streamOriginUrl
            });
            data = "";
            eventId = void 0;
            receivedEvent(event);
          }
          eventName = void 0;
        } else {
          var noValue = fieldLength < 0;
          var step = 0;
          var field = buf.slice(pos, pos + (noValue ? lineLength : fieldLength)).toString();
          if (noValue) {
            step = lineLength;
          } else if (buf[pos + fieldLength + 1] !== space) {
            step = fieldLength + 1;
          } else {
            step = fieldLength + 2;
          }
          pos += step;
          var valueLength = lineLength - step;
          var value = buf.slice(pos, pos + valueLength).toString();
          if (field === "data") {
            data += value + "\n";
          } else if (field === "event") {
            eventName = value;
          } else if (field === "id") {
            if (!value.includes("\0")) {
              eventId = value;
            }
          } else if (field === "retry") {
            var retry = parseInt(value, 10);
            if (!Number.isNaN(retry)) {
              self.reconnectInterval = retry;
              retryDelayStrategy.setBaseDelay(retry);
            }
          }
        }
      }
    }
    module2.exports = {
      EventSource
    };
    util.inherits(EventSource, events.EventEmitter);
    EventSource.prototype.constructor = EventSource;
    ["open", "end", "error", "message", "retrying", "closed"].forEach(function(method) {
      Object.defineProperty(EventSource.prototype, "on" + method, {
        /**
         * Returns the current listener
         *
         * @return {Mixed} the set function or undefined
         * @api private
         */
        get: function get() {
          var listener = this.listeners(method)[0];
          return listener ? listener._listener ? listener._listener : listener : void 0;
        },
        /**
         * Start listening for events
         *
         * @param {Function} listener the listener
         * @return {Mixed} the set function or undefined
         * @api private
         */
        set: function set(listener) {
          this.removeAllListeners(method);
          this.addEventListener(method, listener);
        }
      });
    });
    Object.defineProperty(EventSource, "CONNECTING", { enumerable: true, value: 0 });
    Object.defineProperty(EventSource, "OPEN", { enumerable: true, value: 1 });
    Object.defineProperty(EventSource, "CLOSED", { enumerable: true, value: 2 });
    EventSource.prototype.CONNECTING = 0;
    EventSource.prototype.OPEN = 1;
    EventSource.prototype.CLOSED = 2;
    var supportedOptions = [
      "errorFilter",
      "headers",
      "https",
      "initialRetryDelayMillis",
      "jitterRatio",
      "maxBackoffMillis",
      "method",
      "proxy",
      "retryResetIntervalMillis",
      "skipDefaultHeaders",
      "withCredentials"
    ];
    var supportedOptionsObject = {};
    for (i in supportedOptions) {
      Object.defineProperty(supportedOptionsObject, supportedOptions[i], { enumerable: true, value: true });
    }
    var i;
    Object.defineProperty(EventSource, "supportedOptions", { enumerable: true, value: supportedOptionsObject });
    EventSource.prototype.close = function() {
      this._close();
    };
    EventSource.prototype.addEventListener = function addEventListener(type, listener) {
      if (typeof listener === "function") {
        listener._listener = listener;
        this.on(type, listener);
      }
    };
    EventSource.prototype.dispatchEvent = function dispatchEvent(event) {
      if (!event.type) {
        throw new Error("UNSPECIFIED_EVENT_TYPE_ERR");
      }
      this.emit(event.type, event.detail);
    };
    EventSource.prototype.removeEventListener = function removeEventListener(type, listener) {
      if (typeof listener === "function") {
        listener._listener = void 0;
        this.removeListener(type, listener);
      }
    };
    function Event(type, optionalProperties) {
      Object.defineProperty(this, "type", { writable: false, value: type, enumerable: true });
      if (optionalProperties) {
        for (var f in optionalProperties) {
          if (optionalProperties.hasOwnProperty(f)) {
            Object.defineProperty(this, f, { writable: false, value: optionalProperties[f], enumerable: true });
          }
        }
      }
    }
    function MessageEvent(type, eventInitDict) {
      Object.defineProperty(this, "type", { writable: false, value: type, enumerable: true });
      for (var f in eventInitDict) {
        if (eventInitDict.hasOwnProperty(f)) {
          Object.defineProperty(this, f, { writable: false, value: eventInitDict[f], enumerable: true });
        }
      }
    }
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/platform/HeaderWrapper.js
var require_HeaderWrapper = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/platform/HeaderWrapper.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var HeaderWrapper = class {
      constructor(headers) {
        this._headers = headers;
      }
      _headerVal(name) {
        const val = this._headers[name];
        if (val === void 0 || val === null) {
          return null;
        }
        if (Array.isArray(val)) {
          return val.join(", ");
        }
        return val;
      }
      get(name) {
        return this._headerVal(name);
      }
      keys() {
        return Object.keys(this._headers);
      }
      // We want to use generators here for the simplicity of maintaining
      // this interface. Also they aren't expected to be high frequency usage.
      *values() {
        for (const key of this.keys()) {
          const val = this.get(key);
          if (val !== null) {
            yield val;
          }
        }
      }
      *entries() {
        for (const key of this.keys()) {
          const val = this.get(key);
          if (val !== null) {
            yield [key, val];
          }
        }
      }
      has(name) {
        return Object.prototype.hasOwnProperty.call(this._headers, name);
      }
    };
    exports2.default = HeaderWrapper;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeResponse.js
var require_NodeResponse = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeResponse.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require("stream");
    var zlib = require("zlib");
    var HeaderWrapper_1 = require_HeaderWrapper();
    var NodeResponse = class {
      constructor(res) {
        this.chunks = [];
        this.memoryStream = new stream_1.Writable({
          decodeStrings: true,
          write: (chunk, _enc, next) => {
            this.chunks.push(chunk);
            next();
          }
        });
        this.listened = false;
        this.headers = new HeaderWrapper_1.default(res.headers);
        this.status = res.statusCode || 0;
        this.incomingMessage = res;
        this.promise = new Promise((resolve, reject) => {
          const pipelineCallback = (err) => {
            if (err) {
              this.rejection = err;
              if (this.listened) {
                reject(err);
              }
            }
            return resolve(Buffer.concat(this.chunks).toString());
          };
          switch (res.headers["content-encoding"]) {
            case "gzip":
              (0, stream_1.pipeline)(res, zlib.createGunzip(), this.memoryStream, pipelineCallback);
              break;
            default:
              (0, stream_1.pipeline)(res, this.memoryStream, pipelineCallback);
              break;
          }
        });
      }
      async _wrappedWait() {
        this.listened = true;
        if (this.rejection) {
          throw this.rejection;
        }
        return this.promise;
      }
      text() {
        return this._wrappedWait();
      }
      async json() {
        const stringValue = await this._wrappedWait();
        return JSON.parse(stringValue);
      }
    };
    exports2.default = NodeResponse;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeRequests.js
var require_NodeRequests = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodeRequests.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var http = require("http");
    var https = require("https");
    var https_proxy_agent_1 = require_dist3();
    var launchdarkly_eventsource_1 = require_eventsource();
    var url_1 = require("url");
    var util_1 = require("util");
    var zlib = require("zlib");
    var NodeResponse_1 = require_NodeResponse();
    var gzip = (0, util_1.promisify)(zlib.gzip);
    function processTlsOptions(tlsOptions) {
      const options = {
        ca: tlsOptions.ca,
        cert: tlsOptions.cert,
        checkServerIdentity: tlsOptions.checkServerIdentity,
        ciphers: tlsOptions.ciphers,
        // Our interface says object for the pfx object. But the node
        // type is more strict. This is also true for the key and KeyObject.
        // @ts-ignore
        pfx: tlsOptions.pfx,
        // @ts-ignore
        key: tlsOptions.key,
        passphrase: tlsOptions.passphrase,
        rejectUnauthorized: tlsOptions.rejectUnauthorized,
        secureProtocol: tlsOptions.secureProtocol,
        servername: tlsOptions.servername
      };
      Object.keys(options).forEach((key) => {
        if (options[key] === void 0) {
          delete options[key];
        }
      });
      return options;
    }
    function processProxyOptions(proxyOptions, additional = {}) {
      var _a;
      const proxyUrl = (0, url_1.format)({
        protocol: ((_a = proxyOptions.scheme) === null || _a === void 0 ? void 0 : _a.startsWith("https")) ? "https:" : "http:",
        slashes: true,
        hostname: proxyOptions.host,
        port: proxyOptions.port
      });
      const parsedOptions = Object.assign({}, additional);
      if (proxyOptions.auth) {
        parsedOptions.headers = {
          "Proxy-Authorization": `Basic ${Buffer.from(proxyOptions.auth).toString("base64")}`
        };
      }
      Object.keys(parsedOptions).forEach((key) => {
        if (parsedOptions[key] === void 0) {
          delete parsedOptions[key];
        }
      });
      return new https_proxy_agent_1.HttpsProxyAgent(proxyUrl, parsedOptions);
    }
    function createAgent(tlsOptions, proxyOptions, logger) {
      var _a;
      if (!((_a = proxyOptions === null || proxyOptions === void 0 ? void 0 : proxyOptions.auth) === null || _a === void 0 ? void 0 : _a.startsWith("https")) && tlsOptions) {
        logger === null || logger === void 0 ? void 0 : logger.warn("Proxy configured with TLS options, but is not using an https auth.");
      }
      if (tlsOptions) {
        const agentOptions = processTlsOptions(tlsOptions);
        if (proxyOptions) {
          return processProxyOptions(proxyOptions, agentOptions);
        }
        return new https.Agent(agentOptions);
      }
      if (proxyOptions) {
        return processProxyOptions(proxyOptions);
      }
      return void 0;
    }
    var NodeRequests = class {
      constructor(tlsOptions, proxyOptions, logger, enableEventCompression) {
        this._hasProxy = false;
        this._hasProxyAuth = false;
        this._enableBodyCompression = false;
        this._agent = createAgent(tlsOptions, proxyOptions, logger);
        this._hasProxy = !!proxyOptions;
        this._hasProxyAuth = !!(proxyOptions === null || proxyOptions === void 0 ? void 0 : proxyOptions.auth);
        this._enableBodyCompression = !!enableEventCompression;
      }
      async fetch(url, options = {}) {
        var _a, _b;
        const isSecure = url.startsWith("https://");
        const impl = isSecure ? https : http;
        const headers = Object.assign({}, options.headers);
        let bodyData = options.body;
        if (((_a = options.method) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "get") {
          headers["accept-encoding"] = "gzip";
        } else if (this._enableBodyCompression && !!options.compressBodyIfPossible && ((_b = options.method) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "post" && options.body) {
          headers["content-encoding"] = "gzip";
          bodyData = await gzip(Buffer.from(options.body, "utf8"));
        }
        return new Promise((resolve, reject) => {
          const req = impl.request(url, {
            timeout: options.timeout,
            headers,
            method: options.method,
            agent: this._agent
          }, (res) => resolve(new NodeResponse_1.default(res)));
          if (bodyData) {
            req.write(bodyData);
          }
          req.on("error", (err) => {
            reject(err);
          });
          req.on("timeout", () => {
            req.destroy(new Error("Request timed out"));
          });
          req.end();
        });
      }
      createEventSource(url, eventSourceInitDict) {
        const expandedOptions = Object.assign(Object.assign({}, eventSourceInitDict), { agent: this._agent, tlsParams: this._tlsOptions, maxBackoffMillis: 30 * 1e3, jitterRatio: 0.5 });
        return new launchdarkly_eventsource_1.EventSource(url, expandedOptions);
      }
      getEventSourceCapabilities() {
        return {
          readTimeout: true,
          headers: true,
          customMethod: true
        };
      }
      usingProxy() {
        return this._hasProxy;
      }
      usingProxyAuth() {
        return this._hasProxyAuth;
      }
    };
    exports2.default = NodeRequests;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodePlatform.js
var require_NodePlatform = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/platform/NodePlatform.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var NodeCrypto_1 = require_NodeCrypto();
    var NodeFilesystem_1 = require_NodeFilesystem();
    var NodeInfo_1 = require_NodeInfo();
    var NodeRequests_1 = require_NodeRequests();
    var NodePlatform = class {
      constructor(options) {
        this.fileSystem = new NodeFilesystem_1.default();
        this.crypto = new NodeCrypto_1.default();
        this.info = new NodeInfo_1.default(options);
        this.requests = new NodeRequests_1.default(options.tlsParams, options.proxyOptions, options.logger, options.enableEventCompression);
      }
    };
    exports2.default = NodePlatform;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/LDClientNode.js
var require_LDClientNode = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/LDClientNode.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var events_1 = require("events");
    var util_1 = require("util");
    var js_server_sdk_common_1 = require_dist();
    var BigSegmentsStoreStatusProviderNode_1 = require_BigSegmentsStoreStatusProviderNode();
    var NodePlatform_1 = require_NodePlatform();
    var LDClientNode = class extends js_server_sdk_common_1.LDClientImpl {
      constructor(sdkKey, options) {
        const fallbackLogger = new js_server_sdk_common_1.BasicLogger({
          level: "info",
          // eslint-disable-next-line no-console
          destination: console.error,
          formatter: util_1.format
        });
        const logger = options.logger ? new js_server_sdk_common_1.SafeLogger(options.logger, fallbackLogger) : fallbackLogger;
        const emitter = new events_1.EventEmitter();
        const pluginValidator = js_server_sdk_common_1.TypeValidators.createTypeArray("LDPlugin", {});
        const plugins = [];
        if (options.plugins) {
          if (pluginValidator.is(options.plugins)) {
            plugins.push(...options.plugins);
          } else {
            logger.warn("Could not validate plugins.");
          }
        }
        const baseOptions = Object.assign(Object.assign({}, options), { logger });
        delete baseOptions.plugins;
        const platform = new NodePlatform_1.default(Object.assign(Object.assign({}, options), { logger }));
        const instanceId = platform.crypto.randomUUID();
        super(sdkKey, platform, baseOptions, {
          onError: (err) => {
            if (emitter.listenerCount("error")) {
              emitter.emit("error", err);
            } else {
              logger.error(err.message);
            }
          },
          onFailed: (err) => {
            emitter.emit("failed", err);
          },
          onReady: () => {
            emitter.emit("ready");
          },
          onUpdate: (key) => {
            emitter.emit("update", { key });
            emitter.emit(`update:${key}`, { key });
          },
          hasEventListeners: () => emitter.eventNames().some((name) => name === "update" || typeof name === "string" && name.startsWith("update:"))
        }, {
          getImplementationHooks: (environmentMetadata) => js_server_sdk_common_1.internal.safeGetHooks(logger, environmentMetadata, plugins),
          instanceId
        });
        this.emitter = emitter;
        this.bigSegmentStoreStatusProvider = new BigSegmentsStoreStatusProviderNode_1.default(this.bigSegmentStatusProviderInternal);
        js_server_sdk_common_1.internal.safeRegisterPlugins(logger, this.environmentMetadata, this, plugins);
      }
      // #region: EventEmitter
      on(eventName, listener) {
        this.emitter.on(eventName, listener);
        return this;
      }
      addListener(eventName, listener) {
        this.emitter.addListener(eventName, listener);
        return this;
      }
      once(eventName, listener) {
        this.emitter.once(eventName, listener);
        return this;
      }
      removeListener(eventName, listener) {
        this.emitter.removeListener(eventName, listener);
        return this;
      }
      off(eventName, listener) {
        this.emitter.off(eventName, listener);
        return this;
      }
      removeAllListeners(event) {
        this.emitter.removeAllListeners(event);
        return this;
      }
      setMaxListeners(n) {
        this.emitter.setMaxListeners(n);
        return this;
      }
      getMaxListeners() {
        return this.emitter.getMaxListeners();
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      listeners(eventName) {
        return this.emitter.listeners(eventName);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      rawListeners(eventName) {
        return this.emitter.rawListeners(eventName);
      }
      emit(eventName, ...args) {
        return this.emitter.emit(eventName, args);
      }
      listenerCount(eventName) {
        return this.emitter.listenerCount(eventName);
      }
      prependListener(eventName, listener) {
        this.emitter.prependListener(eventName, listener);
        return this;
      }
      prependOnceListener(eventName, listener) {
        this.emitter.prependOnceListener(eventName, listener);
        return this;
      }
      eventNames() {
        return this.emitter.eventNames();
      }
    };
    exports2.default = LDClientNode;
  }
});

// node_modules/@launchdarkly/node-server-sdk/dist/src/index.js
var require_src2 = __commonJS({
  "node_modules/@launchdarkly/node-server-sdk/dist/src/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.basicLogger = exports2.init = void 0;
    var js_server_sdk_common_1 = require_dist();
    var LDClientNode_1 = require_LDClientNode();
    __exportStar(require_dist(), exports2);
    function init(sdkKey, options = {}) {
      return new LDClientNode_1.default(sdkKey, options);
    }
    exports2.init = init;
    function basicLogger(options) {
      return new js_server_sdk_common_1.BasicLogger(options);
    }
    exports2.basicLogger = basicLogger;
  }
});

// src/hooks/cursor-hook.mjs
var import_node_fs2 = require("node:fs");
var import_node_child_process = require("node:child_process");
var import_node_path2 = __toESM(require("node:path"), 1);

// src/lib/ldTrack.mjs
var import_node_fs = require("node:fs");
var import_node_crypto = require("node:crypto");
var import_node_os = __toESM(require("node:os"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_url = require("node:url");
var import_meta = {};
var moduleDir = (() => {
  try {
    return import_node_path.default.dirname((0, import_node_url.fileURLToPath)(import_meta.url));
  } catch {
    return typeof __dirname !== "undefined" ? __dirname : process.cwd();
  }
})();
var PROJECT_ROOT = import_node_path.default.resolve(moduleDir, "..", "..");
var USER_CONFIG_PATH = import_node_path.default.join(import_node_os.default.homedir(), ".cursor", "ld-agentcontrol.json");
var USER_STATE_DIR = import_node_path.default.join(import_node_os.default.homedir(), ".cursor", "ld-agentcontrol-state");
var EVENT_KEYS = {
  durationTotal: "$ld:ai:duration:total",
  tokensTtf: "$ld:ai:tokens:ttf",
  tokensTotal: "$ld:ai:tokens:total",
  tokensInput: "$ld:ai:tokens:input",
  tokensOutput: "$ld:ai:tokens:output",
  generationSuccess: "$ld:ai:generation:success",
  generationError: "$ld:ai:generation:error",
  feedbackPositive: "$ld:ai:feedback:user:positive",
  feedbackNegative: "$ld:ai:feedback:user:negative",
  toolCall: "$ld:ai:tool_call"
};
function loadEnv(envPath = import_node_path.default.join(PROJECT_ROOT, ".env")) {
  if (!(0, import_node_fs.existsSync)(envPath)) return;
  for (const line of (0, import_node_fs.readFileSync)(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== void 0) continue;
    process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
  }
}
function loadBridgeConfig(configPath = import_node_path.default.join(PROJECT_ROOT, "bridge.config.json")) {
  const config = JSON.parse((0, import_node_fs.readFileSync)(configPath, "utf8"));
  for (const field of ["aiConfigKey", "aiConfigVersion", "providerName", "models"]) {
    if (config[field] === void 0) {
      throw new Error(`${import_node_path.default.basename(configPath)} is missing required field "${field}"`);
    }
  }
  return config;
}
function resolveRuntime() {
  const explicit = process.env.LD_AGENTCONTROL_CONFIG;
  if (explicit !== "repo") {
    const userPath = explicit || ((0, import_node_fs.existsSync)(USER_CONFIG_PATH) ? USER_CONFIG_PATH : null);
    if (userPath) {
      const config = loadBridgeConfig(userPath);
      return {
        mode: "user",
        configPath: userPath,
        config,
        stateDir: config.stateDir ?? USER_STATE_DIR,
        sdkKey: config.sdkKey ?? process.env.LD_SDK_KEY
      };
    }
  }
  loadEnv();
  return {
    mode: "repo",
    configPath: import_node_path.default.join(PROJECT_ROOT, "bridge.config.json"),
    config: loadBridgeConfig(),
    stateDir: import_node_path.default.join(PROJECT_ROOT, ".state"),
    sdkKey: process.env.LD_SDK_KEY
  };
}
var VARIANT_SUFFIXES = /-(thinking|xhigh|high|medium|low|max|fast)$/;
function resolveVariation(config, modelName) {
  if (!modelName) return config.fallbackVariation ?? null;
  if (config.models[modelName] !== void 0) return config.models[modelName];
  let name = String(modelName).toLowerCase().replaceAll(".", "-");
  for (; ; ) {
    if (config.models[name] !== void 0) return config.models[name];
    const match = name.match(VARIANT_SUFFIXES);
    if (!match) return config.fallbackVariation ?? null;
    name = name.slice(0, -match[0].length);
  }
}
function buildTrackData({
  runId = (0, import_node_crypto.randomUUID)(),
  configKey,
  variationKey,
  version,
  modelName,
  providerName,
  extra = {}
}) {
  return {
    runId,
    configKey,
    variationKey,
    version,
    modelName,
    providerName,
    ...extra
  };
}
function userContext(email) {
  return { kind: "user", key: email };
}
function log(...parts) {
  process.stderr.write(`[ldTrack] ${parts.join(" ")}
`);
}
async function createLdTracker({
  dryRun = process.env.DRY_RUN === "1",
  sdkKey = process.env.LD_SDK_KEY
} = {}) {
  if (dryRun) {
    return {
      dryRun: true,
      track(eventKey, context, data, metricValue) {
        log(`DRY_RUN track ${eventKey}`, JSON.stringify({ context, data, metricValue }));
      },
      async evaluate(flagKey, context) {
        log(`DRY_RUN evaluate ${flagKey}`, JSON.stringify(context));
        return null;
      },
      async close() {
      }
    };
  }
  if (!sdkKey) throw new Error("no LD SDK key configured (and DRY_RUN is not enabled)");
  const { init } = await Promise.resolve().then(() => __toESM(require_src2(), 1));
  const client = init(sdkKey, {
    stream: false,
    diagnosticOptOut: true,
    logger: { error: log, warn: log, info: () => {
    }, debug: () => {
    } }
  });
  let initialized = true;
  try {
    await client.waitForInitialization({ timeout: 5 });
  } catch {
    initialized = false;
    log("client initialization timed out/failed; proceeding (events still flush)");
  }
  return {
    dryRun: false,
    track(eventKey, context, data, metricValue) {
      client.track(eventKey, context, data, metricValue);
    },
    /**
     * Evaluate an AI Config flag so LD serves the variation (targeting rules
     * match the context's `cursorModel` attribute). Returns the flag value
     * (with _ldMeta) or null when evaluation isn't possible — callers fall
     * back to post-hoc attribution.
     */
    async evaluate(flagKey, context) {
      if (!initialized) return null;
      try {
        const value = await client.variation(flagKey, context, null);
        return value?._ldMeta?.variationKey ? value : null;
      } catch (err) {
        log(`evaluate failed: ${err.message}`);
        return null;
      }
    },
    async close({ flushTimeoutMs = 3e3 } = {}) {
      try {
        await Promise.race([
          client.flush(),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("flush timeout")), flushTimeoutMs).unref?.()
          )
        ]);
      } catch (err) {
        log(`flush failed: ${err.message}`);
      }
      client.close();
    }
  };
}
function trackTokens(tracker, context, trackData, { total, input, output }) {
  if (total > 0) tracker.track(EVENT_KEYS.tokensTotal, context, trackData, total);
  if (input > 0) tracker.track(EVENT_KEYS.tokensInput, context, trackData, input);
  if (output > 0) tracker.track(EVENT_KEYS.tokensOutput, context, trackData, output);
}

// src/hooks/cursor-hook.mjs
var STALE_PENDING_MS = 24 * 60 * 60 * 1e3;
var cachedRuntime;
function runtime() {
  if (!cachedRuntime) {
    try {
      cachedRuntime = resolveRuntime();
    } catch (err) {
      cachedRuntime = {
        mode: "broken",
        error: err,
        config: null,
        stateDir: import_node_path2.default.join(PROJECT_ROOT, ".state"),
        sdkKey: void 0
      };
    }
  }
  return cachedRuntime;
}
var PENDING_DIR = () => import_node_path2.default.join(runtime().stateDir, "pending");
var LOG_FILE = () => import_node_path2.default.join(runtime().stateDir, "hook.log");
function logLine(message) {
  try {
    (0, import_node_fs2.mkdirSync)(import_node_path2.default.dirname(LOG_FILE()), { recursive: true });
    (0, import_node_fs2.appendFileSync)(LOG_FILE(), `${(/* @__PURE__ */ new Date()).toISOString()} ${message}
`);
  } catch {
  }
}
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}
function conversationId(payload) {
  return payload.conversation_id ?? payload.conversationId ?? payload.chat_id ?? payload.session_id ?? null;
}
function pendingPath(convId) {
  return import_node_path2.default.join(PENDING_DIR(), `${String(convId).replace(/[^A-Za-z0-9_-]/g, "_")}.json`);
}
function handleBeforeSubmitPrompt(payload) {
  const convId = conversationId(payload);
  if (convId) {
    (0, import_node_fs2.mkdirSync)(PENDING_DIR(), { recursive: true });
    (0, import_node_fs2.writeFileSync)(pendingPath(convId), JSON.stringify({ ts: Date.now() }));
  } else {
    logLine(`beforeSubmitPrompt: no conversation id in payload keys=[${Object.keys(payload)}]`);
  }
  process.stdout.write(JSON.stringify({ continue: true }));
}
function takePendingTs(convId) {
  if (!convId) return null;
  const file = pendingPath(convId);
  if (!(0, import_node_fs2.existsSync)(file)) return null;
  try {
    const { ts } = JSON.parse((0, import_node_fs2.readFileSync)(file, "utf8"));
    (0, import_node_fs2.unlinkSync)(file);
    return typeof ts === "number" ? ts : null;
  } catch {
    return null;
  }
}
function cleanupStalePending() {
  try {
    const cutoff = Date.now() - STALE_PENDING_MS;
    for (const name of (0, import_node_fs2.readdirSync)(PENDING_DIR())) {
      const file = import_node_path2.default.join(PENDING_DIR(), name);
      if ((0, import_node_fs2.statSync)(file).mtimeMs < cutoff) (0, import_node_fs2.unlinkSync)(file);
    }
  } catch {
  }
}
function modelCandidates(payload) {
  const flatten = (v) => typeof v === "string" ? v : v?.id ?? v?.name ?? v?.model ?? void 0;
  return [payload.model_id, payload.modelId, payload.model_name, payload.model].map(flatten).filter((v) => typeof v === "string" && v.length > 0);
}
async function handleStop(payload) {
  const convId = conversationId(payload);
  try {
    (0, import_node_fs2.mkdirSync)(runtime().stateDir, { recursive: true });
    (0, import_node_fs2.writeFileSync)(
      import_node_path2.default.join(runtime().stateDir, "last-stop-payload.json"),
      JSON.stringify(payload, null, 2)
    );
  } catch {
  }
  const startTs = takePendingTs(convId);
  const durationMs = startTs !== null ? Date.now() - startTs : null;
  cleanupStalePending();
  const status = payload.status ?? payload.result ?? "completed";
  if (status === "aborted" || status === "cancelled") {
    logLine(`stop: conv=${convId} status=${status} \u2014 skipped (user cancel is not a model error)`);
    return;
  }
  const { config, sdkKey, mode, error } = runtime();
  if (!config) {
    logLine(`stop: conv=${convId} config unavailable (${error?.message}) \u2014 skipped`);
    return;
  }
  if (mode === "user" && !sdkKey && process.env.DRY_RUN !== "1") {
    logLine(`stop: conv=${convId} no sdkKey in user config \u2014 skipped (run the Set SDK Key command)`);
    return;
  }
  const candidates = modelCandidates(payload);
  const modelName = candidates.find((c) => config.models[c] !== void 0) ?? candidates[0] ?? "";
  const variationKey = resolveVariation(config, modelName);
  if (variationKey === null) {
    logLine(
      `stop: conv=${convId} unmapped model (candidates=${JSON.stringify(candidates)}) and no fallbackVariation \u2014 skipped; payload saved to .state/last-stop-payload.json`
    );
    return;
  }
  const num = (v) => typeof v === "number" && Number.isFinite(v) ? v : 0;
  const tokens = {
    input: num(payload.input_tokens),
    output: num(payload.output_tokens),
    cacheWrite: num(payload.cache_write_tokens),
    cacheRead: num(payload.cache_read_tokens)
  };
  const hasTokens = tokens.input + tokens.output + tokens.cacheWrite + tokens.cacheRead > 0;
  const context = userContext(
    payload.user_email ?? config.hookUserEmail ?? config.userEmails?.[0] ?? "unknown"
  );
  const tracker = await createLdTracker({ sdkKey });
  const served = await tracker.evaluate(config.aiConfigKey, {
    ...context,
    cursorModel: variationKey
  });
  const meta = served?._ldMeta;
  if (!meta) {
    logLine(`stop: conv=${convId} evaluation unavailable \u2014 post-hoc attribution fallback`);
  }
  const trackData = buildTrackData({
    configKey: config.aiConfigKey,
    variationKey: meta?.variationKey ?? variationKey,
    version: meta?.version ?? config.aiConfigVersion,
    modelName: served?.model?.name || modelName,
    providerName: served?.provider?.name || config.providerName,
    extra: {
      source: "cursor-hook",
      conversationId: convId ?? void 0,
      cursorReportedModel: modelName,
      ...hasTokens ? { cacheWriteTokens: tokens.cacheWrite, cacheReadTokens: tokens.cacheRead } : {}
    }
  });
  if (durationMs !== null) {
    tracker.track(EVENT_KEYS.durationTotal, context, trackData, durationMs);
  }
  const eventKey = status === "error" ? EVENT_KEYS.generationError : EVENT_KEYS.generationSuccess;
  tracker.track(eventKey, context, trackData, 1);
  if (hasTokens) {
    trackTokens(tracker, context, trackData, {
      total: tokens.input + tokens.output + tokens.cacheWrite + tokens.cacheRead,
      input: tokens.input,
      output: tokens.output
    });
  }
  await tracker.close();
  if (status === "completed") {
    maybeSpawnJudge(config, payload, trackData, context.key, tracker.dryRun);
  }
  logLine(
    `stop: conv=${convId} model=${modelName} variation=${trackData.variationKey} v${trackData.version} served=${Boolean(meta)} status=${status} duration=${durationMs ?? "n/a"}ms tokens=${hasTokens ? `${tokens.input}in/${tokens.output}out` : "n/a"} dryRun=${tracker.dryRun}`
  );
}
function maybeSpawnJudge(config, payload, trackData, contextKey, dryRun) {
  const judge = config.judge;
  if (!judge?.configKey || judge.enabled === false || dryRun) return;
  if (!payload.transcript_path) return;
  if (Math.random() >= (judge.samplingRate ?? 1)) return;
  try {
    const jobDir = import_node_path2.default.join(runtime().stateDir, "judge-jobs");
    (0, import_node_fs2.mkdirSync)(jobDir, { recursive: true });
    const jobPath = import_node_path2.default.join(jobDir, `${trackData.runId}.json`);
    (0, import_node_fs2.writeFileSync)(
      jobPath,
      JSON.stringify({
        conversationId: conversationId(payload),
        transcriptPath: payload.transcript_path,
        workspaceRoot: payload.workspace_roots?.[0],
        contextKey,
        parentTrackData: trackData
      })
    );
    const sibling = import_node_path2.default.join(import_node_path2.default.dirname(process.argv[1] ?? ""), "judge-worker.js");
    const workerPath = (0, import_node_fs2.existsSync)(sibling) ? sibling : import_node_path2.default.join(PROJECT_ROOT, "src", "judge", "judge-worker.mjs");
    const child = (0, import_node_child_process.spawn)(process.execPath, [workerPath, jobPath], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    logLine(`judge spawned for run=${trackData.runId} worker=${workerPath}`);
  } catch (err) {
    logLine(`judge spawn failed: ${err.message}`);
  }
}
async function main() {
  if (process.env.LD_AGENTCONTROL_JUDGE === "1") {
    logLine("skipping hook for judge-initiated run");
    return;
  }
  const raw = await readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    logLine(`unparseable payload: ${raw.slice(0, 200)}`);
    return;
  }
  const eventName = payload.hook_event_name ?? payload.hookEventName ?? payload.event;
  switch (eventName) {
    case "beforeSubmitPrompt":
      handleBeforeSubmitPrompt(payload);
      break;
    case "stop":
      await handleStop(payload);
      break;
    default:
      logLine(`unknown hook event "${eventName}" keys=[${Object.keys(payload)}]`);
  }
}
main().catch((err) => logLine(`fatal: ${err.stack ?? err}`)).finally(() => process.exit(0));
