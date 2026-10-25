import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
//#region node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
var Cached = class {
	constructor(getter) {
		this._getter = getter;
		this._value = void 0;
	}
	get value() {
		const getter = this._getter;
		if (getter !== void 0) {
			this._value = getter();
			this._getter = void 0;
		}
		return this._value;
	}
};
function cached(getter) {
	return new Cached(getter);
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
/**
* Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
*
* Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
*/
function rawShape(def) {
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
	return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
	Object.defineProperty(target, key, {
		get() {
			const value = getter();
			assignProp(this, key, value);
			return value;
		},
		enumerable: true,
		configurable: true
	});
}
function putProp(target, key, value) {
	if (key in target) assignProp(target, key, value);
	else target[key] = value;
}
/**
* Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
*
* A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one schema.
*/
function mirrorShape(target, source, keys, wrap) {
	const raw = sourceShape(source);
	for (const key of keys) {
		const desc = Object.getOwnPropertyDescriptor(raw, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => {
			const value = source._zod.def.shape[key];
			return wrap ? wrap(value, key) : value;
		});
		else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
	}
}
function mirrorProps(target, source) {
	for (const key of Reflect.ownKeys(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => source[key]);
		else putProp(target, key, desc.value);
	}
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
const propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
const BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	const newShape = {};
	mirrorShape(newShape, schema, maskedKeys(schema, mask));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function maskedKeys(schema, mask) {
	const raw = sourceShape(schema);
	const keys = [];
	for (const key of Reflect.ownKeys(mask)) {
		if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
		if (mask[key]) keys.push(key);
	}
	return keys;
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	const omitted = new Set(maskedKeys(schema, mask));
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = sourceShape(schema);
		for (const key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
	mirrorProps(newShape, shape);
	return newShape;
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
	if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	const newShape = {};
	mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
	mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
	return clone(a, mergeDefs(a._zod.def, {
		shape: newShape,
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask, name = "partial") {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({
		type: "optional",
		innerType: value
	})));
	return clone(schema, mergeDefs(schema._zod.def, {
		shape: newShape,
		checks: []
	}));
}
function required(Class, schema, mask) {
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({
		type: "nonoptional",
		innerType: value
	}));
	return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
/** The leading size checks of `defChecks` that set an upper bound, each paired with it. */
function sizeCaps(defChecks) {
	const caps = [];
	for (const ch of defChecks ?? []) {
		const d = ch._zod.def;
		if (!/_(length|size)$|_equals$/.test(d.check)) break;
		const max = d.maximum ?? d.length ?? d.size;
		if (max >= 0) caps.push([max, ch]);
	}
	return caps;
}
function attachSchema(issues, start, inst) {
	var _a;
	for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
	var _a;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) {
		if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
		else iss.schema = iss.inst;
	}
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const full = {};
	for (const k of Object.keys(iss)) {
		if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
		full[k] = iss[k];
	}
	full.path ?? (full.path = []);
	full.message = message;
	if (ctx?.reportInput) full.input = iss.input;
	return full;
}
const highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
	const units = str.length;
	if (!highSurrogate.test(str)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
/**
* Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
*
* Call this from a `proto` initializer, which runs once per prototype — never per instance.
*/
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
/* @__NO_SIDE_EFFECTS__ */
function derived(computes, table) {
	for (const key in computes) {
		const compute = computes[key];
		Object.defineProperty(table, key, {
			configurable: true,
			enumerable: true,
			get() {
				return own(this, key, compute(this));
			},
			set(value) {
				own(this, key, value);
			}
		});
	}
	return table;
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
let installing;
let broke = false;
const breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
/**
* Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
* constructor, computed from the internals object itself and cached there on
* first read. One accessor per constructor rather than one per instance.
*/
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
/**
* Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
* data property. One accessor per constructor rather than one per instance, because an own accessor
* puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
*/
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
const CONSTANT_CATCH = "~constantCatch";
/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
function constantCatch(value) {
	const fn = () => value;
	fn[CONSTANT_CATCH] = true;
	return fn;
}
//#endregion
//#region node_modules/zod/v4/core/core.js
var _a$1;
const _zodDesc = {
	value: void 0,
	enumerable: false
};
let _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
/* @__NO_SIDE_EFFECTS__ */
function $constructor(name, initializer, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc);
			} finally {
				_zodDesc.value = void 0;
			}
		} else if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		if (initialized) {
			const own = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto = _.prototype;
		for (const k in proto) {
			if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
//#endregion
//#region node_modules/zod/v4/core/errors.js
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
const _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
const _issuesDesc = {
	value: void 0,
	enumerable: false
};
const _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
const initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
const $ZodError = /* @__PURE__ */ $constructor("$ZodError", initializer$1);
/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
* ("toString", "constructor") would otherwise read through to the prototype, and assigning
* "__proto__" would hit the setter instead of creating a key. */
function node(obj, key, make) {
	if (!Object.prototype.hasOwnProperty.call(obj, key)) {
		if (key === "__proto__") Object.defineProperty(obj, key, {
			value: make(),
			writable: true,
			enumerable: true,
			configurable: true
		});
		else obj[key] = make();
	}
	return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
	else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					const terminal = i === fullpath.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
						value: { _errors: [] },
						enumerable: true,
						writable: true,
						configurable: true
					});
					const node = curr[el];
					if (terminal) node._errors.push(mapper(issue));
					curr = node;
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
//#endregion
//#region node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
	return {
		callee: params?.callee ?? callee,
		Err: params?.Err
	};
}
const _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
function failure(Err, issues, ctx) {
	let error;
	return {
		success: false,
		get error() {
			if (!error) {
				error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
				issues = void 0;
				ctx = void 0;
			}
			return error;
		},
		set error(e) {
			error = e;
			issues = void 0;
			ctx = void 0;
		}
	};
}
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
const validate = ((schema, value, _ctx) => {
	const validator = schema._zod.bag.validator;
	if (validator !== void 0) {
		if (validator(value) !== COMPILE_INVALID) return true;
		if (validator.definite === true && _ctx === void 0) return false;
	}
	return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
	const ctx = _ctx ? {
		..._ctx,
		async: false,
		abortEarly: true
	} : {
		async: false,
		abortEarly: true
	};
	const fallbackRun = schema._zod.bag.fallbackRun;
	let result;
	if (fallbackRun) {
		ctx[COMPILE_FALLBACK] = true;
		result = fallbackRun({
			value,
			issues: []
		}, ctx);
	} else result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length === 0;
}
const validateAsync$1 = async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true,
		abortEarly: true
	} : {
		async: true,
		abortEarly: true
	};
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length === 0;
};
const _encode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return parse(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _encodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
const _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
//#endregion
//#region node_modules/zod/v4/core/regexes.js
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
	return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
const email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
* esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
* will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source) {
	return new RegExp(`^${source}$`);
}
const date = /*@__PURE__*/ anchor(dateSource);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
	const opts = ["Z"];
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const qualified = `${timeSource({
		precision: args.precision,
		seconds: true
	})}(?:${opts.join("|")})`;
	const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const anyString = /^[\s\S]{0,}$/;
const integer = /^-?\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
//#endregion
//#region node_modules/zod/v4/core/checks.js
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
const _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
const numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	def.pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
//#endregion
//#region node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = [], closed = {}) {
		this.content = [];
		this.indent = 0;
		this.args = args;
		this.closed = closed;
	}
	indented(fn) {
		this.indent += 1;
		try {
			fn(this);
		} finally {
			this.indent -= 1;
		}
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const content = this?.content ?? [``];
		return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`)(...Object.values(this.closed));
	}
};
//#endregion
//#region node_modules/zod/v4/core/versions.js
const version = {
	major: 4,
	minor: 6,
	patch: 7
};
//#endregion
//#region node_modules/zod/v4/core/schemas.js
const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
const toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
	const ctx = { async: true };
	return toStandardResult(await inst._zod.run({
		value,
		issues: []
	}, ctx), ctx);
}
function standardProps(inst) {
	return {
		validate: (value) => {
			const ctx = { async: false };
			try {
				const r = inst._zod.run({
					value,
					issues: []
				}, ctx);
				if (!(r instanceof Promise)) return toStandardResult(r, ctx);
			} catch (_) {}
			return validateAsync(inst, value);
		},
		vendor: "zod",
		version: 1
	};
}
const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = def.pattern ?? anyString;
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
function canParseURL(input) {
	try {
		if (typeof URL !== "undefined" && typeof URL.canParse === "function") return URL.canParse(input);
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
function validateURL(trimmed, def) {
	if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || 2;
	return parseURLObject(trimmed, def);
}
/** Parses a URL while preserving the non-normalizing HTTP guard. */
function parseURLObject(trimmed, def) {
	if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return 1;
	try {
		if (typeof URL !== "undefined") {
			const URLStatic = URL;
			if (typeof URLStatic.parse === "function") return URLStatic.parse(trimmed) ?? 2;
		}
		return new URL(trimmed);
	} catch {
		return 2;
	}
}
const asciiTabOrNewline = /[\t\n\r]/g;
/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
function stripTabAndNewline(value) {
	return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
	hostname.lastIndex = 0;
	return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
	protocol.lastIndex = 0;
	return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = validateURL(trimmed, def);
			if (url === 1) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === 2) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === true) {
				payload.value = stripTabAndNewline(trimmed);
				return;
			}
			if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: def.hostname.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: def.protocol.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
	if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
	def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
	$ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
});
/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
	if (!ipv6Alphabet.test(value)) return false;
	return canParseURL(`http://[${value}]`);
}
const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidIPv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
	const parts = value.split("/");
	if (parts.length !== 2) return false;
	const [address, prefix] = parts;
	if (!prefix) return false;
	const prefixNum = Number(prefix);
	if (`${prefixNum}` !== prefix) return false;
	if (prefixNum < 0 || prefixNum > 128) return false;
	return isValidIPv6(address);
}
const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidCIDRv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64Charset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
	if (!base64urlCharset.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64urlCharset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function capSize(inst, size) {
	const caps = sizeCaps(inst._zod.def.checks);
	if (!caps.length) return;
	const cap = Math.min(...caps.map((c) => c[0]));
	const parse = inst._zod.parse;
	inst._zod.parse = (payload, ctx) => {
		const n = size(payload.value);
		if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
			for (const [max, ch] of sizeCaps(inst._zod.def.checks)) if (n > max && ch._zod.def.when(payload)) {
				const start = payload.issues.length;
				ch._zod.check(payload);
				payload.issues[start].continue = false;
				attachSchema(payload.issues, start, inst);
				return payload;
			}
		}
		return parse(payload, ctx);
	};
}
const arraySize = (input) => Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		const abortEarly = ctx?.abortEarly;
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else {
				handleArrayResult(result, payload, i);
				if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
	capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
const NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	let seen = 0;
	for (const key in input) {
		if (abortEarly && payload.issues.length !== seen) {
			if (aborted(payload, seen)) break;
			seen = payload.issues.length;
		}
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	const sh = desc?.get ? desc.get.raw : def.shape ?? {};
	if (sh) {
		const get = () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			get.raw = newSh;
			return newSh;
		};
		get.raw = sh;
		Object.defineProperty(def, "shape", { get });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		const abortEarly = ctx?.abortEarly;
		let seen = payload.issues.length;
		for (const key of value.allKeys) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
	};
});
const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const memo = globalConfig.memoizer;
	const generateFastpass = (shape) => {
		const normalized = _normalized.value;
		const syms = normalized.symbolKeys;
		const doc = new Doc(["payload", "ctx"], {
			shape,
			inst,
			memo,
			syms
		});
		const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.allKeys) ids[key] = `key_${counter++}`;
		doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
		for (const key of normalized.allKeys) {
			if (key === "__proto__") continue;
			const id = ids[key];
			const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
			const isPresent = `${k} in input`;
			const schema = shape[key];
			const optin = schema?._zod?.optin;
			const isOptionalIn = optin !== void 0;
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(k)};`);
			if (isOptionalIn && isOptionalOut) {
				const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
				doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			} else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
			else {
				doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
				if (optin === "defaulted") doc.write(`newResult[${k}] = ${id}.value;`);
				else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
			}
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		return doc.compile();
	};
	let fastpass;
	const isObject$2 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
	defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazyInternal(inst, "values", (zod) => {
		if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		if (zod.def.options.every((o) => o._zod.pattern)) {
			const patterns = zod.def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	const keyIssues = /* @__PURE__ */ new Map();
	const collect = (iss, side) => {
		let keys;
		if (iss.code === "unrecognized_keys" && !iss.path?.length) {
			unrecIssue ?? (unrecIssue = iss);
			keys = iss.keys;
		} else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
			const k = String(iss.path[0]);
			if (!keyIssues.has(k)) keyIssues.set(k, iss);
			keys = [k];
		} else return false;
		for (const k of keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k)[side] = true;
		}
		return true;
	};
	for (const iss of left.issues) if (!collect(iss, "l")) result.issues.push(iss);
	for (const iss of right.issues) if (!collect(iss, "r")) result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length) {
		const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
		if (aggregated.length) result.issues.push({
			...unrecIssue,
			keys: aggregated
		});
		for (const k of bothKeys) if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
	}
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) {
		if (aborted(result)) return result;
		throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	}
	result.value = merged.data;
	return result;
}
const $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isPlainObject(input)) {
			payload.issues.push({
				expected: "record",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		const values = def.keyType._zod.values;
		if (values && !def.partial) {
			payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
			const recordKeys = /* @__PURE__ */ new Set();
			for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
				recordKeys.add(typeof key === "number" ? key.toString() : key);
				if (key === "__proto__") continue;
				const keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (keyResult.issues.length) {
					payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const outKey = keyResult.value;
				if (outKey === "__proto__") continue;
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}
			}
			let unrecognized;
			for (const key in input) if (!recordKeys.has(key)) {
				if (def.mode === "loose") {
					if (key === "__proto__") continue;
					payload.value[key] = input[key];
				} else {
					unrecognized = unrecognized ?? [];
					unrecognized.push(key);
				}
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized,
				continue: true
			});
		} else {
			payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
			let unrecognized;
			for (const key of Reflect.ownKeys(input)) {
				if (key === "__proto__") continue;
				if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
				let keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
					const retryResult = def.keyType._zod.run({
						value: Number(key),
						issues: []
					}, ctx);
					if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (retryResult.issues.length === 0) keyResult = retryResult;
				}
				if (keyResult.issues.length) {
					if (def.mode === "loose") payload.value[key] = input[key];
					else if (values) {
						unrecognized = unrecognized ?? [];
						unrecognized.push(key);
					} else payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const outKey = keyResult.value;
				if (outKey === "__proto__") continue;
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized,
				continue: true
			});
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	defineLazyInternal(inst, "pattern", (zod) => {
		const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
		return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	globalConfig.memoizer?.guard(inst);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => {
		const v = zod.def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
function handleCatchResult(payload, result, def, ctx) {
	if (!result.issues.length) {
		payload.value = result.value;
		if (result.memo) payload.memo = true;
		return payload;
	}
	payload.value = def.catchValue({
		...result,
		value: payload.value,
		error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
		input: payload.value
	});
	return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run({
			value: payload.value,
			issues: []
		}, ctx);
		if (result instanceof Promise) return result.then((result) => handleCatchResult(payload, result, def, ctx));
		return handleCatchResult(payload, result, def, ctx);
	};
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	if (!payload.memo) payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
//#endregion
//#region node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
	constructor() {
		super(`Cannot parse a reference cycle that closes through a transform`);
		this.name = "ZodCyclicError";
	}
};
/** Keyed off the context object every schema in one parse call already shares. */
const STATE = "~memo";
const NO_ISSUES = [];
function isRef(value) {
	return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
	return issues.map((iss) => iss.path ? {
		...iss,
		path: iss.path.slice()
	} : { ...iss });
}
const recursive = /*@__PURE__*/ new WeakMap();
/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst, stack, resolve) {
	const cached = recursive.get(inst);
	if (cached !== void 0) return cached ? PROVEN : NONE;
	if (stack.has(inst)) return PROVEN;
	stack.add(inst);
	let result = NONE;
	const check = (child) => {
		if (result !== PROVEN && child?._zod) {
			const answer = isRecursive(child, stack, resolve);
			if (answer > result) result = answer;
		}
	};
	const shape = (sh, spread) => {
		let answer = NONE;
		for (const key of Reflect.ownKeys(sh)) {
			const desc = Object.getOwnPropertyDescriptor(sh, key);
			if (spread && !desc.enumerable) continue;
			const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
			if (child > answer) answer = child;
		}
		return answer;
	};
	const merge = (answer) => {
		if (answer > result) result = answer;
	};
	const def = inst._zod.def;
	switch (def.type) {
		case "object": {
			const raw = rawShape(def);
			merge(raw ? shape(raw, true) : ASSUMED);
			check(def.catchall);
			break;
		}
		case "array":
			check(def.element);
			break;
		case "tuple":
			for (const el of def.items) check(el);
			check(def.rest);
			break;
		case "record":
		case "map":
			check(def.keyType);
			check(def.valueType);
			break;
		case "set":
			check(def.valueType);
			break;
		case "union":
			for (const el of def.options) check(el);
			break;
		case "intersection":
			check(def.left);
			check(def.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			check(def.innerType);
			break;
		case "pipe":
			check(def.in);
			check(def.out);
			break;
		case "function":
			check(def.input);
			check(def.output);
			break;
		case "lazy": {
			const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
			merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (const key in def) {
			const desc = Object.getOwnPropertyDescriptor(def, key);
			if (!desc || desc.get) continue;
			const value = desc.value;
			if (!value || typeof value !== "object") continue;
			if (value._zod) check(value);
			else if (Array.isArray(value)) for (const el of value) check(el);
		}
	}
	stack.delete(inst);
	return settle(inst, result);
}
/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst, answer) {
	if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
	return answer;
}
function bucketFor(state, inst) {
	let bucket = state.buckets.get(inst);
	if (!bucket) {
		bucket = /* @__PURE__ */ new WeakMap();
		state.buckets.set(inst, bucket);
	}
	return bucket;
}
let handoff;
const open = [];
const memo = {
	alloc(_inst, payload, empty) {
		const bucket = handoff;
		if (!bucket) return empty;
		handoff = void 0;
		const entry = {
			value: empty,
			issues: null
		};
		bucket.set(payload.value, entry);
		open.push(entry);
		return empty;
	},
	guard(inst) {
		var _a;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
				return base(payload, ctx);
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	},
	attach(inst) {
		var _a;
		let isRecursiveInst;
		let rechecked = false;
		let lastCtx;
		let lastBucket;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (isRecursiveInst === void 0) {
					const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
					if (walked === NONE) {
						inst._zod.parse = base;
						if (inst._zod.run === wrapped) inst._zod.run = base;
						return base(payload, ctx);
					}
					if (walked === PROVEN || rechecked) isRecursiveInst = true;
					else rechecked = true;
				}
				const input = payload.value;
				if (!isRef(input)) return base(payload, ctx);
				let state = ctx[STATE];
				if (!state) {
					state = {
						buckets: /* @__PURE__ */ new WeakMap(),
						backEdges: void 0
					};
					ctx[STATE] = state;
				}
				let bucket;
				if (lastCtx === ctx) bucket = lastBucket;
				else {
					bucket = bucketFor(state, inst);
					lastCtx = ctx;
					lastBucket = bucket;
				}
				const hit = bucket.get(input);
				if (hit) {
					payload.value = hit.value;
					if (hit.issues) {
						if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
					} else {
						payload.memo = true;
						state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
						state.backEdges.add(hit.value);
					}
					return payload;
				}
				handoff = bucket;
				const depth = open.length;
				const result = base(payload, ctx);
				handoff = void 0;
				const entry = open.length > depth ? open.pop() : void 0;
				if (result instanceof Promise) return result.then((r) => {
					if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
					return r;
				});
				if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
				return result;
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	}
};
/** The memoizer that gives containers cycle support. `zod` installs it by default; `zod/mini` opts in with `config({ memoizer: memoizer() })`. */
function memoizer() {
	return memo;
}
/** Whether this value is a node a back-edge resolved to before it finished. */
function isBackEdge(ctx, value) {
	const backEdges = ctx[STATE]?.backEdges;
	return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
//#endregion
//#region node_modules/zod/v4/locales/en.js
const error = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	function getTypeName(type, input) {
		if (type === "number" && typeof input === "number" && !Number.isFinite(input)) return String(input);
		return TypeDictionary[type] ?? type;
	}
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": return `Invalid input: expected ${getTypeName(issue.expected)}, received ${getTypeName(parsedType(issue.input), issue.input)}`;
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union":
				if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) return `Invalid discriminator value. Expected ${issue.options.map((o) => `'${o}'`).join(" | ")}`;
				if (issue.inclusive === false) return "Invalid input: more than one option matched";
				return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error() };
}
//#endregion
//#region node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;
//#endregion
//#region node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
	if (def.checks) def.checks = [...def.checks];
	return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class(snapshotChecks({
		type: "string",
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link _cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class(snapshotChecks({
		type: "number",
		checks: [],
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
//#endregion
//#region node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
	for (const source of sources) for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProp(target, key, source[key]);
	return target;
}
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: params?.external ?? void 0
	};
}
/**
* Applies the `unrepresentable` setting at a site that has no JSON Schema equivalent. Throws
* `message` unless the setting (or the handler's return value) says otherwise. Returns `true` if a
* custom JSON Schema was written into `json`, in which case the caller must not write its own.
*/
function handleUnrepresentable(schema, ctx, json, params, message) {
	const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({
		zodSchema: schema,
		path: params.path,
		message
	}) : ctx.unrepresentable;
	if (result === "any") return false;
	if (result === void 0 || result === "throw") throw new Error(message);
	Object.assign(json, result);
	return true;
}
function processSchema(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	ctx.sharedDefsExtractedFor = void 0;
	ctx.sharedEmitDoneFor = void 0;
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			processSchema(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) assignProps(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function encodeJSONPointerSegment(segment) {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
			};
		}
		const uriPrefix = `#`;
		const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
		if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + encodeJSONPointerSegment(defId)
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") extractToDef(entry);
		}
	}
	if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
/** Rewrites `anyOf: [{type: "a"}, {type: "b"}]` to `type: ["a", "b"]`, which every JSON Schema draft treats as equivalent and most consumers render far better for the nullable case. Only branches that are a bare type assertion qualify — anything carrying a constraint, `$ref`, `const` or metadata is left alone. Runs after `flattenRef`, so a branch an override decorated or `$defs` extraction turned into a `$ref` is no longer bare and correctly stays in `anyOf`. `oneOf` is excluded: `integer` and `number` overlap, so "exactly one" and "at least one" are not the same there. OpenAPI 3.0 is excluded: its `type` must be a single string. */
function compactTypeUnion(schema) {
	const options = schema.anyOf;
	if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
	const types = [];
	for (const option of options) {
		if (!option || typeof option !== "object") return;
		compactTypeUnion(option);
		const keys = Object.keys(option);
		if (keys.length !== 1 || keys[0] !== "type") return;
		const type = option.type;
		for (const member of Array.isArray(type) ? type : [type]) {
			if (typeof member !== "string") return;
			if (!types.includes(member)) types.push(member);
		}
	}
	delete schema.anyOf;
	schema.type = types.length === 1 ? types[0] : types;
}
/** Keywords `foldIntersection` knows how to combine. Anything else — `$ref`, `patternProperties`,
* an annotation like `description` — makes a member unfoldable, so a constraint this does not
* understand leaves the `allOf` alone instead of being silently dropped or misattributed. */
const FOLDABLE_KEYS = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]);
const UNION_KEYS = ["oneOf", "anyOf"];
/** A member's constraint on a key it does not declare itself. A `catchall` states one; `false`, an absent `additionalProperties`, and the empty schema a loose object emits state nothing. */
function undeclaredConstraint(member) {
	const extra = member.additionalProperties;
	if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null) return null;
	return Object.keys(extra).length ? extra : null;
}
/** Combines object members into the single object they describe together, or returns `null` if any of them carries a keyword outside {@link FOLDABLE_KEYS}. */
function foldObjects(members) {
	const objects = [];
	for (const member of members) {
		if (typeof member !== "object" || member.type !== "object") return null;
		for (const key in member) if (!FOLDABLE_KEYS.has(key)) return null;
		objects.push(member);
	}
	const properties = {};
	const required = /* @__PURE__ */ new Set();
	for (const object of objects) {
		for (const key in object.properties) {
			if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
			const parts = [];
			for (const other of objects) {
				const part = other.properties?.[key] ?? undeclaredConstraint(other);
				if (part === null || part === void 0) continue;
				if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
			}
			assignProp(properties, key, parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts });
		}
		for (const key of object.required ?? []) required.add(key);
	}
	const folded = {
		type: "object",
		properties
	};
	if (required.size) folded.required = [...required];
	if (objects.every((object) => object.additionalProperties === false)) folded.additionalProperties = false;
	else {
		const constraints = [];
		for (const object of objects) {
			const constraint = undeclaredConstraint(object);
			if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
		}
		if (constraints.length === 1) folded.additionalProperties = constraints[0];
		else if (constraints.length > 1) folded.additionalProperties = { allOf: constraints };
	}
	return folded;
}
/** `additionalProperties` in an `allOf` member sees only that member's own `properties`, so two
* closed object members reject each other's keys and the schema validates nothing. Zod's parser
* pools the key sets instead — `handleIntersectionResults` reports a key as unrecognized only when
* *every* side rejects it — so the emitted schema has to pool them too, and folding the members
* into one object is the encoding that says so on every target.
*
* This runs from `finalize`, after `extractDefs`, which is what keeps it clear of the `$ref`
* machinery: a member extracted into `$defs` is already a `$ref` by now and declines to fold, so it
* keeps its reference and its own closedness rather than being inlined as a stale copy. */
function foldIntersection(json) {
	const allOf = json.allOf;
	if (!Array.isArray(allOf) || allOf.length < 2) return;
	for (const key of FOLDABLE_KEYS) if (key in json) return;
	const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
	let folded = null;
	if (!unions.length) folded = foldObjects(allOf);
	else {
		const union = unions[0];
		const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
		if (Object.keys(union).length !== 1) return;
		const rest = allOf.filter((m) => m !== union);
		const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
		if (branches.some((b) => !b)) return;
		folded = { [keyword]: branches };
	}
	if (!folded) return;
	delete json.allOf;
	assignProps(json, folded);
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else assignProps(schema, refSchema);
			assignProps(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
		for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
		if (ctx.target !== "openapi-3.0") for (const entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
		for (const rewrite of ctx.deferred) rewrite();
		if (ctx.intersections.length) {
			const carriers = /* @__PURE__ */ new Map();
			for (const seen of ctx.seen.values()) for (const json of [seen.schema, seen.def]) {
				const allOf = json?.allOf;
				if (!Array.isArray(allOf)) continue;
				const existing = carriers.get(allOf);
				if (existing) existing.push(json);
				else carriers.set(allOf, [json]);
			}
			for (const allOf of ctx.intersections) for (const json of carriers.get(allOf) ?? []) foldIntersection(json);
		}
	}
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			assignProp(defs, seen.defId, seen.def);
		}
	}
	if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
	if (ctx.external) {} else if (Object.keys(defs).length > 0) {
		if (ctx.target === "draft-2020-12") result.$defs = defs;
		else result.definitions = defs;
	}
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
//#endregion
//#region node_modules/zod/v4/core/json-schema-processors.js
const narrowMin = (agg, key, value) => {
	if (agg[key] === void 0 || value > agg[key]) agg[key] = value;
};
const narrowMax = (agg, key, value) => {
	if (agg[key] === void 0 || value < agg[key]) agg[key] = value;
};
const narrowBoth = (agg, value) => {
	narrowMin(agg, "minimum", value);
	narrowMax(agg, "maximum", value);
};
const addDivisor = (agg, value) => {
	agg.multipleOf ?? (agg.multipleOf = []);
	if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
const addPattern = (agg, pattern) => {
	agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
	agg.patterns.add(pattern);
};
const intersectMime = (agg, mime) => {
	agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
const setFormat = (agg, format) => {
	agg.format = format;
	if (format.includes("int")) agg.isInt = true;
};
const minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
const maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
const formatContributor = (ranges) => (agg, def) => {
	setFormat(agg, def.format);
	const [minimum, maximum] = ranges[def.format];
	narrowMin(agg, "minimum", minimum);
	narrowMax(agg, "maximum", maximum);
};
const contributors = {
	greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
	less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
	multiple_of: (agg, def) => addDivisor(agg, def.value),
	number_format: formatContributor(NUMBER_FORMAT_RANGES),
	bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
	min_length: minContributor,
	max_length: maxContributor,
	length_equals: (agg, def) => narrowBoth(agg, def.length),
	min_size: minContributor,
	max_size: maxContributor,
	size_equals: (agg, def) => narrowBoth(agg, def.size),
	string_format: (agg, def) => {
		setFormat(agg, def.format);
		if (def.pattern) addPattern(agg, def.pattern);
		if (def.format === "base64" || def.format === "base64url") agg.contentEncoding = def.format;
		if (def.local || def.precision === -1) agg.laxFormat = true;
	},
	mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
	const agg = {};
	const def = schema._zod.def;
	const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
	for (const ch of list) contributors[ch._zod.def.check]?.(agg, ch._zod.def);
	const bag = schema._zod.bag;
	if (bag.minimum !== void 0) narrowMin(agg, "minimum", bag.minimum);
	if (bag.exclusiveMinimum !== void 0) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
	if (bag.maximum !== void 0) narrowMax(agg, "maximum", bag.maximum);
	if (bag.exclusiveMaximum !== void 0) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
	if (bag.multipleOf !== void 0) addDivisor(agg, bag.multipleOf);
	if (bag.format !== void 0) {
		agg.format ?? (agg.format = bag.format);
		if (bag.format.includes("int")) agg.isInt = true;
	}
	if (bag.mime) intersectMime(agg, bag.mime);
	for (const pattern of bag.patterns ?? []) addPattern(agg, pattern);
	return agg;
}
const formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
const exactPatterns = /* @__PURE__ */ new Map([[base64Charset, base64], [base64urlCharset, base64url]]);
const exactPattern = (p) => exactPatterns.get(p) ?? p;
const stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time" || laxFormat) delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const patternList = [...patterns].map(exactPattern);
		if (patternList.length === 1) json.pattern = patternList[0].source;
		else if (patternList.length > 1) json.allOf = [...patternList.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
const numberProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
	json.type = isInt ? "integer" : "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) {
		if (legacy) {
			json.minimum = exclusiveMinimum;
			json.exclusiveMinimum = true;
		} else json.exclusiveMinimum = exclusiveMinimum;
	} else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) {
		if (legacy) {
			json.maximum = exclusiveMaximum;
			json.exclusiveMaximum = true;
		} else json.exclusiveMaximum = exclusiveMaximum;
	} else if (typeof maximum === "number") json.maximum = maximum;
	if (multipleOf) {
		const divisors = /* @__PURE__ */ new Set();
		for (const divisor of multipleOf) if (Number.isFinite(divisor) && divisor !== 0) divisors.add(Math.abs(divisor));
		else handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
		const [first, ...rest] = divisors;
		if (first !== void 0) json.multipleOf = first;
		if (rest.length) json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
	}
};
const neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
const enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.length === 0) {
		json.not = {};
		return;
	}
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
const customProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = processSchema(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
function inputOptin(schema) {
	const def = schema._zod.def;
	if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
	if (def.type === "catch") return inputOptin(def.innerType);
	return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const shape = def.shape;
	if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
	json.type = "object";
	json.properties = {};
	for (const key in shape) assignProp(json.properties, key, processSchema(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	}));
	const requiredKeys = [];
	for (const key of Object.keys(shape)) {
		const field = def.shape[key];
		if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) requiredKeys.push(key);
	}
	if (requiredKeys.length > 0) json.required = requiredKeys;
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = processSchema(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
const unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => processSchema(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = processSchema(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = processSchema(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	const allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
	json.allOf = allOf;
	ctx.intersections.push(allOf);
};
/** JSON object keys are always strings, so a numeric record key schema is re-expressed over the
* numeric-string form the record parser matches. Deferred to `finalize`, after the flatten: a key
* behind a wrapper only carries its own `type` before then, and a union key only has its branches.
*
* A numeric bound cannot apply to a property name, so `minimum` and its siblings are dropped rather
* than carried over: keeping them beside `type: "string"` reproduces the match-nothing schema this
* exists to fix. A key that carries one therefore emits wider than the record parses — `z.record(z.number().min(5), V)`
* accepts `"3"` — which is the deliberate trade, since throwing on it would reject an ordinary schema
* outright. */
function stringifyKeyNames(bySchema, json, visited) {
	if (json.$ref) {
		if (visited.has(json)) return json;
		visited.add(json);
		const def = bySchema.get(json)?.def;
		if (!def) return json;
		const inlined = stringifyKeyNames(bySchema, def, visited);
		return inlined === def ? json : inlined;
	}
	for (const keyword of ["anyOf", "oneOf"]) {
		const branches = json[keyword];
		if (!Array.isArray(branches)) continue;
		const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
		if (mapped.some((branch, i) => branch !== branches[i])) json = {
			...json,
			[keyword]: mapped
		};
	}
	const types = Array.isArray(json.type) ? json.type : [json.type];
	const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
	const values = json.enum ?? (json.const !== void 0 ? [json.const] : void 0);
	if (!numericType && !values?.some((v) => typeof v === "number")) return json;
	const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
	if (rest.enum) rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
	else if (typeof rest.const === "number") rest.const = String(rest.const);
	if (!numericType) return rest;
	rest.type = "string";
	if (!values) rest.pattern = (types.includes("number") ? number$1 : integer).source;
	return rest;
}
/** Every record of one conversion, so the carriers are found in a single pass rather than once per record. */
const pendingRecords = /* @__PURE__ */ new WeakMap();
function rewriteKeyNames(ctx) {
	const bySchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.values()) if (entry.def && !bySchema.has(entry.schema)) bySchema.set(entry.schema, entry);
	const rewrites = /* @__PURE__ */ new Map();
	for (const record of pendingRecords.get(ctx) ?? []) {
		const seen = ctx.seen.get(record);
		const names = (seen?.def ?? seen?.schema)?.propertyNames;
		if (!names || names === true || rewrites.has(names)) continue;
		const rewritten = stringifyKeyNames(bySchema, names, /* @__PURE__ */ new Set());
		if (rewritten !== names) rewrites.set(names, rewritten);
	}
	if (!rewrites.size) return;
	for (const entry of ctx.seen.values()) for (const carrier of [entry.schema, entry.def]) {
		const rewritten = carrier && rewrites.get(carrier.propertyNames);
		if (rewritten) carrier.propertyNames = rewritten;
	}
}
const recordProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	const keyType = def.keyType;
	const patterns = aggregateChecks(keyType).patterns;
	if (def.mode === "loose" && patterns && patterns.size > 0) {
		const valueSchema = processSchema(def.valueType, ctx, {
			...params,
			path: [
				...params.path,
				"patternProperties",
				"*"
			]
		});
		json.patternProperties = {};
		for (const pattern of patterns) assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
	} else {
		if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
			json.propertyNames = processSchema(def.keyType, ctx, {
				...params,
				path: [...params.path, "propertyNames"]
			});
			let pending = pendingRecords.get(ctx);
			if (!pending) {
				pending = [];
				pendingRecords.set(ctx, pending);
				ctx.deferred.push(() => rewriteKeyNames(ctx));
			}
			pending.push(schema);
		}
		json.additionalProperties = processSchema(def.valueType, ctx, {
			...params,
			path: [...params.path, "additionalProperties"]
		});
	}
	const keyValues = keyType._zod.values;
	const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== void 0;
	if (keyValues && !def.partial && !omittableOnInput) {
		const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
		if (validKeyValues.length > 0) json.required = validKeyValues.map(String);
	}
};
const nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
/** Round-trips a default value through JSON so the emitted schema is guaranteed to be valid JSON.
* A BigInt has no reliable encoding, so it goes through `unrepresentable` like any other
* unrepresentable value. Returns a sentinel when the caller must not write a default of its own. */
const UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
	let unrepresentable = false;
	const serialized = JSON.stringify(value, (_, val) => {
		if (typeof val !== "bigint") return val;
		unrepresentable = true;
		return null;
	});
	if (!unrepresentable) return JSON.parse(serialized);
	handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
	return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io !== "input") return;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	processSchema(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
//#endregion
//#region node_modules/zod/v4/classic/errors.js
const _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
	Object.defineProperty(proto, key, {
		configurable: true,
		enumerable: false,
		get() {
			const value = make(this);
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
			return value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
		}
	});
}
const initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	const proto = Object.getPrototypeOf(inst);
	if (_installedErrorProtos.has(proto)) return;
	_installedErrorProtos.add(proto);
	_lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
	_lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
	_lazyMethod(proto, "addIssue", (self) => (issue) => {
		self.issues.push(issue);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	_lazyMethod(proto, "addIssues", (self) => (issues) => {
		self.issues.push(...issues);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	Object.defineProperty(proto, "isEmpty", {
		configurable: true,
		enumerable: false,
		get() {
			return this.issues.length === 0;
		}
	});
};
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, void 0, { Parent: Error });
//#endregion
//#region node_modules/zod/v4/classic/parse.js
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
//#endregion
//#region node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
	if (!globalConfig.localeError) config(en_default());
}
function _ensureDefaultMemoizer() {
	if (!globalConfig.memoizer) config({ memoizer: memoizer() });
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
	_ensureDefaultLocale();
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
	return inst;
}, {
	check(...chks) {
		const def = this.def;
		return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	},
	with(...chks) {
		return this.check(...chks);
	},
	clone(def, params) {
		return clone(this, def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta) {
		reg.add(this, meta);
		return this;
	},
	refine(check, params) {
		return this.check(refine(check, params));
	},
	superRefine(refinement, params) {
		return this.check(superRefine(refinement, params));
	},
	overwrite(fn) {
		return this.check(/* @__PURE__ */ _overwrite(fn));
	},
	optional() {
		return optional(this);
	},
	exactOptional() {
		return exactOptional(this);
	},
	nullable() {
		return nullable(this);
	},
	nullish() {
		return optional(nullable(this));
	},
	nonoptional(params) {
		return nonoptional(this, params);
	},
	array() {
		return array(this);
	},
	or(arg) {
		return union([this, arg]);
	},
	and(arg) {
		return intersection(this, arg);
	},
	transform(tx) {
		return pipe(this, transform(tx));
	},
	default(d) {
		return _default(this, d);
	},
	prefault(d) {
		return prefault(this, d);
	},
	catch(params) {
		return _catch(this, params);
	},
	pipe(target) {
		return pipe(this, target);
	},
	readonly() {
		return readonly(this);
	},
	describe(description) {
		const cl = this.clone();
		globalRegistry.add(cl, { description });
		return cl;
	},
	meta(...args) {
		if (args.length === 0) return globalRegistry.get(this);
		const cl = this.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	},
	get "~standard"() {
		return hide(this, "~standard", {
			...standardProps(this),
			jsonSchema: {
				input: createStandardJSONSchemaMethod(this, "input"),
				output: createStandardJSONSchemaMethod(this, "output")
			}
		});
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	},
	parse: function _parse(data, params) {
		return parse(this, data, params, { callee: _parse });
	},
	parseAsync: async function _parseAsync(data, params) {
		return await parseAsync(this, data, params, { callee: _parseAsync });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	async safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(value) {
		own(this, "spa", value);
	},
	validate(data, params) {
		return validate(this, data, params);
	},
	validateAsync(data, params) {
		return validateAsync$1(this, data, params);
	},
	encode: function _encode(data, params) {
		return encode(this, data, params, { callee: _encode });
	},
	decode: function _decode(data, params) {
		return decode(this, data, params, { callee: _decode });
	},
	encodeAsync: async function _encodeAsync(data, params) {
		return await encodeAsync(this, data, params, { callee: _encodeAsync });
	},
	decodeAsync: async function _decodeAsync(data, params) {
		return await decodeAsync(this, data, params, { callee: _decodeAsync });
	},
	safeEncode(data, params) {
		return safeEncode(this, data, params);
	},
	safeDecode(data, params) {
		return safeDecode(this, data, params);
	},
	async safeEncodeAsync(data, params) {
		return safeEncodeAsync(this, data, params);
	},
	async safeDecodeAsync(data, params) {
		return safeDecodeAsync(this, data, params);
	},
	toJSONSchema(params) {
		return createToJSONSchemaMethod(this, {})(params);
	},
	get description() {
		return globalRegistry.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
});
/** @internal */
const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
	format: (inst) => aggregateChecks(inst).format ?? null,
	minLength: (inst) => aggregateChecks(inst).minimum ?? null,
	maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
	regex(...args) {
		return this.check(/* @__PURE__ */ _regex(...args));
	},
	includes(...args) {
		return this.check(/* @__PURE__ */ _includes(...args));
	},
	startsWith(...args) {
		return this.check(/* @__PURE__ */ _startsWith(...args));
	},
	endsWith(...args) {
		return this.check(/* @__PURE__ */ _endsWith(...args));
	},
	min(...args) {
		return this.check(/* @__PURE__ */ _minLength(...args));
	},
	max(...args) {
		return this.check(/* @__PURE__ */ _maxLength(...args));
	},
	length(...args) {
		return this.check(/* @__PURE__ */ _length(...args));
	},
	nonempty(...args) {
		return this.check(/* @__PURE__ */ _minLength(1, ...args));
	},
	lowercase(params) {
		return this.check(/* @__PURE__ */ _lowercase(params));
	},
	uppercase(params) {
		return this.check(/* @__PURE__ */ _uppercase(params));
	},
	trim() {
		return this.check(/* @__PURE__ */ _trim());
	},
	normalize(...args) {
		return this.check(/* @__PURE__ */ _normalize(...args));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ _toLowerCase());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ _toUpperCase());
	},
	slugify() {
		return this.check(/* @__PURE__ */ _slugify());
	}
}));
const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
}, {
	email(params) {
		return this.check(/* @__PURE__ */ _email(ZodEmail, params));
	},
	url(params) {
		return this.check(/* @__PURE__ */ _url(ZodURL, params));
	},
	jwt(params) {
		return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	},
	emoji(params) {
		return this.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	},
	guid(params) {
		return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
	},
	uuid(params) {
		return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	},
	uuidv4(params) {
		return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	},
	uuidv6(params) {
		return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	},
	uuidv7(params) {
		return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	},
	nanoid(params) {
		return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	},
	cuid(params) {
		return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	},
	cuid2(params) {
		return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	},
	ulid(params) {
		return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
	},
	base64(params) {
		return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
	},
	base64url(params) {
		return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	},
	xid(params) {
		return this.check(/* @__PURE__ */ _xid(ZodXID, params));
	},
	ksuid(params) {
		return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	},
	ipv4(params) {
		return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	},
	ipv6(params) {
		return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	},
	cidrv4(params) {
		return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	},
	cidrv6(params) {
		return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	},
	e164(params) {
		return this.check(/* @__PURE__ */ _e164(ZodE164, params));
	},
	datetime(params) {
		return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
	},
	date(params) {
		return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
	},
	time(params) {
		return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
	},
	duration(params) {
		return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
	}
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.isFinite = true;
}, /*@__PURE__*/ derived({
	minValue: (inst) => {
		const { minimum, exclusiveMinimum } = aggregateChecks(inst);
		return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
	},
	maxValue: (inst) => {
		const { maximum, exclusiveMaximum } = aggregateChecks(inst);
		return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
	},
	isInt: (inst) => {
		const { isInt, multipleOf } = aggregateChecks(inst);
		return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
	},
	format: (inst) => aggregateChecks(inst).format ?? null
}, {
	gt(value, params) {
		return this.check(/* @__PURE__ */ _gt(value, params));
	},
	gte(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	min(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	lt(value, params) {
		return this.check(/* @__PURE__ */ _lt(value, params));
	},
	lte(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	max(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	int(params) {
		return this.check(int(params));
	},
	safe(params) {
		return this.check(int(params));
	},
	positive(params) {
		return this.check(/* @__PURE__ */ _gt(0, params));
	},
	nonnegative(params) {
		return this.check(/* @__PURE__ */ _gte(0, params));
	},
	negative(params) {
		return this.check(/* @__PURE__ */ _lt(0, params));
	},
	nonpositive(params) {
		return this.check(/* @__PURE__ */ _lte(0, params));
	},
	multipleOf(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	step(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	finite() {
		return this;
	}
}));
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => void 0;
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
}, {
	min(n, params) {
		return this.check(/* @__PURE__ */ _minLength(n, params));
	},
	nonempty(params) {
		return this.check(/* @__PURE__ */ _minLength(1, params));
	},
	max(n, params) {
		return this.check(/* @__PURE__ */ _maxLength(n, params));
	},
	length(n, params) {
		return this.check(/* @__PURE__ */ _length(n, params));
	},
	unwrap() {
		return this.element;
	}
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
	keyof() {
		return _enum(Object.keys(this._zod.def.shape));
	},
	catchall(catchall) {
		return this.clone(mergeDefs(this._zod.def, { catchall }));
	},
	passthrough() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	loose() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	strict() {
		return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
	},
	strip() {
		return this.clone(mergeDefs(this._zod.def, { catchall: void 0 }));
	},
	extend(incoming) {
		return extend(this, incoming);
	},
	safeExtend(incoming) {
		return safeExtend(this, incoming);
	},
	merge(other) {
		return merge(this, other);
	},
	pick(mask) {
		return pick(this, mask);
	},
	omit(mask) {
		return omit(this, mask);
	},
	partial(...args) {
		return partial(ZodOptional, this, args[0]);
	},
	exactPartial(...args) {
		return partial(ZodExactOptional, this, args[0], "exactPartial");
	},
	required(...args) {
		return required(ZodNonOptional, this, args[0]);
	}
});
function object(shape, params) {
	const def = {
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	};
	return new ZodObject(def);
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
const ZodRecord = /*@__PURE__*/ $constructor("ZodRecord", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodRecord.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
	inst.keyType = def.keyType;
	inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
	if (!valueType || !valueType._zod) return new ZodRecord({
		type: "record",
		keyType: string(),
		valueType: keyType,
		...normalizeParams(valueType)
	});
	return new ZodRecord({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = [...inst._zod.values];
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
	return new ZodEnum({
		type: "enum",
		entries,
		...normalizeParams(params)
	});
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
	});
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
//#endregion
//#region packages/motor/src/datos/esquemas.ts
const id = string().regex(/^[a-z0-9-]+$/, "usa solo minúsculas sin tildes, números y guiones");
const entero = (min = 0) => number({ error: "debe ser un número" }).int("debe ser un número entero").min(min, `debe ser como mínimo ${min}`);
const esquemaEstado = _enum(["definida", "pendiente"], { error: "debe ser \"definida\" o \"pendiente\"" });
const esquemaColor = object({
	id,
	nombre: string(),
	hex: string()
});
const esquemaTipoPrenda = object({
	id,
	nombre: string(),
	porColor: entero(),
	espacios: entero(1),
	humedad: entero(),
	puntos: number().int()
});
const esquemaPrendas = object({
	colores: array(esquemaColor).min(1),
	tipos: array(esquemaTipoPrenda).min(1)
});
/** Números (o ids) que usa el efecto, para poder ajustarlos sin tocar código. */
const parametros = record(string(), union([number(), string()])).default({});
const camposCarta = {
	id,
	nombre: string(),
	copias: entero(),
	estado: esquemaEstado,
	grupo: string(),
	efecto: string().nullable().default(null),
	parametros,
	texto: string().default("")
};
const esquemaCuerdas = object({ cartas: array(object({
	...camposCarta,
	espacios: entero(1).default(3)
})) });
const esquemaMazo = object({ cartas: array(object(camposCarta)) });
const esquemaObjetivos = object({ objetivos: array(object({
	id,
	nombre: string(),
	estado: esquemaEstado,
	efecto: string().nullable().default(null),
	parametros,
	texto: string().default(""),
	/** Sin límite: cada `cada` de lo que cuenta el objetivo dan `puntos`. */
	cada: entero(1),
	puntos: entero()
})) });
const parCartas = object({
	cuerdas: entero(),
	acciones: entero()
});
const esquemaAjustesPorDefecto = object({
	jugadores: entero(2).max(4, "como máximo 4"),
	manoInicial: parCartas,
	/** Se roban `cartas` repartidas como quiera el jugador, con como mucho `maxCuerdas` de cuerda. */
	roboPorTurno: object({
		cartas: entero(),
		maxCuerdas: entero()
	}),
	jugablesPorTurno: parCartas,
	limiteMano: entero(1),
	umbralFinal: entero(1),
	cestas: object({
		porJugadores: object({
			"2": entero(1),
			"3": entero(1),
			"4": entero(1)
		}),
		prendasPorCesta: entero(1)
	}),
	tendedero: object({
		lineas: entero(1),
		cartasPorLinea: entero(1)
	}),
	objetivos: object({
		comunes: entero(),
		secretosRepartidos: entero()
	})
});
//#endregion
//#region packages/motor/src/estado/registro.ts
/** Apunta una línea en el registro: el texto en castellano y, a la par, su versión estructurada. */
function anotar(p, clave, datos, texto) {
	p.registro.push(texto);
	(p.entradas ??= []).push({
		clave,
		datos
	});
}
/** Motivo por el que una jugada no vale. */
function no(clave, texto, datos = {}) {
	return {
		clave,
		datos,
		texto
	};
}
/** Una prenda en los datos del registro: su tipo y su color («camiseta:azul»). */
function refPrenda(p, prenda) {
	const { tipo, color } = p.prendas[prenda];
	return `${tipo}:${color}`;
}
//#endregion
//#region packages/motor/src/azar.ts
function sembrar(semilla) {
	let h = 1779033703 ^ semilla.length;
	for (let i = 0; i < semilla.length; i++) {
		h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
		h = h << 13 | h >>> 19;
	}
	h = Math.imul(h ^ h >>> 16, 2246822507);
	h = Math.imul(h ^ h >>> 13, 3266489909);
	return (h ^ h >>> 16) >>> 0;
}
/** Número entre 0 y 1 (mulberry32). Avanza el estado guardado en `p.azar`. */
function aleatorio(p) {
	p.azar = p.azar + 1831565813 >>> 0;
	let t = p.azar;
	t = Math.imul(t ^ t >>> 15, t | 1);
	t ^= t + Math.imul(t ^ t >>> 7, t | 61);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function barajar(p, lista) {
	for (let i = lista.length - 1; i > 0; i--) {
		const j = Math.floor(aleatorio(p) * (i + 1));
		[lista[i], lista[j]] = [lista[j], lista[i]];
	}
}
/** Semilla corta y fácil de copiar, para cuando no se fija una a mano. */
function semillaNueva() {
	const letras = "abcdefghjkmnpqrstuvwxyz23456789";
	return Array.from({ length: 6 }, () => letras[Math.floor(Math.random() * 31)]).join("");
}
//#endregion
//#region packages/motor/src/estado/utilidades.ts
function pilaDe(mazo) {
	return mazo === "cuerdas" ? "cuerdas" : mazo === "acciones" ? "acciones" : "dia";
}
function defCarta(p, carta) {
	return p.catalogo.cartas[p.cartas[carta]];
}
function tipoDe(p, prenda) {
	return p.catalogo.tipos[p.prendas[prenda].tipo];
}
function nombrePrenda(p, prenda) {
	const { tipo, color } = p.prendas[prenda];
	return `${p.catalogo.tipos[tipo].nombre.toLowerCase()} ${p.catalogo.colores[color].nombre.toLowerCase()}`;
}
function espacios(n) {
	return n === 1 ? "1 espacio" : `${n} espacios`;
}
function numero(params, clave, porDefecto) {
	const v = params[clave];
	return typeof v === "number" ? v : porDefecto;
}
function texto(params, clave) {
	const v = params[clave];
	return typeof v === "string" ? v : void 0;
}
/** Dónde está colgada una prenda, si lo está. */
function localizar(p, prenda) {
	for (const [jugador, j] of p.jugadores.entries()) for (const [linea, l] of j.lineas.entries()) for (const [posicion, tendida] of l.cartas.entries()) {
		const colgada = tendida.colgadas.find((c) => c.prenda === prenda);
		if (colgada) return {
			jugador,
			linea,
			posicion,
			tendida,
			colgada
		};
	}
	return null;
}
/** La prenda que ocupa ese espacio de una carta de cuerda, si hay alguna. */
function prendaEn(p, sitio) {
	return (p.jugadores[sitio.jugador]?.lineas[sitio.linea]?.cartas[sitio.posicion])?.colgadas.find((c) => sitio.inicio >= c.inicio && sitio.inicio < c.inicio + tipoDe(p, c.prenda).espacios)?.prenda;
}
/** null si la prenda cabe en ese sitio; si no, el motivo. `ignorar`: prendas que se están moviendo. */
function motivoNoCabe(p, sitio, prenda, ignorar = []) {
	const ignoradas = typeof ignorar === "string" ? [ignorar] : ignorar;
	const tendida = p.jugadores[sitio.jugador]?.lineas[sitio.linea]?.cartas[sitio.posicion];
	if (!tendida) return no("sinCuerdaAhi", "Ahí no hay ninguna carta de cuerda.");
	const huecos = defCarta(p, tendida.carta).espacios;
	const ocupa = tipoDe(p, prenda).espacios;
	if (!Number.isInteger(sitio.inicio) || sitio.inicio < 0 || sitio.inicio + ocupa > huecos) return no("noCabe", `No cabe: ocupa ${espacios(ocupa)} y tiene que caber entera en una sola carta.`, { n: ocupa });
	for (const c of tendida.colgadas) {
		if (ignoradas.includes(c.prenda)) continue;
		const fin = c.inicio + tipoDe(p, c.prenda).espacios;
		if (sitio.inicio < fin && c.inicio < sitio.inicio + ocupa) return no("ocupado", "Esos espacios ya están ocupados.");
	}
	return null;
}
function descolgar(u) {
	u.tendida.colgadas = u.tendida.colgadas.filter((c) => c !== u.colgada);
}
/** Suma humedad con cartas que mojan: va a extra (cartas junto a la prenda) y no a su escala. */
function mojarPrenda(p, prenda, h) {
	const pr = p.prendas[prenda];
	pr.humedad += h;
	pr.extra = (pr.extra ?? 0) + h;
}
/** Quita humedad: primero las cartas que mojan (extra) y después la escala. Devuelve si se ha quedado sin humedad. */
function quitarHumedad(p, prenda, h) {
	const pr = p.prendas[prenda];
	pr.humedad = Math.max(0, pr.humedad - h);
	pr.extra = Math.min(pr.humedad, Math.max(0, (pr.extra ?? 0) - h));
	return pr.humedad === 0;
}
/** La prenda se cae: vuelve a las prendas por tender de su dueño, con su humedad inicial. */
function caer(p, prenda) {
	const u = localizar(p, prenda);
	if (!u) return;
	descolgar(u);
	p.prendas[prenda].humedad = tipoDe(p, prenda).humedad;
	p.prendas[prenda].extra = 0;
	p.jugadores[u.jugador].pendientes.push(prenda);
	anotar(p, "seCae", {
		prenda: refPrenda(p, prenda),
		jugador: u.jugador
	}, `${nombrePrenda(p, prenda)} se cae y vuelve a las prendas por tender de ${p.jugadores[u.jugador].nombre}.`);
}
/** Roba hasta `n` cartas; si el mazo se acaba, baraja su descarte. Devuelve cuántas robó. */
function robar(p, jugador, pila, n) {
	let robadas = 0;
	for (let i = 0; i < n; i++) {
		if (p.mazos[pila].length === 0 && p.descartes[pila].length > 0) {
			p.mazos[pila] = p.descartes[pila];
			p.descartes[pila] = [];
			barajar(p, p.mazos[pila]);
			anotar(p, "barajaDescarte", { pila }, `Se baraja el descarte de ${pila} para formar un mazo nuevo.`);
		}
		const carta = p.mazos[pila].pop();
		if (!carta) break;
		p.jugadores[jugador].mano.push(carta);
		robadas++;
	}
	return robadas;
}
//#endregion
//#region packages/motor/src/estado/secado.ts
/** Efecto pasivo de una carta de cuerda (por el id de la copia), si tiene. */
function efectoDeCuerda(p, carta) {
	const def = defCarta(p, carta);
	const efecto = def.efecto ? efectos[def.efecto] : void 0;
	return efecto?.tipo === "cuerda" ? {
		efecto,
		params: def.parametros
	} : null;
}
/** Efecto pasivo de una carta de cuerda tendida, si tiene. */
function efectoCuerda(p, tendida) {
	return efectoDeCuerda(p, tendida.carta);
}
/** Efecto del clima activo, si hay. */
function efectoClima(p) {
	if (!p.dia) return null;
	const def = defCarta(p, p.dia);
	const efecto = def.efecto ? efectos[def.efecto] : void 0;
	return efecto?.tipo === "clima" ? {
		efecto,
		params: def.parametros
	} : null;
}
/** La carta de cuerda justo encima de esta (misma posición, línea anterior), si la hay. */
function cartaDeArriba(p, tendida) {
	for (const j of p.jugadores) for (let l = 1; l < j.lineas.length; l++) {
		const pos = j.lineas[l].cartas.indexOf(tendida);
		if (pos >= 0) return j.lineas[l - 1].cartas[pos] ?? null;
	}
	return null;
}
/** La carta que protege a esta de la etiqueta: ella misma por su habilidad, o la de arriba si la cubre (el tejadillo). */
function quienProtege(p, tendida, etiqueta) {
	if (efectoCuerda(p, tendida)?.efecto.protegeDe?.includes(etiqueta)) return tendida;
	const arriba = cartaDeArriba(p, tendida);
	if (arriba && efectoCuerda(p, arriba)?.efecto.cubreAbajo?.includes(etiqueta)) return arriba;
	return null;
}
/** Si la cuerda (por su habilidad o la de arriba) o la ronda (por un evento) protegen de algo. */
function protegidaDe(p, tendida, etiqueta) {
	return quienProtege(p, tendida, etiqueta) !== null || p.rondaProtegeDe.includes(etiqueta);
}
/** La prenda pasa a la ropa seca de su dueño y da sus puntos (con el modificador de su cuerda). */
function secarPrenda(p, prenda) {
	const u = localizar(p, prenda);
	if (!u) return;
	const jugador = p.jugadores[u.jugador];
	const base = tipoDe(p, prenda).puntos;
	const cuerda = efectoCuerda(p, u.tendida);
	const puntos = Math.max(0, cuerda?.efecto.puntosAlSecar?.(p, prenda, cuerda.params, base) ?? base);
	descolgar(u);
	p.prendas[prenda].humedad = 0;
	p.prendas[prenda].extra = 0;
	jugador.seca.push(prenda);
	const arriba = cartaDeArriba(p, u.tendida);
	const cubre = arriba && efectoCuerda(p, arriba)?.efecto.cubreAbajo?.length ? [defCarta(p, arriba.carta).id] : [];
	jugador.secadoEn[prenda] = [defCarta(p, u.tendida.carta).id, ...cubre];
	jugador.puntos += puntos;
	const extra = puntos !== base ? ` (${base} ${puntos > base ? "+" : "−"} ${Math.abs(puntos - base)} por la cuerda)` : "";
	anotar(p, "seca", {
		jugador: u.jugador,
		prenda: refPrenda(p, prenda),
		puntos,
		base
	}, `${jugador.nombre} seca ${nombrePrenda(p, prenda)}: +${puntos} pts${extra}.`);
}
/**
* Al acabar la ronda, para cada jugador: el clima actúa (p. ej. el viento tira prendas), y después todas las prendas
* colgadas del jugador pierden humedad según su cuerda y el clima; las que llegan a 0 se secan.
*/
function faseDeSecado(p, jugador) {
	const clima = efectoClima(p);
	clima?.efecto.antesDelSecado?.(p, jugador, clima.params);
	for (const linea of p.jugadores[jugador].lineas) for (const tendida of linea.cartas) {
		const cuerda = efectoCuerda(p, tendida);
		const ajuste = clima?.efecto.ajusteSecado?.(p, tendida, clima.params) ?? 0;
		const baja = Math.max(0, (cuerda?.efecto.secado?.(cuerda.params) ?? 1) + ajuste);
		for (const { prenda } of [...tendida.colgadas]) if (quitarHumedad(p, prenda, baja)) secarPrenda(p, prenda);
	}
}
//#endregion
//#region packages/motor/src/efectos/acciones.ts
function cartaObjetivo(p, j) {
	const o = j.objetivo;
	return p.jugadores[o.jugador].lineas[o.linea].cartas[o.posicion];
}
function cambiarHumedad(p, prenda, cambio) {
	if (cambio > 0) mojarPrenda(p, prenda, cambio);
	else if (quitarHumedad(p, prenda, -cambio)) secarPrenda(p, prenda);
}
function mover(p, j) {
	const { prenda, destino, jugador } = j.objetivo;
	descolgar(localizar(p, prenda));
	p.jugadores[jugador].lineas[destino.linea].cartas[destino.posicion].colgadas.push({
		prenda,
		inicio: destino.inicio
	});
	anotar(p, "seMueve", {
		prenda: refPrenda(p, prenda),
		linea: destino.linea + 1,
		posicion: destino.posicion + 1
	}, `Se mueve ${nombrePrenda(p, prenda)} a la línea ${destino.linea + 1}, carta ${destino.posicion + 1}.`);
}
function sitio(p, j) {
	const o = j.objetivo;
	return `${defCarta(p, cartaObjetivo(p, j).carta).nombre} (línea ${o.linea + 1}, carta ${o.posicion + 1})`;
}
/** Los datos de `sitio` para el registro estructurado. */
function datosSitio(p, j) {
	const o = j.objetivo;
	return {
		carta: defCarta(p, cartaObjetivo(p, j).carta).id,
		linea: o.linea + 1,
		posicion: o.posicion + 1
	};
}
const efectosAccion = {
	"mojar-cuerda-rival": {
		tipo: "accion",
		blanco: "cartaRival",
		etiquetas: ["fastidio", "moja"],
		validar: (p, j) => cartaObjetivo(p, j).colgadas.length ? null : no("cuerdaSinPrendas", "Esa carta de cuerda no tiene prendas."),
		aplicar(p, j, params) {
			const h = numero(params, "humedad", 1);
			for (const { prenda } of cartaObjetivo(p, j).colgadas) mojarPrenda(p, prenda, h);
			anotar(p, "mojaCuerda", {
				jugador: j.objetivo.jugador,
				h
			}, `Las prendas de esa cuerda de ${p.jugadores[j.objetivo.jugador].nombre} ganan ${h} de humedad.`);
		}
	},
	"rafaga-de-viento": {
		tipo: "accion",
		blanco: "prendaRival",
		etiquetas: ["fastidio", "tira"],
		aplicar: (p, j) => caer(p, j.objetivo.prenda)
	},
	"retrasar-secado": {
		tipo: "accion",
		blanco: "prendaRival",
		etiquetas: ["fastidio", "moja"],
		aplicar(p, j, params) {
			const h = numero(params, "humedad", 1);
			mojarPrenda(p, j.objetivo.prenda, h);
			anotar(p, "ganaHumedad", {
				prenda: refPrenda(p, j.objetivo.prenda),
				h
			}, `${nombrePrenda(p, j.objetivo.prenda)} gana ${h} de humedad.`);
		}
	},
	"mover-prenda-rival": {
		tipo: "accion",
		blanco: "moverRival",
		etiquetas: ["fastidio", "mueve"],
		aplicar: mover
	},
	"mover-prenda-propia": {
		tipo: "accion",
		blanco: "moverPropia",
		etiquetas: [],
		aplicar: mover
	},
	"colocar-cuerda-extra": {
		tipo: "accion",
		blanco: "ninguno",
		etiquetas: [],
		aplicar(p, _j, params) {
			const n = numero(params, "cuerdas", 1);
			p.turno.cuerdasExtra += n;
			anotar(p, "cuerdasExtra", { n }, `Este turno puede jugar ${n} cuerda(s) más.`);
		}
	},
	"secar-prenda": {
		tipo: "accion",
		blanco: "prendaPropia",
		etiquetas: [],
		aplicar: (p, j) => secarPrenda(p, j.objetivo.prenda)
	},
	"reducir-humedad": {
		tipo: "accion",
		blanco: "prendaPropia",
		etiquetas: [],
		aplicar(p, j, params) {
			const h = numero(params, "humedad", 1);
			anotar(p, "pierdeHumedad", {
				prenda: refPrenda(p, j.objetivo.prenda),
				h
			}, `${nombrePrenda(p, j.objetivo.prenda)} pierde ${h} de humedad.`);
			cambiarHumedad(p, j.objetivo.prenda, -h);
		}
	},
	"cambiar-prendas": {
		tipo: "accion",
		blanco: "cambiarPrendas",
		etiquetas: [],
		aplicar(p, j) {
			const a = j.objetivo.prenda;
			const b = prendaEn(p, {
				jugador: j.jugador,
				...j.objetivo.destino
			});
			const ua = localizar(p, a);
			const ub = localizar(p, b);
			descolgar(ua);
			descolgar(ub);
			ub.tendida.colgadas.push({
				prenda: a,
				inicio: ub.colgada.inicio
			});
			ua.tendida.colgadas.push({
				prenda: b,
				inicio: ua.colgada.inicio
			});
			anotar(p, "intercambianPrendas", {
				prenda: refPrenda(p, a),
				otraPrenda: refPrenda(p, b)
			}, `Se intercambian ${nombrePrenda(p, a)} y ${nombrePrenda(p, b)}.`);
		}
	},
	"cambiar-cuerdas": {
		tipo: "accion",
		blanco: "cambiarCuerdas",
		etiquetas: [],
		aplicar(p, j) {
			const { destino } = j.objetivo;
			const a = cartaObjetivo(p, j);
			const b = p.jugadores[j.jugador].lineas[destino.linea].cartas[destino.posicion];
			[a.colgadas, b.colgadas] = [b.colgadas, a.colgadas];
			anotar(p, "intercambianCuerdas", {
				...datosSitio(p, j),
				lineaDestino: destino.linea + 1,
				posicionDestino: destino.posicion + 1
			}, `Se intercambia lo colgado en ${sitio(p, j)} con lo de la línea ${destino.linea + 1}, carta ${destino.posicion + 1}.`);
		}
	},
	"mover-cuerda": {
		tipo: "accion",
		blanco: "moverCuerda",
		etiquetas: [],
		aplicar(p, j) {
			const o = j.objetivo;
			const d = o.destino;
			const lineas = p.jugadores[j.jugador].lineas;
			const nombre = sitio(p, j);
			const datos = datosSitio(p, j);
			if (d.posicion < lineas[d.linea].cartas.length) {
				const otra = lineas[d.linea].cartas[d.posicion];
				lineas[d.linea].cartas[d.posicion] = lineas[o.linea].cartas[o.posicion];
				lineas[o.linea].cartas[o.posicion] = otra;
				anotar(p, "cuerdaCambiaSitio", {
					...datos,
					otra: defCarta(p, otra.carta).id
				}, `${nombre} cambia de sitio con ${defCarta(p, otra.carta).nombre}.`);
			} else {
				const [movida] = lineas[o.linea].cartas.splice(o.posicion, 1);
				lineas[d.linea].cartas.push(movida);
				anotar(p, "cuerdaAlFinal", {
					...datos,
					lineaDestino: d.linea + 1
				}, `${nombre} pasa al final de la línea ${d.linea + 1}.`);
			}
		}
	},
	"buscar-cuerda": {
		tipo: "accion",
		blanco: "ninguno",
		etiquetas: [],
		aplicar(p, j, params) {
			const n = robar(p, j.jugador, "cuerdas", numero(params, "cartas", 1));
			anotar(p, "robaCuerdas", {
				jugador: j.jugador,
				n
			}, `${p.jugadores[j.jugador].nombre} roba ${n} carta(s) de cuerda.`);
		}
	},
	"anular-fastidio": {
		tipo: "accion",
		blanco: "reaccion",
		etiquetas: [],
		aplicar() {}
	},
	"proteger-cuerda": {
		tipo: "accion",
		blanco: "cartaPropia",
		etiquetas: [],
		aplicar(p, j) {
			cartaObjetivo(p, j).protegida = true;
			anotar(p, "cuerdaProtegida", {}, "Esa cuerda queda protegida del fastidio hasta su próximo turno.");
		}
	}
};
//#endregion
//#region packages/motor/src/efectos/climas.ts
const efectosClima = {
	soleado: {
		tipo: "clima",
		ajusteSecado: (_p, _t, params) => numero(params, "humedad", 1)
	},
	lluvia: {
		tipo: "clima",
		ajusteSecado(p, tendida, params) {
			if (protegidaDe(p, tendida, "moja")) return 0;
			const rondaDeLluvia = p.ronda - (p.diaDesde ?? p.ronda) + 1;
			const cada = numero(params, "cadaRondas", 0);
			if (cada > 0 && rondaDeLluvia % cada === 0) return 0;
			return -numero(params, "humedad", 1);
		}
	},
	viento: {
		tipo: "clima",
		ajusteSecado: (_p, _t, params) => numero(params, "humedad", 1),
		antesDelSecado(p, jugador, params) {
			const tipo = texto(params, "cae") ?? "calcetin";
			for (const linea of p.jugadores[jugador].lineas) for (const tendida of linea.cartas) {
				if (protegidaDe(p, tendida, "tira")) continue;
				for (const { prenda } of [...tendida.colgadas]) if (p.prendas[prenda].tipo === tipo) caer(p, prenda);
			}
		}
	}
};
//#endregion
//#region packages/motor/src/efectos/cuerdas.ts
const efectosCuerda = {
	tejadillo: {
		tipo: "cuerda",
		protegeDe: ["moja"],
		cubreAbajo: ["moja"]
	},
	resistente: {
		tipo: "cuerda",
		protegeDe: ["tira", "mueve"]
	},
	fragil: {
		tipo: "cuerda",
		paraRival: true,
		noGastaTurno: true,
		seRompeTras: (params) => numero(params, "rondas", 2)
	},
	"secado-rapido": {
		tipo: "cuerda",
		secado: (params) => numero(params, "humedad", 2)
	},
	"modificador-puntuacion": {
		tipo: "cuerda",
		puntosAlSecar(p, prenda, params, base) {
			const { color, tipo } = p.prendas[prenda];
			const colorPedido = texto(params, "color");
			const tipoPedido = texto(params, "tipo");
			if (colorPedido && colorPedido !== color || tipoPedido && tipoPedido !== tipo) return base;
			return base + numero(params, "bonus", 1);
		}
	}
};
//#endregion
//#region packages/motor/src/efectos/eventos.ts
/** Todas las prendas colgadas de todos los jugadores, con su carta de cuerda. */
function colgadas(p, jugador) {
	return p.jugadores.flatMap((j, i) => jugador !== void 0 && i !== jugador ? [] : j.lineas.flatMap((l) => l.cartas.flatMap((tendida) => tendida.colgadas.map(({ prenda }) => ({
		prenda,
		tendida
	})))));
}
/** A cada jugador se le cae la prenda que dé más valor a `orden`, salvo en cuerdas que protegen de caídas. */
function caeUnaPorJugador(p, orden) {
	p.jugadores.forEach((_, i) => {
		const candidatas = colgadas(p, i).filter(({ tendida }) => !protegidaDe(p, tendida, "tira"));
		if (!candidatas.length) return;
		caer(p, candidatas.reduce((mejor, c) => orden(c.prenda) > orden(mejor.prenda) ? c : mejor).prenda);
	});
}
function sumarHumedad(p, h, filtro) {
	for (const { prenda, tendida } of colgadas(p)) if (filtro(prenda, tendida)) mojarPrenda(p, prenda, h);
}
const efectosEvento = {
	"tormenta-repentina": {
		tipo: "evento",
		resolver(p, params) {
			const h = numero(params, "humedad", 1);
			sumarHumedad(p, h, (_prenda, tendida) => !protegidaDe(p, tendida, "moja"));
			anotar(p, "tormenta", { h }, `Todas las prendas sin tejadillo ganan ${h} de humedad.`);
		}
	},
	"ola-de-calor": {
		tipo: "evento",
		resolver(p, params) {
			const h = numero(params, "humedad", 1);
			anotar(p, "olaDeCalor", { h }, `Todas las prendas colgadas pierden ${h} de humedad.`);
			for (const { prenda } of colgadas(p)) if (quitarHumedad(p, prenda, h)) secarPrenda(p, prenda);
		}
	},
	"vecina-sacude-alfombra": {
		tipo: "evento",
		resolver(p, params) {
			const color = texto(params, "color") ?? "blanco";
			const h = numero(params, "humedad", 1);
			sumarHumedad(p, h, (prenda) => p.prendas[prenda].color === color);
			anotar(p, "prendasDeColor", {
				color,
				h
			}, `Las prendas ${p.catalogo.colores[color]?.nombre.toLowerCase() ?? color} colgadas ganan ${h} de humedad.`);
		}
	},
	"pinzas-viejas": {
		tipo: "evento",
		resolver: (p) => caeUnaPorJugador(p, (prenda) => p.prendas[prenda].humedad)
	},
	"viento-traicionero": {
		tipo: "evento",
		resolver: (p) => caeUnaPorJugador(p, (prenda) => tipoDe(p, prenda).espacios * 100 + p.prendas[prenda].humedad)
	},
	"ropa-se-engancha": {
		tipo: "evento",
		resolver(p) {
			p.rondaProtegeDe = ["tira", "mueve"];
			anotar(p, "ropaEnganchada", {}, "Durante esta ronda ninguna prenda se puede tirar ni mover.");
		}
	}
};
//#endregion
//#region packages/motor/src/efectos/objetivos.ts
function porColor(p, prendas) {
	return Object.keys(p.catalogo.colores).map((c) => prendas.filter((id) => p.prendas[id].color === c).length);
}
const efectosObjetivo = {
	"prendas-secas": {
		tipo: "objetivo",
		contar(p, jugador, params) {
			const tipo = texto(params, "tipo");
			const color = texto(params, "color");
			return p.jugadores[jugador].seca.filter((id) => (!tipo || p.prendas[id].tipo === tipo) && (!color || p.prendas[id].color === color)).length;
		}
	},
	"mismo-color": {
		tipo: "objetivo",
		contar: (p, jugador) => Math.max(0, ...porColor(p, p.jugadores[jugador].seca))
	},
	"juegos-de-colores": {
		tipo: "objetivo",
		contar: (p, jugador) => Math.min(...porColor(p, p.jugadores[jugador].seca))
	},
	parejas: {
		tipo: "objetivo",
		contar(p, jugador, params) {
			const tipo = texto(params, "tipo") ?? "calcetin";
			return porColor(p, p.jugadores[jugador].seca.filter((id) => p.prendas[id].tipo === tipo)).reduce((s, n) => s + Math.floor(n / 2), 0);
		}
	},
	"lineas-completas": {
		tipo: "objetivo",
		contar: (p, jugador) => p.jugadores[jugador].lineas.filter((l) => l.cartas.length >= p.ajustes.tendedero.cartasPorLinea).length
	},
	"clases-de-cuerda": {
		tipo: "objetivo",
		contar(p, jugador) {
			const clases = /* @__PURE__ */ new Set();
			for (const l of p.jugadores[jugador].lineas) for (const t of l.cartas) clases.add(p.catalogo.cartas[p.cartas[t.carta]].efecto ?? "basica");
			return clases.size;
		}
	},
	"cuerdas-llenas": {
		tipo: "objetivo",
		contar(p, jugador, params) {
			const mismoColor = numero(params, "mismoColor", 0) > 0;
			const llena = (t) => t.colgadas.reduce((s, c) => s + tipoDe(p, c.prenda).espacios, 0) >= p.catalogo.cartas[p.cartas[t.carta]].espacios && (!mismoColor || new Set(t.colgadas.map((c) => p.prendas[c.prenda].color)).size === 1);
			return p.jugadores[jugador].lineas.flatMap((l) => l.cartas).filter(llena).length;
		}
	},
	trofeos: {
		tipo: "objetivo",
		contar: (p, jugador) => p.jugadores[jugador].trofeos.length
	},
	"viejas-colocadas": {
		tipo: "objetivo",
		contar: (p, jugador) => p.jugadores[jugador].trofeos.length + p.jugadores.flatMap((j) => j.lineas.flatMap((l) => l.cartas)).filter((t) => t.colocadaPor === jugador).length
	},
	conjuntos: {
		tipo: "objetivo",
		contar(p, jugador) {
			const seca = p.jugadores[jugador].seca;
			return Object.keys(p.catalogo.colores).reduce((total, color) => {
				const delColor = seca.filter((id) => p.prendas[id].color === color);
				return total + Math.min(...Object.keys(p.catalogo.tipos).map((tipo) => delColor.filter((id) => p.prendas[id].tipo === tipo).length));
			}, 0);
		}
	},
	"secadas-en": {
		tipo: "objetivo",
		contar(p, jugador, params) {
			const efecto = texto(params, "efecto");
			return Object.values(p.jugadores[jugador].secadoEn).filter((defs) => defs.some((def) => p.catalogo.cartas[def]?.efecto === efecto)).length;
		}
	}
};
//#endregion
//#region packages/motor/src/efectos/index.ts
const BLANCOS_CON_DESTINO = [
	"moverPropia",
	"moverRival",
	"cambiarPrendas",
	"cambiarCuerdas",
	"moverCuerda"
];
const efectos = {
	...efectosAccion,
	...efectosCuerda,
	...efectosObjetivo,
	...efectosClima,
	...efectosEvento
};
//#endregion
//#region packages/motor/src/datos/cargar.ts
const ARCHIVOS_DATOS = [
	"prendas",
	"cuerdas",
	"acciones",
	"dia",
	"objetivos",
	"ajustes-por-defecto"
];
var ErrorDatos = class extends Error {
	errores;
	constructor(errores) {
		super(errores.join("\n"));
		this.errores = errores;
		this.name = "ErrorDatos";
	}
};
/** Valida el contenido de los JSON de /data y lo convierte en Datos. Lanza ErrorDatos con todos los fallos. */
function cargarDatos(crudos) {
	const errores = [];
	const leer = (esquema, archivo) => {
		const r = esquema.safeParse(crudos[archivo]);
		if (r.success) return r.data;
		for (const fallo of r.error.issues) errores.push(`${archivo}.json → ${ruta(fallo.path, crudos[archivo])}: ${fallo.message}`);
		return null;
	};
	const prendas = leer(esquemaPrendas, "prendas");
	const cuerdas = leer(esquemaCuerdas, "cuerdas");
	const acciones = leer(esquemaMazo, "acciones");
	const dia = leer(esquemaMazo, "dia");
	const objetivos = leer(esquemaObjetivos, "objetivos");
	const porDefecto = leer(esquemaAjustesPorDefecto, "ajustes-por-defecto");
	if (!prendas || !cuerdas || !acciones || !dia || !objetivos || !porDefecto) throw new ErrorDatos(errores);
	const conMazo = (mazo, lista) => lista.map((c) => ({
		espacios: 0,
		...c,
		mazo
	}));
	const cartas = [
		...conMazo("cuerdas", cuerdas.cartas),
		...conMazo("acciones", acciones.cartas),
		...conMazo("dia", dia.cartas)
	];
	repetidos("prendas.json → colores", prendas.colores, errores);
	repetidos("prendas.json → tipos", prendas.tipos, errores);
	repetidos("cartas (entre cuerdas, acciones y el mazo del día)", cartas, errores);
	repetidos("objetivos.json", objetivos.objetivos, errores);
	for (const c of [...cartas, ...objetivos.objetivos]) {
		if (c.estado !== "definida") continue;
		const archivo = "mazo" in c ? `${c.mazo}.json` : "objetivos.json";
		if (c.efecto === null) {
			if (!("mazo" in c && c.mazo === "cuerdas")) errores.push(`${archivo} → [${c.id}]: está "definida" pero no tiene efecto`);
		} else if (!efectos[c.efecto]) errores.push(`${archivo} → [${c.id}]: está "definida" pero su efecto "${c.efecto}" todavía no está programado; déjala "pendiente"`);
		else {
			const esperados = !("mazo" in c) ? ["objetivo"] : {
				cuerdas: ["cuerda"],
				acciones: ["accion"],
				dia: ["clima", "evento"]
			}[c.mazo].slice();
			if (!esperados.includes(efectos[c.efecto].tipo)) errores.push(`${archivo} → [${c.id}]: el efecto "${c.efecto}" no es de ${esperados.join(" ni de ")}`);
		}
	}
	if (errores.length) throw new ErrorDatos(errores);
	return {
		colores: prendas.colores,
		tipos: prendas.tipos,
		cartas,
		objetivos: objetivos.objetivos,
		porDefecto
	};
}
function repetidos(donde, lista, errores) {
	const vistos = /* @__PURE__ */ new Set();
	for (const { id } of lista) {
		if (vistos.has(id)) errores.push(`${donde}: el id "${id}" está repetido`);
		vistos.add(id);
	}
}
function ruta(camino, raiz) {
	let actual = raiz;
	let texto = "";
	for (const paso of camino) {
		actual = actual && typeof actual === "object" ? actual[paso] : void 0;
		if (typeof paso === "number") {
			const id = actual && typeof actual === "object" ? actual.id : void 0;
			texto += typeof id === "string" ? `[${id}]` : `[${paso}]`;
		} else texto += texto ? `.${String(paso)}` : String(paso);
	}
	return texto || "(todo el archivo)";
}
//#endregion
//#region packages/motor/src/ajustes.ts
function cestasPorDefecto(datos, jugadores) {
	const tabla = datos.porDefecto.cestas.porJugadores;
	return tabla[String(jugadores)] ?? tabla["4"];
}
function ajustesIniciales(datos) {
	const d = structuredClone(datos.porDefecto);
	return {
		jugadores: d.jugadores,
		manoInicial: d.manoInicial,
		roboPorTurno: d.roboPorTurno,
		jugablesPorTurno: d.jugablesPorTurno,
		limiteMano: d.limiteMano,
		umbralFinal: d.umbralFinal,
		cestas: {
			numero: cestasPorDefecto(datos, d.jugadores),
			prendasPorCesta: d.cestas.prendasPorCesta
		},
		tendedero: d.tendedero,
		objetivos: d.objetivos,
		prendas: Object.fromEntries(datos.tipos.map((t) => [t.id, {
			espacios: t.espacios,
			humedad: t.humedad,
			puntos: t.puntos
		}])),
		incluidas: Object.fromEntries([...datos.cartas, ...datos.objetivos].map((c) => [c.id, true])),
		semilla: ""
	};
}
function enJuego(c, ajustes) {
	const copias = "copias" in c ? c.copias : 1;
	return c.estado === "definida" && copias > 0 && ajustes.incluidas[c.id] !== false;
}
//#endregion
//#region packages/motor/src/estado/ronda.ts
/** Quien abre la ronda: el primer jugador va rotando, una ronda cada uno. */
function jugadorInicial(p, ronda = p.ronda) {
	return (ronda - 1) % p.jugadores.length;
}
/** Orden de juego de la ronda actual, empezando por quien la abre. */
function ordenDeRonda(p) {
	const n = p.jugadores.length;
	return Array.from({ length: n }, (_, i) => (jugadorInicial(p) + i) % n);
}
/** Días que dura una carta del día si no dice otra cosa (parametros.dias). Cada día es una ronda. */
const DIAS_POR_DEFECTO = 1;
/** Días (rondas) que le quedan a la carta del día en juego contando el actual, o null si no hay ninguna. */
function diasRestantes(p) {
	if (!p.dia) return null;
	return numero(defCarta(p, p.dia).parametros, "dias", DIAS_POR_DEFECTO) - (p.ronda - (p.diaDesde ?? p.ronda));
}
/**
* Al empezar cada ronda: si la carta del día ya ha cumplido sus días, se descarta; si no queda ninguna
* en juego, se roba una (así nunca hay dos a la vez). Un suceso se resuelve al empezar cada uno de sus días;
* el tiempo actúa al secar (ver secado.ts).
*/
function inicioDeRonda(p) {
	p.rondaProtegeDe = [];
	const restantes = diasRestantes(p);
	if (p.dia && restantes !== null && restantes <= 0) {
		anotar(p, "seAcabaDia", { carta: defCarta(p, p.dia).id }, `Se acaba ${defCarta(p, p.dia).nombre}.`);
		p.descartes.dia.push(p.dia);
		p.dia = null;
		p.diaDesde = null;
	}
	if (!p.dia) {
		if (p.mazos.dia.length === 0 && p.descartes.dia.length > 0) {
			p.mazos.dia = p.descartes.dia;
			p.descartes.dia = [];
			barajar(p, p.mazos.dia);
			anotar(p, "barajaDia", {}, "Se baraja el descarte del mazo del día para formar un mazo nuevo.");
		}
		const carta = p.mazos.dia.pop();
		if (!carta) return;
		p.dia = carta;
		p.diaDesde = p.ronda;
		const dias = diasRestantes(p);
		anotar(p, "saleDia", {
			ronda: p.ronda,
			carta: defCarta(p, carta).id,
			n: dias
		}, `Ronda ${p.ronda}: sale ${defCarta(p, carta).nombre} (${dias === 1 ? "1 día" : `${dias} días`}).`);
	}
	const def = defCarta(p, p.dia);
	const efecto = def.efecto ? efectos[def.efecto] : void 0;
	if (efecto?.tipo === "evento") efecto.resolver(p, def.parametros);
}
//#endregion
//#region packages/motor/src/estado/reparto.ts
/**
* Lo que sobra en el centro vuelve a la bolsa y solo se rellenan las cestas que se cogieron (las vacías;
* si la bolsa no da para todas, salen incompletas):
* las que nadie tocó se quedan como están para la ronda siguiente.
* Con `renovarTodas` (el sistema anterior), todo lo que sobra vuelve a la bolsa y se llenan todas.
*/
function renovarCestas(p) {
	p.bolsa.push(...p.centro);
	p.centro = [];
	if (p.ajustes.cestas.renovarTodas) {
		p.bolsa.push(...p.cestas.flat());
		p.cestas = p.cestas.map(() => []);
	}
	barajar(p, p.bolsa);
	const { prendasPorCesta } = p.ajustes.cestas;
	p.cestas = p.cestas.map((c) => c.length > 0 ? c : p.bolsa.splice(-prendasPorCesta));
}
/**
* Reparto por fases al empezar la ronda, en el orden de la ronda: primero cada jugador coge un color o un tipo
* de una cesta (el resto va al centro); después cada uno coge un color o un tipo del centro.
* A quien ya no le queda nada que coger se lo salta.
*/
function empezarReparto(p) {
	anotar(p, "reparto", { ronda: p.ronda }, `— Reparto de prendas de la ronda ${p.ronda} —`);
	ponerEnReparto(p, "cesta", 0);
}
/** Tras coger un jugador: el siguiente de su fase, la fase del centro o los turnos de juego. */
function avanzarReparto(p) {
	ponerEnReparto(p, p.turno.fase, ordenDeReparto(p).indexOf(p.turno.jugador) + 1);
}
function puedeCoger(p, fase) {
	return fase === "cesta" ? p.cestas.some((c) => c.length > 0) : p.centro.length > 0;
}
/** Quién coge antes en el reparto: el orden de la ronda o, con `repartoInverso`, al revés (el último en jugar coge primero). */
function ordenDeReparto(p) {
	const orden = ordenDeRonda(p);
	return p.ajustes.repartoInverso ? [...orden].reverse() : orden;
}
function ponerEnReparto(p, fase, indice) {
	const orden = ordenDeReparto(p);
	if (indice < orden.length && puedeCoger(p, fase)) {
		p.turno = {
			...p.turno,
			jugador: orden[indice],
			fase
		};
		return;
	}
	if (fase === "cesta") ponerEnReparto(p, "centro", 0);
	else empezarTurnoDeJuego(p, ordenDeRonda(p)[0]);
}
function empezarTurnoDeJuego(p, jugador) {
	for (const l of p.jugadores[jugador].lineas) for (const t of l.cartas) delete t.protegida;
	p.turno = {
		numero: p.turno.numero + 1,
		jugador,
		fase: "jugar",
		cuerdasJugadas: 0,
		cuerdasExtra: 0,
		accionesJugadas: 0
	};
	anotar(p, "turno", {
		n: p.turno.numero,
		jugador
	}, `— Turno ${p.turno.numero}: ${p.jugadores[jugador].nombre} —`);
}
//#endregion
//#region packages/motor/src/estado/preparar.ts
function crearPartida(datos, ajustesElegidos) {
	const semilla = ajustesElegidos.semilla.trim() || semillaNueva();
	const ajustes = structuredClone({
		...ajustesElegidos,
		semilla
	});
	const p = {
		version: 1,
		ajustes,
		semilla,
		azar: sembrar(semilla),
		catalogo: {
			colores: Object.fromEntries(datos.colores.map((c) => [c.id, c])),
			tipos: Object.fromEntries(datos.tipos.map((t) => [t.id, {
				...t,
				...ajustes.prendas[t.id]
			}])),
			cartas: {},
			objetivos: {}
		},
		prendas: {},
		cartas: {},
		bolsa: [],
		cestas: Array.from({ length: ajustes.cestas.numero }, () => []),
		centro: [],
		perdidas: [],
		dia: null,
		diaDesde: null,
		mazos: {
			cuerdas: [],
			acciones: [],
			dia: []
		},
		descartes: {
			cuerdas: [],
			acciones: [],
			dia: []
		},
		objetivosComunes: [],
		jugadores: [],
		turno: {
			numero: 0,
			jugador: 0,
			fase: "cesta",
			cuerdasJugadas: 0,
			cuerdasExtra: 0,
			accionesJugadas: 0
		},
		ronda: 1,
		rondaProtegeDe: [],
		reaccion: null,
		ultimaRonda: false,
		primeroEnLlegar: null,
		registro: [],
		entradas: [],
		terminada: false,
		final: null
	};
	for (const tipo of datos.tipos) for (const color of datos.colores) for (let i = 1; i <= tipo.porColor; i++) {
		const id = `${tipo.id}-${color.id}-${i}`;
		p.prendas[id] = {
			id,
			tipo: tipo.id,
			color: color.id,
			humedad: p.catalogo.tipos[tipo.id].humedad
		};
		p.bolsa.push(id);
	}
	barajar(p, p.bolsa);
	for (const def of datos.cartas) {
		if (!enJuego(def, ajustes)) continue;
		p.catalogo.cartas[def.id] = def;
		for (let i = 1; i <= def.copias; i++) {
			const id = `${def.id}#${i}`;
			p.cartas[id] = def.id;
			p.mazos[pilaDe(def.mazo)].push(id);
		}
	}
	barajar(p, p.mazos.cuerdas);
	barajar(p, p.mazos.acciones);
	barajar(p, p.mazos.dia);
	const objetivos = datos.objetivos.filter((o) => enJuego(o, ajustes));
	for (const o of objetivos) p.catalogo.objetivos[o.id] = o;
	const secretos = objetivos.map((o) => o.id);
	barajar(p, secretos);
	p.objetivosComunes = secretos.splice(0, ajustes.objetivos.comunes);
	for (let i = 0; i < ajustes.jugadores; i++) {
		p.jugadores.push({
			nombre: `Jugador ${i + 1}`,
			lineas: Array.from({ length: ajustes.tendedero.lineas }, () => ({ cartas: [] })),
			mano: [],
			pendientes: [],
			seca: [],
			secadoEn: {},
			trofeos: [],
			objetivosOfrecidos: secretos.splice(0, ajustes.objetivos.secretosRepartidos),
			objetivoSecreto: null,
			puntos: 0
		});
		robar(p, i, "cuerdas", ajustes.manoInicial.cuerdas);
		robar(p, i, "acciones", ajustes.manoInicial.acciones);
	}
	anotar(p, "partidaCreada", { n: ajustes.jugadores }, `Partida creada con la semilla "${semilla}" para ${ajustes.jugadores} jugadores.`);
	inicioDeRonda(p);
	renovarCestas(p);
	empezarReparto(p);
	return p;
}
//#endregion
//#region packages/motor/src/estado/rotura.ts
/** Rondas que le quedan a una cuerda que se rompe, contando la actual; null si no se rompe. */
function rondasHastaRomperse(p, tendida) {
	const cuerda = efectoCuerda(p, tendida);
	const rondas = cuerda?.efecto.seRompeTras?.(cuerda.params);
	if (rondas === void 0) return null;
	return rondas - (p.ronda - (tendida.colocadaEn ?? p.ronda));
}
/**
* Al acabar la ronda, tras el secado: cada cuerda que ha cumplido sus rondas se rompe, y con ella todas
* las cartas a su derecha en la misma línea. Las cartas van al descarte (o a los trofeos de quien la puso,
* si fue un rival) y sus prendas salen de la partida.
*/
function romperCuerdas(p) {
	for (const jugador of p.jugadores) for (const [l, linea] of jugador.lineas.entries()) {
		const i = linea.cartas.findIndex((t) => {
			const quedan = rondasHastaRomperse(p, t);
			return quedan !== null && quedan <= 1;
		});
		if (i < 0) continue;
		const rotas = linea.cartas.splice(i);
		const prendas = rotas.flatMap((t) => t.colgadas.map((c) => c.prenda));
		p.perdidas.push(...prendas);
		const conElla = rotas.length > 1 ? ` y con ella ${rotas.length - 1} carta(s) a su derecha` : "";
		const perdidas = prendas.length ? `; se pierden ${prendas.map((id) => nombrePrenda(p, id)).join(", ")}` : "";
		anotar(p, "seRompe", {
			carta: defCarta(p, rotas[0].carta).id,
			jugador: p.jugadores.indexOf(jugador),
			linea: l + 1,
			n: rotas.length - 1,
			prendas: prendas.map((id) => refPrenda(p, id))
		}, `Se rompe ${defCarta(p, rotas[0].carta).nombre} de ${jugador.nombre} en la línea ${l + 1}${conElla}${perdidas}.`);
		for (const t of rotas) {
			if (t.colocadaPor === void 0) {
				p.descartes.cuerdas.push(t.carta);
				continue;
			}
			p.jugadores[t.colocadaPor].trofeos.push(t.carta);
			anotar(p, "trofeo", {
				jugador: t.colocadaPor,
				carta: defCarta(p, t.carta).id
			}, `${p.jugadores[t.colocadaPor].nombre} se queda ${defCarta(p, t.carta).nombre} como trofeo.`);
		}
	}
}
//#endregion
//#region packages/motor/src/estado/final.ts
/**
* Si alguien ha llegado al umbral, la partida acaba al terminar la ronda.
* Si llegan varios a la vez (en el secado de la ronda), cuenta como primero el que más puntos tiene.
*/
function comprobarUmbral(p) {
	if (p.ultimaRonda) return;
	const llegan = ordenDeRonda(p).filter((i) => p.jugadores[i].puntos >= p.ajustes.umbralFinal);
	if (llegan.length === 0) return;
	const primero = llegan.reduce((a, b) => p.jugadores[b].puntos > p.jugadores[a].puntos ? b : a);
	p.ultimaRonda = true;
	p.primeroEnLlegar = primero;
	const j = p.jugadores[primero];
	anotar(p, "llegaAlFinal", {
		jugador: primero,
		puntos: j.puntos
	}, `${j.nombre} llega a ${j.puntos} puntos: la partida acaba al terminar esta ronda y después se cuentan los objetivos.`);
}
/** Pasa al siguiente jugador; si ya han jugado todos, se acaba la ronda. */
function pasarTurno(p) {
	const siguiente = (p.turno.jugador + 1) % p.jugadores.length;
	if (siguiente === jugadorInicial(p)) finDeRonda(p);
	else empezarTurnoDeJuego(p, siguiente);
}
/**
* Cuando todos han jugado: se seca y se puntúa a la vez, y empieza la ronda siguiente con otro jugador:
* carta del día, cestas nuevas y reparto de prendas. Si ya no queda ropa que repartir, la partida acaba.
*/
function finDeRonda(p) {
	anotar(p, "finRonda", { ronda: p.ronda }, `— Fin de la ronda ${p.ronda}: secado y puntos de todos —`);
	for (const jugador of ordenDeRonda(p)) faseDeSecado(p, jugador);
	romperCuerdas(p);
	comprobarUmbral(p);
	if (!p.ultimaRonda && p.bolsa.length + p.centro.length + p.cestas.flat().length === 0) {
		p.ultimaRonda = true;
		anotar(p, "sinRopa", {}, "Se ha acabado la ropa (no queda en la bolsa, ni en las cestas, ni en el centro): la partida termina.");
	}
	if (p.ultimaRonda) {
		terminarPartida(p);
		return;
	}
	p.ronda++;
	anotar(p, "empiezaRonda", {
		ronda: p.ronda,
		jugador: jugadorInicial(p)
	}, `Empieza la ronda ${p.ronda}; abre ${p.jugadores[jugadorInicial(p)].nombre}.`);
	inicioDeRonda(p);
	renovarCestas(p);
	anotar(p, "cestasNuevas", {}, "Lo que sobraba en las cestas y el centro vuelve a la bolsa y se llenan cestas nuevas.");
	empezarReparto(p);
}
/** Puntos que da un objetivo: sin límite, `puntos` por cada `cada` de lo que cuenta. */
function puntuarObjetivo(p, jugador, def) {
	const efecto = def.efecto ? efectos[def.efecto] : void 0;
	const cantidad = efecto?.tipo === "objetivo" ? efecto.contar(p, jugador, def.parametros) : 0;
	const puntos = Math.floor(cantidad / def.cada) * def.puntos;
	return {
		objetivo: def.id,
		nombre: def.nombre,
		cantidad,
		puntos
	};
}
function terminarPartida(p) {
	p.terminada = true;
	const resultados = p.jugadores.map((j, i) => {
		const objetivos = [...p.objetivosComunes, ...j.objetivoSecreto ? [j.objetivoSecreto] : []].map((id) => puntuarObjetivo(p, i, p.catalogo.objetivos[id]));
		const total = j.puntos + objetivos.reduce((s, o) => s + o.puntos, 0);
		return {
			jugador: i,
			puntosPartida: j.puntos,
			objetivos,
			total,
			puesto: 0
		};
	});
	resultados.sort((a, b) => b.total - a.total || b.puntosPartida - a.puntosPartida);
	resultados.forEach((r, i) => {
		const anterior = resultados[i - 1];
		r.puesto = anterior && anterior.total === r.total && anterior.puntosPartida === r.puntosPartida ? anterior.puesto : i + 1;
	});
	p.final = resultados;
	anotar(p, "finPartida", {}, "— Fin de la partida: recuento de objetivos —");
	for (const r of resultados) {
		const extra = r.objetivos.map((o) => `${o.nombre} +${o.puntos}`).join(", ");
		anotar(p, "puesto", {
			puesto: r.puesto,
			jugador: r.jugador,
			puntos: r.puntosPartida,
			total: r.total,
			objetivos: r.objetivos.map((o) => `${o.objetivo}:${o.puntos}`)
		}, `${r.puesto}.º ${p.jugadores[r.jugador].nombre}: ${r.puntosPartida} + objetivos = ${r.total}${extra ? ` (${extra})` : ""}.`);
	}
}
//#endregion
//#region packages/motor/src/jugadas/terminarTurno.ts
/** Cuántas de las cartas robadas pueden ser de cuerda; el resto son de acción. */
function maxCuerdasRobadas(p) {
	return Math.min(p.ajustes.roboPorTurno.maxCuerdas, p.ajustes.roboPorTurno.cartas);
}
const terminarTurno = {
	soloEnSuTurno: true,
	validar(p, j) {
		const maximo = maxCuerdasRobadas(p);
		const cuerdas = j.cuerdas ?? Math.min(1, maximo);
		if (!Number.isInteger(cuerdas) || cuerdas < 0) return no("eligeRobo", "Elige cuántas cartas de cuerda robas.");
		if (cuerdas > maximo) return no("maxRobo", `Como mucho puedes robar ${maximo} de cuerda.`, { n: maximo });
		return null;
	},
	aplicar(p, j) {
		const cuerdas = j.cuerdas ?? Math.min(1, maxCuerdasRobadas(p));
		const deCuerda = robar(p, j.jugador, "cuerdas", cuerdas);
		const deAccion = robar(p, j.jugador, "acciones", p.ajustes.roboPorTurno.cartas - cuerdas);
		const jugador = p.jugadores[j.jugador];
		anotar(p, "roba", {
			jugador: j.jugador,
			cuerdas: deCuerda,
			acciones: deAccion
		}, `${jugador.nombre} roba ${deCuerda} de cuerda y ${deAccion} de acción.`);
		if (jugador.mano.length > p.ajustes.limiteMano) {
			p.turno.fase = "descartar";
			anotar(p, "debeDescartar", {
				jugador: j.jugador,
				n: jugador.mano.length,
				limite: p.ajustes.limiteMano
			}, `${jugador.nombre} tiene ${jugador.mano.length} cartas y debe descartar hasta quedarse con ${p.ajustes.limiteMano}.`);
			return;
		}
		pasarTurno(p);
	}
};
const descartar = {
	soloEnSuTurno: true,
	validar(p, j) {
		if (p.turno.fase !== "descartar") return no("noDescartar", "Solo se descarta al pasarte del límite de mano.");
		if (!p.jugadores[j.jugador].mano.includes(j.carta)) return no("noEnMano", "Esa carta no está en tu mano.");
		return null;
	},
	aplicar(p, j) {
		const jugador = p.jugadores[j.jugador];
		jugador.mano = jugador.mano.filter((c) => c !== j.carta);
		const def = defCarta(p, j.carta);
		p.descartes[pilaDe(def.mazo)].push(j.carta);
		anotar(p, "descarta", {
			jugador: j.jugador,
			carta: def.id
		}, `${jugador.nombre} descarta ${def.nombre}.`);
		if (jugador.mano.length <= p.ajustes.limiteMano) pasarTurno(p);
	}
};
//#endregion
//#region packages/motor/src/jugadas/colgarPrenda.ts
const colgarPrenda = {
	soloEnSuTurno: true,
	validar(p, j) {
		if (!p.jugadores[j.jugador].pendientes.includes(j.prenda)) return no("prendaNoPendiente", "Esa prenda no está entre tus prendas por tender.");
		return motivoNoCabe(p, j, j.prenda);
	},
	aplicar(p, j) {
		const jugador = p.jugadores[j.jugador];
		jugador.pendientes = jugador.pendientes.filter((id) => id !== j.prenda);
		jugador.lineas[j.linea].cartas[j.posicion].colgadas.push({
			prenda: j.prenda,
			inicio: j.inicio
		});
		anotar(p, "cuelga", {
			jugador: j.jugador,
			prenda: refPrenda(p, j.prenda),
			linea: j.linea + 1,
			posicion: j.posicion + 1
		}, `${jugador.nombre} cuelga ${nombrePrenda(p, j.prenda)} en la línea ${j.linea + 1}, carta ${j.posicion + 1}.`);
	}
};
//#endregion
//#region packages/motor/src/jugadas/jugarAccion.ts
/** Motivo cuando a una acción de dos pasos solo le falta el destino (la interfaz lo pide en un segundo paso). */
const FALTA_DESTINO = "Elige adónde.";
function efectoAccion(p, carta) {
	const def = defCarta(p, carta);
	const e = def.efecto ? efectos[def.efecto] : void 0;
	return e?.tipo === "accion" ? e : null;
}
function pideDestino(blanco) {
	return BLANCOS_CON_DESTINO.includes(blanco);
}
/** La carta de reacción que tiene en la mano este jugador, si tiene alguna. */
function cartaDeReaccion(p, jugador) {
	return p.jugadores[jugador].mano.find((c) => efectoAccion(p, c)?.blanco === "reaccion");
}
/** Si el fastidio de `atacante` sobre `defensor` tiene que esperar a que este decida si lo anula. */
function esperaReaccion(p, atacante, defensor) {
	return atacante !== defensor && cartaDeReaccion(p, defensor) !== void 0;
}
const SOBRE_PRENDA = [
	"prendaPropia",
	"prendaRival",
	"moverPropia",
	"moverRival",
	"cambiarPrendas"
];
function motivoBlanco(p, j, efecto) {
	const { blanco } = efecto;
	if (blanco === "ninguno") return null;
	if (blanco === "reaccion") return no("esReaccion", "Esta carta se juega cuando un rival te lanza un fastidio.");
	const o = j.objetivo;
	if (!o) return no("sinObjetivo", "Arrastra la carta sobre su objetivo.");
	const rival = blanco.endsWith("Rival");
	if (rival && o.jugador === j.jugador) return no("deRival", "Esta carta se juega sobre el tendedero de un rival.");
	if (!rival && o.jugador !== j.jugador) return no("dePropio", "Esta carta se juega sobre tu propio tendedero.");
	const tendida = p.jugadores[o.jugador]?.lineas[o.linea]?.cartas[o.posicion];
	if (!tendida) return no("sinCuerdaAhi", "Ahí no hay ninguna carta de cuerda.");
	if (SOBRE_PRENDA.includes(blanco) && !tendida.colgadas.some((c) => c.prenda === o.prenda)) return no("sobrePrenda", "Suelta la carta encima de una prenda colgada.");
	if (efecto.etiquetas.includes("fastidio") && tendida.protegida) return no("protegida", "Esa cuerda está protegida hasta el próximo turno de su dueño.");
	for (const etiqueta of efecto.etiquetas) {
		const protege = quienProtege(p, tendida, etiqueta);
		if (protege) return no("protege", `${defCarta(p, protege.carta).nombre} protege de esta carta.`, { carta: defCarta(p, protege.carta).id });
	}
	if (p.rondaProtegeDe.some((e) => efecto.etiquetas.includes(e))) return no("loImpideHoy", `${defCarta(p, p.dia).nombre} lo impide hoy.`, { carta: defCarta(p, p.dia).id });
	if (!pideDestino(blanco)) return null;
	if (!o.destino) return no("faltaDestino", FALTA_DESTINO);
	return motivoDestino(p, o, blanco, tendida);
}
function motivoDestino(p, o, blanco, tendida) {
	const d = o.destino;
	const sitio = {
		jugador: o.jugador,
		...d
	};
	const lineas = p.jugadores[o.jugador].lineas;
	if (blanco === "moverPropia" || blanco === "moverRival") {
		const actual = tendida.colgadas.find((c) => c.prenda === o.prenda);
		if (d.linea === o.linea && d.posicion === o.posicion && d.inicio === actual.inicio) return no("prendaYaAhi", "La prenda ya está ahí.");
		return motivoNoCabe(p, sitio, o.prenda, o.prenda);
	}
	if (blanco === "cambiarPrendas") {
		const otra = prendaEn(p, sitio);
		if (!otra) return no("pulsaOtraPrenda", "Pulsa otra prenda tuya para intercambiarlas.");
		if (otra === o.prenda) return no("prendaDistinta", "Elige una prenda distinta.");
		return motivoIntercambio(p, o.prenda, otra);
	}
	if (blanco === "cambiarCuerdas") {
		const otra = lineas[d.linea]?.cartas[d.posicion];
		if (!otra) return no("pulsaOtraCuerda", "Pulsa otra carta de cuerda tuya.");
		if (otra === tendida) return no("cuerdaDistinta", "Elige una carta de cuerda distinta.");
		if (tendida.colgadas.length === 0 && otra.colgadas.length === 0) return no("cuerdasVacias", "Las dos cuerdas están vacías.");
		if (!caben(p, tendida.colgadas, otra) || !caben(p, otra.colgadas, tendida)) return no("noCabeLoColgado", "Lo colgado no cabe en la otra carta.");
		return null;
	}
	if (blanco === "moverCuerda") {
		const linea = lineas[d.linea];
		if (!linea) return no("sinLinea", "Esa línea no existe.");
		if (d.linea === o.linea && d.posicion === o.posicion) return no("cuerdaYaAhi", "La cuerda ya está ahí.");
		if (d.posicion < linea.cartas.length) return null;
		if (d.posicion > linea.cartas.length) return no("huecoSiguiente", "Las cuerdas van en el hueco siguiente de la línea.");
		if (d.linea === o.linea) return o.posicion === linea.cartas.length - 1 ? no("yaAlFinal", "La cuerda ya está al final de esa línea.") : null;
		if (linea.cartas.length >= p.ajustes.tendedero.cartasPorLinea) return no("lineaCompleta", "Esa línea ya está completa.");
		return null;
	}
	return null;
}
function caben(p, colgadas, en) {
	const huecos = defCarta(p, en.carta).espacios;
	return colgadas.every((c) => c.inicio + tipoDe(p, c.prenda).espacios <= huecos);
}
/** Cada prenda pasa al sitio (carta y espacio de inicio) de la otra. */
function motivoIntercambio(p, a, b) {
	const ua = localizar(p, a);
	const ub = localizar(p, b);
	if (motivoNoCabe(p, {
		jugador: ub.jugador,
		linea: ub.linea,
		posicion: ub.posicion,
		inicio: ub.colgada.inicio
	}, a, [a, b]) ?? motivoNoCabe(p, {
		jugador: ua.jugador,
		linea: ua.linea,
		posicion: ua.posicion,
		inicio: ua.colgada.inicio
	}, b, [a, b])) return no("noCabenAlCambiar", "No caben al intercambiarlas.");
	if (ua.tendida === ub.tendida) {
		const [ia, la] = [ub.colgada.inicio, tipoDe(p, a).espacios];
		const [ib, lb] = [ua.colgada.inicio, tipoDe(p, b).espacios];
		if (ia < ib + lb && ib < ia + la) return no("noCabenAlCambiar", "No caben al intercambiarlas.");
	}
	return null;
}
/** Aplica el efecto de una acción ya pagada (la carta ya salió de la mano). */
function resolverAccion(p, j) {
	efectoAccion(p, j.carta).aplicar(p, j, defCarta(p, j.carta).parametros);
}
const jugarAccion = {
	soloEnSuTurno: true,
	validar(p, j) {
		if (!p.jugadores[j.jugador].mano.includes(j.carta)) return no("noEnMano", "Esa carta no está en tu mano.");
		const def = defCarta(p, j.carta);
		if (def.mazo !== "acciones") return no("noEsAccion", "Esa carta no es de acción.");
		const efecto = efectoAccion(p, j.carta);
		if (!efecto) return no("sinEfecto", "Esta carta no tiene efecto programado.");
		if (efecto.blanco === "reaccion") return motivoBlanco(p, j, efecto);
		const maximo = p.ajustes.jugablesPorTurno.acciones;
		if (p.turno.accionesJugadas >= maximo) return no("yaAcciones", maximo === 1 ? "Ya has jugado una acción este turno." : `Ya has jugado ${maximo} acciones este turno.`, { n: maximo });
		return motivoBlanco(p, j, efecto) ?? efecto.validar?.(p, j, def.parametros) ?? null;
	},
	aplicar(p, j) {
		const jugador = p.jugadores[j.jugador];
		const def = defCarta(p, j.carta);
		jugador.mano = jugador.mano.filter((c) => c !== j.carta);
		p.descartes.acciones.push(j.carta);
		p.turno.accionesJugadas++;
		anotar(p, "juega", {
			jugador: j.jugador,
			carta: def.id
		}, `${jugador.nombre} juega ${def.nombre}.`);
		const defensor = j.objetivo?.jugador;
		if (defensor !== void 0 && efectoAccion(p, j.carta).etiquetas.includes("fastidio") && esperaReaccion(p, j.jugador, defensor)) {
			p.reaccion = {
				jugada: j,
				defensor
			};
			anotar(p, "puedeResponder", { jugador: defensor }, `${p.jugadores[defensor].nombre} puede responder con una carta de reacción.`);
			return;
		}
		resolverAccion(p, j);
	}
};
//#endregion
//#region packages/motor/src/jugadas/colocarCuerda.ts
/**
* Comprobaciones comunes a jugar una carta de cuerda, ya sea colocándola o mejorando otra.
* `gratis`: no cuenta como la cuerda del turno (la cuerda vieja).
*/
function motivoCartaDeCuerda(p, jugador, carta, gratis = false) {
	if (!p.jugadores[jugador].mano.includes(carta)) return no("noEnMano", "Esa carta no está en tu mano.");
	if (defCarta(p, carta).mazo !== "cuerdas") return no("noEsCuerda", "Esa carta no es de cuerda.");
	if (gratis) return null;
	const maximo = p.ajustes.jugablesPorTurno.cuerdas + p.turno.cuerdasExtra;
	if (p.turno.cuerdasJugadas >= maximo) return no("yaCuerdas", maximo === 1 ? "Ya has jugado una cuerda este turno." : `Ya has jugado ${maximo} cuerdas este turno.`, { n: maximo });
	return null;
}
/** Quita la carta de la mano y, salvo que sea gratis, la cuenta como la cuerda del turno. */
function pagarCuerda(p, jugador, carta, gratis = false) {
	p.jugadores[jugador].mano = p.jugadores[jugador].mano.filter((c) => c !== carta);
	if (!gratis) p.turno.cuerdasJugadas++;
}
/** Algunas cuerdas (la vieja) se colocan sin gastar la cuerda del turno. */
function esGratis(p, j) {
	return Boolean(efectoDeCuerda(p, j.carta)?.efecto.noGastaTurno);
}
/** Pone la carta de cuerda en el hueco siguiente de la línea (ya pagada). */
function tenderCuerda(p, j) {
	const en = j.en ?? j.jugador;
	p.jugadores[en].lineas[j.linea].cartas.push({
		carta: j.carta,
		colgadas: [],
		colocadaEn: p.ronda,
		...en !== j.jugador && { colocadaPor: j.jugador }
	});
}
const colocarCuerda = {
	soloEnSuTurno: true,
	validar(p, j) {
		const motivo = motivoCartaDeCuerda(p, j.jugador, j.carta, esGratis(p, j));
		if (motivo) return motivo;
		const en = j.en ?? j.jugador;
		if (!p.jugadores[en]) return no("sinJugador", "Ese jugador no existe.");
		if (en !== j.jugador && !efectoDeCuerda(p, j.carta)?.efecto.paraRival) return no("soloPropia", "Esta cuerda solo se puede colocar en tu propio tendedero.");
		const linea = p.jugadores[en].lineas[j.linea];
		if (!linea) return no("sinLinea", "Esa línea no existe.");
		if (linea.cartas.length >= p.ajustes.tendedero.cartasPorLinea) return no("lineaLlena", `Esta línea ya tiene ${p.ajustes.tendedero.cartasPorLinea} cartas de cuerda.`, { n: p.ajustes.tendedero.cartasPorLinea });
		return null;
	},
	aplicar(p, j) {
		const en = j.en ?? j.jugador;
		pagarCuerda(p, j.jugador, j.carta, esGratis(p, j));
		const donde = en === j.jugador ? "" : ` de ${p.jugadores[en].nombre}`;
		anotar(p, en === j.jugador ? "colocaCuerda" : "colocaCuerdaRival", {
			jugador: j.jugador,
			carta: defCarta(p, j.carta).id,
			linea: j.linea + 1,
			otro: en
		}, `${p.jugadores[j.jugador].nombre} coloca ${defCarta(p, j.carta).nombre} en la línea ${j.linea + 1}${donde}.`);
		if (esperaReaccion(p, j.jugador, en)) {
			p.reaccion = {
				jugada: j,
				defensor: en
			};
			anotar(p, "puedeResponder", { jugador: en }, `${p.jugadores[en].nombre} puede responder con una carta de reacción.`);
			return;
		}
		tenderCuerda(p, j);
	}
};
const mejorarCuerda = {
	soloEnSuTurno: true,
	validar(p, j) {
		const motivo = motivoCartaDeCuerda(p, j.jugador, j.carta);
		if (motivo) return motivo;
		const tendida = p.jugadores[j.jugador].lineas[j.linea]?.cartas[j.posicion];
		if (!tendida) return no("sinCuerdaTuya", "Ahí no hay ninguna carta de cuerda tuya.");
		const debajo = defCarta(p, tendida.carta);
		const encima = defCarta(p, j.carta);
		const seRompe = (carta) => Boolean(efectoDeCuerda(p, carta)?.efecto.seRompeTras);
		if (debajo.efecto !== null && !seRompe(tendida.carta)) return no("soloMejoraBasica", "Solo se mejoran las cuerdas básicas y las viejas.");
		if (encima.id === debajo.id) return no("yaEs", `Ya es una ${debajo.nombre.toLowerCase()}.`, { carta: debajo.id });
		if (seRompe(j.carta)) return no("noMejora", `${encima.nombre} no sirve para mejorar una cuerda.`, { carta: encima.id });
		if (seRompe(tendida.carta) && encima.efecto !== null) return no("arreglarConBasica", `${debajo.nombre} solo se arregla poniéndole encima una cuerda básica.`, { carta: debajo.id });
		if (!tendida.colgadas.every((c) => c.inicio + tipoDe(p, c.prenda).espacios <= encima.espacios)) return no("noCabenColgadas", "Las prendas colgadas no caben en esa carta.");
		return null;
	},
	aplicar(p, j) {
		const tendida = p.jugadores[j.jugador].lineas[j.linea].cartas[j.posicion];
		const antes = defCarta(p, tendida.carta).nombre;
		const idAntes = defCarta(p, tendida.carta).id;
		pagarCuerda(p, j.jugador, j.carta);
		p.descartes.cuerdas.push(tendida.carta);
		tendida.carta = j.carta;
		tendida.colocadaEn = p.ronda;
		delete tendida.colocadaPor;
		anotar(p, "mejora", {
			jugador: j.jugador,
			carta: idAntes,
			otra: defCarta(p, j.carta).id,
			linea: j.linea + 1,
			posicion: j.posicion + 1
		}, `${p.jugadores[j.jugador].nombre} mejora ${antes} a ${defCarta(p, j.carta).nombre} (línea ${j.linea + 1}, carta ${j.posicion + 1}).`);
	}
};
//#endregion
//#region packages/motor/src/jugadas/draft.ts
function cumple(prenda, patron) {
	return "color" in patron ? prenda.color === patron.color : prenda.tipo === patron.tipo;
}
function prendasDe(p, origen) {
	return origen === "centro" ? p.centro : p.cestas[origen.cesta];
}
//#endregion
//#region packages/motor/src/jugadas/index.ts
const manejadores = {
	draft: {
		soloEnSuTurno: true,
		validar(p, j) {
			const fase = p.turno.fase;
			if (fase !== "cesta" && fase !== "centro") return no("soloEnReparto", "Las prendas se cogen en el reparto, al empezar la ronda.");
			if (fase === "cesta" && j.origen === "centro") return no("tocaCesta", "Ahora se coge de una cesta; del centro se coge después.");
			if (fase === "centro" && j.origen !== "centro") return no("tocaCentro", "Ahora toca coger del centro.");
			const prendas = prendasDe(p, j.origen);
			if (!prendas) return no("sinCesta", "Esa cesta no existe.");
			if (!prendas.some((id) => cumple(p.prendas[id], j.patron))) return no("sinPrendasAsi", "Ahí no hay prendas de ese color o tipo.");
			return null;
		},
		aplicar(p, j) {
			const prendas = prendasDe(p, j.origen);
			const cogidas = prendas.filter((id) => cumple(p.prendas[id], j.patron));
			const resto = prendas.filter((id) => !cumple(p.prendas[id], j.patron));
			if (j.origen === "centro") p.centro = resto;
			else {
				p.cestas[j.origen.cesta] = [];
				p.centro.push(...resto);
			}
			p.jugadores[j.jugador].pendientes.push(...cogidas);
			const desde = j.origen === "centro" ? "del centro" : `de la cesta ${j.origen.cesta + 1}`;
			anotar(p, j.origen === "centro" ? "cogeCentro" : "cogeCesta", {
				jugador: j.jugador,
				cesta: j.origen === "centro" ? 0 : j.origen.cesta + 1,
				prendas: cogidas.map((id) => refPrenda(p, id))
			}, `${p.jugadores[j.jugador].nombre} coge ${desde}: ${cogidas.map((id) => nombrePrenda(p, id)).join(", ")}.`);
			avanzarReparto(p);
		}
	},
	colocarCuerda,
	mejorarCuerda,
	colgarPrenda,
	jugarAccion,
	elegirObjetivo: {
		soloEnSuTurno: false,
		validar(p, j) {
			const jugador = p.jugadores[j.jugador];
			if (jugador.objetivoSecreto) return no("yaObjetivo", "Ya has elegido tu objetivo secreto.");
			if (!jugador.objetivosOfrecidos.includes(j.objetivo)) return no("objetivoAjeno", "Ese objetivo no está entre los que te han tocado.");
			return null;
		},
		aplicar(p, j) {
			const jugador = p.jugadores[j.jugador];
			jugador.objetivoSecreto = j.objetivo;
			jugador.objetivosOfrecidos = [];
			anotar(p, "eligeObjetivo", { jugador: j.jugador }, `${jugador.nombre} elige su objetivo secreto.`);
		}
	},
	terminarTurno,
	descartar,
	responder: {
		soloEnSuTurno: false,
		validar(p, j) {
			if (!p.reaccion) return no("nadaQueResponder", "No hay nada a lo que responder.");
			if (p.reaccion.defensor !== j.jugador) return no("respondeOtro", `Le toca responder a ${p.jugadores[p.reaccion.defensor].nombre}.`, { jugador: p.reaccion.defensor });
			if (j.anular && !cartaDeReaccion(p, j.jugador)) return no("sinReaccion", "No tienes ninguna carta de reacción.");
			return null;
		},
		aplicar(p, j) {
			const { jugada, defensor } = p.reaccion;
			p.reaccion = null;
			const jugador = p.jugadores[defensor];
			if (!j.anular) {
				anotar(p, "noResponde", { jugador: defensor }, `${jugador.nombre} no responde.`);
				if (jugada.tipo === "jugarAccion") resolverAccion(p, jugada);
				else tenderCuerda(p, jugada);
				return;
			}
			const carta = cartaDeReaccion(p, defensor);
			jugador.mano = jugador.mano.filter((c) => c !== carta);
			p.descartes.acciones.push(carta);
			if (jugada.tipo === "colocarCuerda") p.descartes.cuerdas.push(jugada.carta);
			anotar(p, "anula", {
				jugador: defensor,
				carta: defCarta(p, carta).id,
				otra: defCarta(p, jugada.carta).id
			}, `${jugador.nombre} juega ${defCarta(p, carta).nombre}: ${defCarta(p, jugada.carta).nombre} no tiene efecto.`);
		}
	}
};
function manejadorDe(j) {
	return manejadores[j.tipo];
}
/** null si la jugada es válida; si no, el motivo: clave y datos para traducirlo, y el texto en castellano. */
function porQueNoVale(p, j) {
	const m = manejadorDe(j);
	if (!m) return no("desconocida", "Jugada desconocida.");
	if (p.terminada) return no("terminada", "La partida ha terminado.");
	const jugador = p.jugadores[j.jugador];
	if (!jugador) return no("sinJugador", "Ese jugador no existe.");
	if (p.reaccion && j.tipo !== "responder") return no("esperandoRespuesta", `Esperando a que ${p.jugadores[p.reaccion.defensor].nombre} decida si responde.`, { jugador: p.reaccion.defensor });
	if (m.soloEnSuTurno && j.jugador !== p.turno.jugador) return no("noEsTuTurno", `No es el turno de ${jugador.nombre}.`, { jugador: j.jugador });
	if (j.tipo !== "elegirObjetivo" && jugador.objetivosOfrecidos.length > 0) return no("primeroObjetivo", "Primero elige tu objetivo secreto.");
	if (p.turno.fase === "descartar" && j.tipo !== "descartar" && j.tipo !== "elegirObjetivo") return no("primeroDescarta", `Primero descarta hasta quedarte con ${p.ajustes.limiteMano} cartas.`, { n: p.ajustes.limiteMano });
	if ((p.turno.fase === "cesta" || p.turno.fase === "centro") && j.tipo !== "draft" && j.tipo !== "elegirObjetivo") return no(p.turno.fase === "cesta" ? "primeroRepartoCesta" : "primeroRepartoCentro", `Primero se reparten las prendas: ${p.jugadores[p.turno.jugador].nombre} coge un color o un tipo ${p.turno.fase === "cesta" ? "de una cesta" : "del centro"}.`, { jugador: p.turno.jugador });
	return m.validar(p, j);
}
/** null si la jugada es válida; si no, el motivo en castellano. */
function motivoInvalida(p, j) {
	return porQueNoVale(p, j)?.texto ?? null;
}
function esValida(p, j) {
	return motivoInvalida(p, j) === null;
}
/** Devuelve una partida nueva con la jugada aplicada; la original no se toca. */
function aplicar(p, j) {
	const detalle = porQueNoVale(p, j);
	if (detalle) return {
		ok: false,
		motivo: detalle.texto,
		detalle
	};
	const nueva = structuredClone(p);
	manejadorDe(j).aplicar(nueva, j);
	if (!nueva.terminada) comprobarUmbral(nueva);
	return {
		ok: true,
		partida: nueva
	};
}
/** Copia profunda de datos planos (objetos, listas y valores sueltos), bastante más rápida que structuredClone. */
function copiar(x) {
	if (Array.isArray(x)) return x.map(copiar);
	if (x !== null && typeof x === "object") {
		const o = {};
		for (const k in x) o[k] = copiar(x[k]);
		return o;
	}
	return x;
}
/**
* Como `aplicar`, para la IA, que prueba cientos de jugadas en cada decisión: devuelve null si no vale, la partida
* nueva comparte con la original lo que no cambia durante la partida (catálogo, ajustes y qué es cada carta) y
* empieza con el registro vacío.
*/
function aplicarParaIA(p, j) {
	if (porQueNoVale(p, j)) return null;
	const { catalogo, ajustes, cartas, registro: _registro, entradas: _entradas, ...resto } = p;
	const nueva = {
		...copiar(resto),
		catalogo,
		ajustes,
		cartas,
		registro: [],
		entradas: []
	};
	manejadorDe(j).aplicar(nueva, j);
	if (!nueva.terminada) comprobarUmbral(nueva);
	return nueva;
}
//#endregion
//#region packages/motor/src/iaDificil.ts
/** Rondas que quedan contando la actual (su secado incluido); en la última ronda, 1. */
function rondasRestantes(p) {
	if (p.ultimaRonda) return 1;
	const lider = Math.max(...p.jugadores.map((j) => j.puntos));
	const falta = p.ajustes.umbralFinal - lider;
	if (falta <= 0) return 1;
	const ritmo = p.ronda > 1 ? Math.max(4, lider / (p.ronda - 1)) : 6;
	let r = Math.max(1, Math.ceil(falta / ritmo));
	const ropa = p.bolsa.length + p.centro.length + p.cestas.flat().length;
	const porRonda = p.ajustes.cestas.numero * p.ajustes.cestas.prendasPorCesta;
	if (porRonda > 0) r = Math.min(r, 1 + Math.ceil(ropa / porRonda));
	return r;
}
/** Probabilidad de que la partida siga viva hasta el secado de la ronda `k` (1 = la actual). */
function sigueViva(k, R, ultima) {
	if (k <= R) return 1;
	if (ultima) return 0;
	return k === R + 1 ? .35 : .08;
}
/** Humedad que pierde una prenda de esta cuerda en el secado de esta ronda (con el tiempo) y en las siguientes. */
function ritmos(p, t) {
	const cuerda = efectoCuerda(p, t);
	const base = cuerda?.efecto.secado?.(cuerda.params) ?? 1;
	const clima = efectoClima(p);
	const ajuste = clima?.efecto.ajusteSecado?.(p, t, clima.params) ?? 0;
	return {
		ahora: Math.max(0, base + ajuste),
		luego: Math.max(1, base)
	};
}
/** En qué secado (1 = el de esta ronda) llega a 0 una prenda con humedad `h`. */
function secadoEn(h, ahora, luego) {
	if (h <= 0) return 1;
	if (h <= ahora) return 1;
	return 1 + Math.ceil((h - ahora) / luego);
}
/** Si el viento de hoy tira esta prenda antes de secar (calcetines en cuerdas no resistentes). */
function laTiraElViento(p, t, prenda) {
	if (!p.dia) return false;
	const def = defCarta(p, p.dia);
	const e = def.efecto ? efectos[def.efecto] : void 0;
	if (e?.tipo !== "clima" || !e.antesDelSecado) return false;
	const cae = typeof def.parametros.cae === "string" ? def.parametros.cae : "calcetin";
	return p.prendas[prenda].tipo === cae && !protegidaDe(p, t, "tira");
}
/** Puntos que dará la prenda al secarse en esta cuerda (con su modificador). */
function puntosAlSecar(p, t, prenda) {
	const base = tipoDe(p, prenda).puntos;
	const cuerda = efectoCuerda(p, t);
	return Math.max(0, cuerda?.efecto.puntosAlSecar?.(p, prenda, cuerda.params, base) ?? base);
}
/** Riesgo por ronda de que un fastidio rival retrase o tire la prenda; menor si la cuerda la protege. */
function riesgo(p, t, prenda) {
	let r = .07;
	if (protegidaDe(p, t, "moja")) r -= .025;
	if (protegidaDe(p, t, "tira")) r -= .02;
	r += .01 * (tipoDe(p, prenda).espacios - 1);
	return Math.max(.01, r);
}
function valorJugador(p, i, R, vistoPor) {
	const j = p.jugadores[i];
	const ultima = p.ultimaRonda;
	const futuro = Math.min(1, Math.max(0, (R - 1) / 2));
	let v = j.puntos;
	const proy = { secas: new Map(j.seca.map((id) => [id, 1])) };
	let libres = 0;
	let huecosCarta = 0;
	for (const l of j.lineas) {
		let rompeEn = Infinity;
		for (const t of l.cartas) {
			huecosCarta++;
			const quedan = rondasHastaRomperse(p, t);
			if (quedan !== null) rompeEn = Math.min(rompeEn, Math.max(1, quedan - 0));
			const seRompe = rompeEn !== Infinity && sigueViva(rompeEn, R, ultima) > .3;
			const { ahora, luego } = ritmos(p, t);
			const ocupados = t.colgadas.reduce((s, c) => s + tipoDe(p, c.prenda).espacios, 0);
			if (!seRompe) libres += defCarta(p, t.carta).espacios - ocupados;
			for (const c of t.colgadas) {
				const tipo = tipoDe(p, c.prenda);
				const h = p.prendas[c.prenda].humedad;
				let k = secadoEn(h, ahora, luego);
				let factor = 1;
				if (laTiraElViento(p, t, c.prenda)) {
					k = 1 + tipo.humedad + 1;
					factor = .8;
				}
				if (seRompe && k > rompeEn - 0) {
					v -= .4 * tipo.puntos;
					continue;
				}
				const prob = sigueViva(k, R, ultima) * Math.pow(1 - riesgo(p, t, c.prenda), k - 1) * factor;
				v += puntosAlSecar(p, t, c.prenda) * prob;
				v += .05 * tipo.puntos;
				proy.secas.set(c.prenda, prob);
			}
			const cuerda = efectoCuerda(p, t);
			if (seRompe) v -= 1.5 + 1.5 * futuro;
			else if (cuerda) {
				if (cuerda.efecto.secado) v += 1 * futuro;
				else if (cuerda.efecto.puntosAlSecar) v += .4 * futuro;
				else if (cuerda.efecto.protegeDe?.length) v += .5 * futuro;
			}
		}
	}
	const { lineas, cartasPorLinea } = p.ajustes.tendedero;
	const huecos = lineas * cartasPorLinea - huecosCarta;
	const cuerdasEnMano = vistoPor === i ? j.mano.filter((x) => defCarta(p, x).mazo === "cuerdas").length : 0;
	const cuerdasUtiles = Math.min(cuerdasEnMano, huecos, Math.max(1, R - 1));
	v += libres * .25 * futuro;
	let cabe = libres;
	let cabeLuego = cuerdasUtiles * 3;
	const pendientes = [...j.pendientes].sort((a, b) => tipoDe(p, b).puntos - tipoDe(p, a).puntos);
	for (const id of pendientes) {
		const t = tipoDe(p, id);
		const h = p.prendas[id].humedad;
		let espera;
		if (t.espacios <= cabe) {
			cabe -= t.espacios;
			espera = p.turno.jugador === i && p.turno.fase === "jugar" ? 0 : 1;
		} else if (t.espacios <= cabeLuego) {
			cabeLuego -= t.espacios;
			espera = 1;
		} else espera = 2;
		const k = espera + h;
		const prob = sigueViva(k, R, ultima) * Math.pow(.93, k - 1) * (espera === 2 ? .4 : .85);
		v += t.puntos * prob;
		proy.secas.set(id, prob);
	}
	const ids = [...p.objetivosComunes, ...i === vistoPor && j.objetivoSecreto ? [j.objetivoSecreto] : []];
	if (ids.length) {
		const seguras = [...proy.secas].filter(([, q]) => q >= .55).map(([id]) => id);
		const probables = [...proy.secas].filter(([, q]) => q >= .3).map(([id]) => id);
		const conSeca = (seca) => ({
			...p,
			jugadores: p.jugadores.map((x, k) => k === i ? {
				...x,
				seca
			} : x)
		});
		const pSeguras = conSeca(seguras);
		const pProbables = conSeca(probables);
		const parcial = ultima ? 0 : .45;
		for (const id of ids) {
			const def = p.catalogo.objetivos[id];
			if (!def) continue;
			const ahora = puntuarObjetivo(p, i, def).puntos;
			const a = continuo(puntuarObjetivo(pSeguras, i, def).cantidad, def.cada, def.puntos, parcial);
			const b = continuo(puntuarObjetivo(pProbables, i, def).cantidad, def.cada, def.puntos, parcial);
			v += ahora + .7 * Math.max(0, a - ahora) + .2 * Math.max(0, b - a);
		}
	}
	if (i !== vistoPor && j.objetivoSecreto) v += 2;
	const reaccion = j.mano.filter((x) => efectoAccion(p, x)?.blanco === "reaccion").length;
	if (vistoPor === i) {
		const acciones = j.mano.filter((x) => defCarta(p, x).mazo === "acciones").length - reaccion;
		v += acciones * (.15 + .35 * futuro) + reaccion * (ultima ? .4 : 1.1) + cuerdasUtiles * .5 * futuro;
	} else v += j.mano.length * (.15 + .3 * futuro);
	v += j.trofeos.length * .3;
	return v;
}
/** Puntos de un objetivo contando una parte de lo que falta para el siguiente escalón. */
function continuo(cantidad, cada, puntos, parcial) {
	const enteros = Math.floor(cantidad / cada);
	return enteros * puntos + (cantidad - enteros * cada) / cada * puntos * parcial;
}
/** Cómo de bien le va al jugador `i` frente a los rivales (sobre todo frente al que va mejor). */
function valoracionDificil(p, i) {
	if (p.terminada && p.final) {
		const mio = p.final.find((r) => r.jugador === i);
		const mejorRival = Math.max(...p.final.filter((r) => r.jugador !== i).map((r) => r.total));
		return (mio.total - mejorRival) * 10 + (mio.puesto === 1 ? 50 : 0);
	}
	const R = rondasRestantes(p);
	const valores = p.jugadores.map((_, k) => k).filter((k) => k !== i).map((k) => valorJugador(p, k, R, i));
	const mejor = Math.max(...valores);
	const media = valores.reduce((a, b) => a + b, 0) / valores.length;
	return valorJugador(p, i, R, i) - (.75 * mejor + .25 * media);
}
/** Probabilidad de que `defensor` tenga una carta de reacción, con lo que se ve desde el asiento `yo`. */
function probReaccion(p, defensor, yo) {
	const esReaccion = (c) => efectoAccion(p, c)?.blanco === "reaccion";
	const total = Object.keys(p.cartas).filter(esReaccion).length;
	const vistas = p.descartes.acciones.filter(esReaccion).length + p.jugadores[yo].mano.filter(esReaccion).length;
	const ocultas = Math.max(0, total - vistas);
	const accionesDe = (k) => p.jugadores[k].mano.filter((c) => defCarta(p, c).mazo === "acciones").length;
	const desconocidas = p.mazos.acciones.length + p.jugadores.reduce((s, _, k) => s + (k === yo ? 0 : accionesDe(k)), 0);
	if (desconocidas <= 0 || ocultas === 0) return 0;
	const f = Math.min(1, ocultas / desconocidas);
	return 1 - Math.pow(1 - f, accionesDe(defensor));
}
/** A quién va un fastidio (jugada sobre un rival que este podría anular), o null. */
function atacado(p, j) {
	if (j.tipo === "jugarAccion" && j.objetivo && j.objetivo.jugador !== j.jugador) return efectoAccion(p, j.carta)?.etiquetas.includes("fastidio") ? j.objetivo.jugador : null;
	if (j.tipo === "colocarCuerda" && j.en !== void 0 && j.en !== j.jugador) return j.en;
	return null;
}
/** Valor esperado de una jugada ya aplicada (q), contando con que un fastidio pueda ser anulado. */
function valorDeJugada(p, q, jugada, i, antes) {
	const defensor = atacado(p, jugada);
	if (defensor === null) return valoracionDificil(q, i);
	const v = valoracionDificil(q.reaccion ? aplicada(q, {
		tipo: "responder",
		jugador: q.reaccion.defensor,
		anular: false
	}) ?? q : q, i);
	const prob = probReaccion(p, defensor, i);
	return (1 - prob) * v + prob * (antes - .25);
}
/** Tiempo máximo para pensar una jugada: si se acaba, se queda con la mejor que haya visto. */
const PRESUPUESTO_MS = 150;
/** Primero lo que casi siempre importa (cuerdas y prendas) y al final las acciones, que son muchas más pruebas. */
const ORDEN = {
	colocarCuerda: 0,
	mejorarCuerda: 0,
	colgarPrenda: 1,
	jugarAccion: 2
};
function mejorJugadaDificil(p, i, azar) {
	const inicio = performance.now();
	const antes = valoracionDificil(p, i);
	let mejor = null;
	const lista = candidatas(p, i, true).sort((a, b) => (ORDEN[a.tipo] ?? 3) - (ORDEN[b.tipo] ?? 3));
	for (const [n, jugada] of lista.entries()) {
		if (n % 16 === 15 && performance.now() - inicio > PRESUPUESTO_MS) break;
		if (!esValida(p, jugada)) continue;
		const q = aplicada(p, jugada);
		if (!q) continue;
		const v = valorDeJugada(p, q, jugada, i, antes) + azar() * .01;
		if (!mejor || v > mejor.v) mejor = {
			jugada,
			partida: q,
			v
		};
	}
	return mejor && mejor.v > antes + .03 ? {
		jugada: mejor.jugada,
		partida: mejor.partida
	} : null;
}
function mejorDraftDificil(p, i, azar) {
	const origenes = p.turno.fase === "centro" ? ["centro"] : p.cestas.map((_, cesta) => ({ cesta }));
	let mejor = null;
	for (const origen of origenes) {
		const prendas = origen === "centro" ? p.centro : p.cestas[origen.cesta];
		const patrones = [...new Set(prendas.map((id) => `c:${p.prendas[id].color}`)), ...new Set(prendas.map((id) => `t:${p.prendas[id].tipo}`))];
		for (const pat of patrones) {
			const jugada = {
				tipo: "draft",
				jugador: i,
				origen,
				patron: pat.startsWith("c:") ? { color: pat.slice(2) } : { tipo: pat.slice(2) }
			};
			const q = aplicada(p, jugada);
			if (!q) continue;
			const v = valoracionDificil(q, i) + azar() * .01;
			if (!mejor || v > mejor.v) mejor = {
				jugada,
				v
			};
		}
	}
	if (!mejor) throw new Error("El bot no encuentra qué coger en el reparto.");
	return mejor.jugada;
}
/** Anula solo si lo que pierde pesa más que gastar la carta (su valor ya cuenta en la valoración). */
function respuestaDificil(p) {
	const defensor = p.reaccion.defensor;
	const anulada = aplicada(p, {
		tipo: "responder",
		jugador: defensor,
		anular: true
	});
	const aceptada = aplicada(p, {
		tipo: "responder",
		jugador: defensor,
		anular: false
	});
	return {
		tipo: "responder",
		jugador: defensor,
		anular: !!anulada && (!aceptada || valoracionDificil(anulada, defensor) > valoracionDificil(aceptada, defensor) + .1)
	};
}
/** Suelta la carta que menos falta le hace (prueba cada descarte y se queda con el que mejor deja la mesa). */
function descarteDificil(p, i) {
	let mejor = null;
	for (const carta of new Set(p.jugadores[i].mano)) {
		const jugada = {
			tipo: "descartar",
			jugador: i,
			carta
		};
		if (!aplicada(p, jugada)) continue;
		const v = valoracionDificil({
			...p,
			jugadores: p.jugadores.map((x, k) => k === i ? {
				...x,
				mano: x.mano.filter((c) => c !== carta)
			} : x)
		}, i);
		if (!mejor || v > mejor.v) mejor = {
			jugada,
			v
		};
	}
	return mejor.jugada;
}
/** Cuerdas a robar: las que le caben; en la última ronda, ninguna (no le dará tiempo a usarlas). */
function cuerdasARobarDificil(p, i) {
	if (p.ultimaRonda) return 0;
	return cuerdasARobarBase(p, i);
}
/** El objetivo secreto que mejor encaja con los comunes y con las cuerdas de su mano. */
function eleccionDificil(p, i, azar) {
	const j = p.jugadores[i];
	const mano = j.mano.map((c) => defCarta(p, c));
	const comunes = p.objetivosComunes.map((id) => p.catalogo.objetivos[id]);
	const puntua = (id) => {
		const o = p.catalogo.objetivos[id];
		let s = 4;
		const tipoO = typeof o.parametros.tipo === "string" ? o.parametros.tipo : void 0;
		const colorO = typeof o.parametros.color === "string" ? o.parametros.color : void 0;
		switch (o.efecto) {
			case "secadas-en":
				s += 1.2 * mano.filter((d) => d.efecto === o.parametros.efecto).length - .5;
				break;
			case "clases-de-cuerda":
				s += .5 * new Set(mano.filter((d) => d.mazo === "cuerdas" && d.efecto).map((d) => d.efecto)).size;
				break;
			case "viejas-colocadas":
				s += 1.5 * mano.filter((d) => d.efecto === "fragil").length - 1;
				break;
			case "lineas-completas":
				s += .3 * mano.filter((d) => d.mazo === "cuerdas").length;
				break;
			case "prendas-secas": s += .5;
		}
		for (const c of comunes) {
			if (!c) continue;
			const tipoC = typeof c.parametros.tipo === "string" ? c.parametros.tipo : void 0;
			if (c.efecto === o.efecto && !colorO && !tipoO) s += .8;
			if (tipoO && tipoC === tipoO) s += 1;
			if (c.efecto === "mismo-color" && colorO || o.efecto === "mismo-color" && c.parametros.color) s += 1;
			if (c.efecto === "parejas" && tipoO === "calcetin" || o.efecto === "parejas" && tipoC === "calcetin") s += 1;
		}
		return s + azar() * .3;
	};
	return {
		tipo: "elegirObjetivo",
		jugador: i,
		objetivo: j.objetivosOfrecidos.map((id) => ({
			id,
			s: puntua(id)
		})).reduce((a, b) => b.s > a.s ? b : a).id
	};
}
//#endregion
//#region packages/motor/src/ia.ts
const DIFICULTADES = [
	"facil",
	"normal",
	"dificil"
];
function contexto(o = {}) {
	const dificultad = o.dificultad && DIFICULTADES.includes(o.dificultad) ? o.dificultad : "normal";
	return {
		azar: o.azar ?? Math.random,
		rivales: o.rivales ?? (dificultad === "facil" ? "media" : "mejor"),
		dificultad
	};
}
/** La jugada aplicada sin registro (los bots prueban muchas y no hace falta copiarlo cada vez). */
function aplicada(p, j) {
	return aplicarParaIA(p, j);
}
/** Huecos libres donde merece la pena colgar: no cuentan los de una cuerda que se va a romper ni los de su derecha. */
function espaciosLibres(p, i) {
	let libres = 0;
	for (const l of p.jugadores[i].lineas) for (const t of l.cartas) {
		if (rondasHastaRomperse(p, t) !== null) break;
		const ocupados = t.colgadas.reduce((s, c) => s + tipoDe(p, c.prenda).espacios, 0);
		libres += defCarta(p, t.carta).espacios - ocupados;
	}
	return libres;
}
/** Lo que vale para un jugador cómo está la mesa ahora: puntos, ropa en camino, objetivos y capacidad. */
function valor(p, i) {
	const j = p.jugadores[i];
	let v = j.puntos;
	for (const l of j.lineas) {
		let rota = false;
		for (const t of l.cartas) {
			if (rondasHastaRomperse(p, t) !== null) rota = true;
			for (const c of t.colgadas) {
				const tipo = tipoDe(p, c.prenda);
				const h = p.prendas[c.prenda].humedad;
				v += rota ? -.3 * tipo.puntos : tipo.puntos * .9 / (1 + .5 * h);
			}
			v += rota ? -3 : .25 * defCarta(p, t.carta).espacios;
			if (efectoDeCuerda(p, t.carta)) v += 1;
		}
	}
	let cabe = espaciosLibres(p, i);
	const pendientes = [...j.pendientes].sort((a, b) => tipoDe(p, b).puntos - tipoDe(p, a).puntos);
	for (const id of pendientes) {
		const t = tipoDe(p, id);
		if (t.espacios <= cabe) {
			v += t.puntos * .35;
			cabe -= t.espacios;
		} else v += t.puntos * .1;
	}
	const ids = [...p.objetivosComunes, ...j.objetivoSecreto ? [j.objetivoSecreto] : []];
	for (const id of ids) v += puntuarObjetivo(p, i, p.catalogo.objetivos[id]).puntos * .8;
	v += j.mano.length * .1;
	v += j.trofeos.length * .5;
	return v;
}
/** Cómo de bien le va al jugador `i` frente a los rivales. */
function valoracion(p, i, opciones = {}) {
	const c = contexto(opciones);
	if (c.dificultad === "dificil") return valoracionDificil(p, i);
	if (p.terminada && p.final) {
		const mio = p.final.find((r) => r.jugador === i);
		const mejorRival = Math.max(...p.final.filter((r) => r.jugador !== i).map((r) => r.total));
		return (mio.total - mejorRival) * 10;
	}
	const valores = p.jugadores.map((_, k) => k).filter((k) => k !== i).map((k) => valor(p, k));
	const rival = c.rivales === "media" ? valores.reduce((a, b) => a + b, 0) / valores.length : Math.max(...valores);
	return valor(p, i) - (c.dificultad === "facil" ? .3 : .8) * rival;
}
function objetivosPosibles(p) {
	const lista = [];
	p.jugadores.forEach((j, jugador) => j.lineas.forEach((l, linea) => l.cartas.forEach((t, posicion) => {
		lista.push({
			jugador,
			linea,
			posicion
		});
		for (const c of t.colgadas) lista.push({
			jugador,
			linea,
			posicion,
			prenda: c.prenda
		});
	})));
	return lista;
}
function destinosPosibles(p, jugador) {
	const lista = [];
	p.jugadores[jugador].lineas.forEach((l, linea) => {
		for (let posicion = 0; posicion <= l.cartas.length; posicion++) {
			const espacios = posicion < l.cartas.length ? defCarta(p, l.cartas[posicion].carta).espacios : 1;
			for (let inicio = 0; inicio < espacios; inicio++) lista.push({
				linea,
				posicion,
				inicio
			});
		}
	});
	return lista;
}
/** `unicas`: las prendas por tender iguales (tipo, color y humedad) se prueban una sola vez. */
function candidatas(p, i, unicas = false) {
	const j = p.jugadores[i];
	const lista = [];
	for (const carta of j.mano) {
		if (defCarta(p, carta).mazo === "cuerdas") {
			p.jugadores.forEach((_, en) => p.jugadores[en].lineas.forEach((l, linea) => {
				lista.push({
					tipo: "colocarCuerda",
					jugador: i,
					carta,
					linea,
					...en !== i && { en }
				});
				l.cartas.forEach((_, posicion) => en === i && lista.push({
					tipo: "mejorarCuerda",
					jugador: i,
					carta,
					linea,
					posicion
				}));
			}));
			continue;
		}
		const efecto = efectoAccion(p, carta);
		if (!efecto || efecto.blanco === "reaccion") continue;
		if (efecto.blanco === "ninguno") {
			lista.push({
				tipo: "jugarAccion",
				jugador: i,
				carta
			});
			continue;
		}
		for (const objetivo of objetivosPosibles(p)) {
			const base = {
				tipo: "jugarAccion",
				jugador: i,
				carta,
				objetivo
			};
			if (!pideDestino(efecto.blanco)) {
				lista.push(base);
				continue;
			}
			if (motivoInvalida(p, base) !== "Elige adónde.") continue;
			for (const destino of destinosPosibles(p, objetivo.jugador)) lista.push({
				tipo: "jugarAccion",
				jugador: i,
				carta,
				objetivo: {
					...objetivo,
					destino
				}
			});
		}
	}
	const vistas = /* @__PURE__ */ new Set();
	for (const prenda of j.pendientes) {
		if (unicas) {
			const { tipo, color, humedad, extra } = p.prendas[prenda];
			const clave = `${tipo}|${color}|${humedad}|${extra ?? 0}`;
			if (vistas.has(clave)) continue;
			vistas.add(clave);
		}
		j.lineas.forEach((l, linea) => l.cartas.forEach((t, posicion) => {
			for (let inicio = 0; inicio < defCarta(p, t.carta).espacios; inicio++) lista.push({
				tipo: "colgarPrenda",
				jugador: i,
				prenda,
				linea,
				posicion,
				inicio
			});
		}));
	}
	return lista;
}
/** La mejor jugada del turno, o null si ninguna mejora lo que hay (entonces toca terminar el turno). */
function mejorJugada(p, i, opciones = {}) {
	const c = contexto(opciones);
	if (c.dificultad === "dificil") return mejorJugadaDificil(p, i, c.azar);
	const facil = c.dificultad === "facil";
	if (facil && c.azar() < .15) return null;
	const ahora = valoracion(p, i, c);
	let mejor = null;
	for (const jugada of candidatas(p, i)) {
		if (facil && esFastidio(p, jugada) && c.azar() < .8) continue;
		if (!esValida(p, jugada)) continue;
		const q = aplicada(p, jugada);
		if (!q) continue;
		const v = valoracion(q.reaccion ? aplicada(q, {
			tipo: "responder",
			jugador: q.reaccion.defensor,
			anular: false
		}) ?? q : q, i, c) + c.azar() * (facil ? 2.5 : .05);
		if (!mejor || v > mejor.v) mejor = {
			jugada,
			partida: q,
			v
		};
	}
	return mejor && mejor.v > ahora + .05 ? {
		jugada: mejor.jugada,
		partida: mejor.partida
	} : null;
}
/** Jugada contra un rival (fastidio o cuerda vieja en su tendedero). */
function esFastidio(p, j) {
	if (j.tipo === "colocarCuerda") return j.en !== void 0 && j.en !== j.jugador;
	if (j.tipo !== "jugarAccion" || !j.objetivo || j.objetivo.jugador === j.jugador) return false;
	return !!efectoAccion(p, j.carta)?.etiquetas.includes("fastidio");
}
/** Qué coger en el reparto de prendas (de una cesta o del centro, según la fase). */
function mejorDraft(p, i, opciones = {}) {
	const c = contexto(opciones);
	if (c.dificultad === "dificil") return mejorDraftDificil(p, i, c.azar);
	const origenes = p.turno.fase === "centro" ? ["centro"] : p.cestas.map((_, cesta) => ({ cesta }));
	let mejor = null;
	for (const origen of origenes) {
		const prendas = origen === "centro" ? p.centro : p.cestas[origen.cesta];
		const patrones = [...new Set(prendas.map((id) => `c:${p.prendas[id].color}`)), ...new Set(prendas.map((id) => `t:${p.prendas[id].tipo}`))];
		for (const pat of patrones) {
			const jugada = {
				tipo: "draft",
				jugador: i,
				origen,
				patron: pat.startsWith("c:") ? { color: pat.slice(2) } : { tipo: pat.slice(2) }
			};
			const q = aplicada(p, jugada);
			if (!q) continue;
			const v = valoracion(q, i, c) + c.azar() * (c.dificultad === "facil" ? 4 : .2);
			if (!mejor || v > mejor.v) mejor = {
				jugada,
				v
			};
		}
	}
	if (!mejor) throw new Error("El bot no encuentra qué coger en el reparto.");
	return mejor.jugada;
}
/** Uno de los objetivos que le ofrecen: al azar (la difícil, el que mejor le encaja). */
function eleccionDeObjetivo(p, i, opciones = {}) {
	const c = contexto(opciones);
	if (c.dificultad === "dificil") return eleccionDificil(p, i, c.azar);
	const ofrecidos = p.jugadores[i].objetivosOfrecidos;
	return {
		tipo: "elegirObjetivo",
		jugador: i,
		objetivo: ofrecidos[Math.floor(c.azar() * ofrecidos.length)]
	};
}
/** Qué carta suelta al pasarse del límite de mano. */
function descarteDeBot(p, i, opciones = {}) {
	const c = contexto(opciones);
	if (c.dificultad === "dificil") return descarteDificil(p, i);
	const j = p.jugadores[i];
	if (c.dificultad === "facil") return {
		tipo: "descartar",
		jugador: i,
		carta: j.mano[Math.floor(c.azar() * j.mano.length)]
	};
	const cuerdas = j.mano.filter((x) => defCarta(p, x).mazo === "cuerdas");
	const otras = j.mano.filter((x) => efectoAccion(p, x)?.blanco !== "reaccion");
	const entre = otras.length ? otras : j.mano;
	return {
		tipo: "descartar",
		jugador: i,
		carta: cuerdas.length > huecosLibres(p, i) ? cuerdas[0] : entre[Math.floor(c.azar() * entre.length)]
	};
}
function huecosLibres(p, i) {
	const { lineas, cartasPorLinea } = p.ajustes.tendedero;
	return lineas * cartasPorLinea - p.jugadores[i].lineas.reduce((t, l) => t + l.cartas.length, 0);
}
/** Cuántas de las cartas que roba al terminar el turno son de cuerda: las que le caben en el tendedero. */
function cuerdasARobar(p, i, opciones = {}) {
	const c = contexto(opciones);
	if (c.dificultad === "dificil") return cuerdasARobarDificil(p, i);
	if (c.dificultad === "facil") return Math.floor(c.azar() * (maxCuerdasRobadas(p) + 1));
	return cuerdasARobarBase(p, i);
}
/** Lo que hace la IA normal: tantas como le caben en el tendedero. */
function cuerdasARobarBase(p, i) {
	const enMano = p.jugadores[i].mano.filter((x) => defCarta(p, x).mazo === "cuerdas").length;
	return Math.max(0, Math.min(maxCuerdasRobadas(p), huecosLibres(p, i) - enMano));
}
/** Si el atacado anula el fastidio: solo cuando le perjudica (lo que pierde pesa más que gastar la carta). */
function respuestaDeBot(p, opciones = {}) {
	const c = contexto(opciones);
	if (c.dificultad === "dificil") return respuestaDificil(p);
	const defensor = p.reaccion.defensor;
	if (c.dificultad === "facil" && c.azar() < .5) return {
		tipo: "responder",
		jugador: defensor,
		anular: false
	};
	const anulada = aplicada(p, {
		tipo: "responder",
		jugador: defensor,
		anular: true
	});
	const aceptada = aplicada(p, {
		tipo: "responder",
		jugador: defensor,
		anular: false
	});
	return {
		tipo: "responder",
		jugador: defensor,
		anular: !!anulada && (!aceptada || valoracion(anulada, defensor, c) > valoracion(aceptada, defensor, c) + .3)
	};
}
/**
* Lo siguiente que haría el jugador `i`, o null si no le toca hacer nada ahora.
* Sirve para llevar asientos automáticos paso a paso (la mesa los anima de uno en uno).
*/
function siguienteJugadaIA(p, i, opciones = {}) {
	if (p.terminada) return null;
	if (p.jugadores[i].objetivosOfrecidos.length > 0) return eleccionDeObjetivo(p, i, opciones);
	if (p.reaccion) return p.reaccion.defensor === i ? respuestaDeBot(p, opciones) : null;
	if (p.jugadores.some((o) => o.objetivosOfrecidos.length > 0)) return null;
	if (p.turno.jugador !== i) return null;
	const fase = p.turno.fase;
	if (fase === "cesta" || fase === "centro") return mejorDraft(p, i, opciones);
	if (fase === "descartar") return descarteDeBot(p, i, opciones);
	return mejorJugada(p, i, opciones)?.jugada ?? {
		tipo: "terminarTurno",
		jugador: i,
		cuerdas: cuerdasARobar(p, i, opciones)
	};
}
const datos = cargarDatos(Object.fromEntries(ARCHIVOS_DATOS.map((n) => [n, JSON.parse(readFileSync(join(process.cwd(), "data", `${n}.json`), "utf8"))])));
let estado = 1;
const azar = () => {
	estado = estado * 1664525 + 1013904223 >>> 0;
	return estado / 2 ** 32;
};
function quienJuega(p) {
	const eligiendo = p.jugadores.findIndex((j) => j.objetivosOfrecidos.length > 0);
	if (eligiendo >= 0) return eligiendo;
	if (p.reaccion) return p.reaccion.defensor;
	return p.turno.jugador;
}
const tiempos = {};
function jugar(d, k) {
	const n = d.niveles.length;
	const niveles = Array.from({ length: n }, (_, s) => d.niveles[(s + k) % n]);
	const base = ajustesIniciales(datos);
	let p = crearPartida(datos, {
		...base,
		jugadores: n,
		cestas: {
			...base.cestas,
			numero: cestasPorDefecto(datos, n)
		},
		semilla: `${d.id}-${k}`
	});
	p.registro = [];
	let pasos = 0;
	while (!p.terminada && pasos++ < 5e3) {
		const i = quienJuega(p);
		const t0 = performance.now();
		const j = siguienteJugadaIA(p, i, {
			azar,
			dificultad: niveles[i]
		});
		const ms = performance.now() - t0;
		const t = tiempos[niveles[i]] ??= {
			n: 0,
			total: 0,
			max: 0
		};
		t.n++;
		t.total += ms;
		t.max = Math.max(t.max, ms);
		if (!j) throw new Error(`Nadie juega (paso ${pasos}).`);
		const r = aplicar(p, j);
		if (!r.ok) throw new Error(`Jugada inválida de ${niveles[i]}: ${r.motivo} ${JSON.stringify(j)}`);
		p = r.partida;
		p.registro = [];
		p.entradas = [];
	}
	const final = p.final ?? [];
	return {
		duelo: d.id,
		k,
		niveles,
		rondas: p.ronda,
		abortada: !p.terminada,
		totales: niveles.map((_, s) => final.find((r) => r.jugador === s)?.total ?? 0),
		puestos: niveles.map((_, s) => final.find((r) => r.jugador === s)?.puesto ?? 0)
	};
}
const [, , archivoTanda, salida = "torneo.jsonl"] = process.argv;
if (!archivoTanda) throw new Error("Uso: node torneo.mjs tanda.json salida.jsonl");
const tanda = JSON.parse(readFileSync(archivoTanda, "utf8"));
for (const d of tanda.duelos) {
	const inicio = Date.now();
	const desde = tanda.desde ?? 0;
	for (let k = desde; k < desde + tanda.partidas; k++) {
		estado = hash(d.id) + k * 7919 >>> 0 || 1;
		appendFileSync(salida, JSON.stringify(jugar(d, k)) + "\n");
	}
	console.log(`${d.id}: ${tanda.partidas} partidas en ${((Date.now() - inicio) / 1e3).toFixed(1)} s`);
}
console.log("ms por jugada:", Object.entries(tiempos).map(([nivel, t]) => `${nivel} media ${(t.total / t.n).toFixed(1)} máx ${t.max.toFixed(0)}`).join(" · "));
function hash(texto) {
	let h = 2166136261;
	for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
	return h >>> 0;
}
//#endregion
export {};
