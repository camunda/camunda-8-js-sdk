#!/usr/bin/env node
/**
 * Reports gaps between the upstream Zeebe gateway.proto (src/proto/zeebe.proto)
 * and the SDK's hand-written facade in src/zeebe/.
 *
 * Reports four classes of gap:
 *   1. RPCs defined in the proto but missing from the ZBGrpc interface
 *      (interfaces-1.0.ts) — the runtime auto-promisifier exposes them
 *      regardless, so this is purely a typed-surface gap.
 *   2. RPCs defined in the proto but missing from the public ZeebeGrpcClient
 *      facade (zb/ZeebeGrpcClient.ts).
 *   3. Top-level messages defined in the proto but missing from
 *      interfaces-grpc-1.0.ts.
 *   4. Fields on existing messages defined in the proto but missing from the
 *      corresponding TS interface in interfaces-grpc-1.0.ts.
 *
 * Each missing RPC is classified into one of four shape-classes:
 *   - Class 1 — Pure pass-through (no `string variables`, no operationReference)
 *   - Class 2 — operationReference normalisation only
 *   - Class 3 — variables stringification (with optional operationReference / tenantId)
 *   - Class 4 — bespoke shaping required (nested *Request, file-bytes, multi-oneof)
 *
 * Class 4 RPCs require a human to design the ergonomic facade. Classes 1-3
 * are mechanically derivable from the proto and can be auto-emitted in a
 * later phase.
 *
 * Usage:
 *   node scripts/check-grpc-coverage.mjs            # human-readable report
 *   node scripts/check-grpc-coverage.mjs --json     # machine-readable JSON
 *   node scripts/check-grpc-coverage.mjs --fail-on-gap   # exit non-zero on any gap
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import protobuf from 'protobufjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

const PROTO_PATH = resolve(repoRoot, 'src/proto/zeebe.proto')
const ZBGRPC_PATH = resolve(repoRoot, 'src/zeebe/lib/interfaces-1.0.ts')
const WIRE_TYPES_PATH = resolve(repoRoot, 'src/zeebe/lib/interfaces-grpc-1.0.ts')
const FACADE_PATH = resolve(repoRoot, 'src/zeebe/zb/ZeebeGrpcClient.ts')

const args = new Set(process.argv.slice(2))
const asJson = args.has('--json')
const failOnGap = args.has('--fail-on-gap')

// --- 1. Parse the proto -----------------------------------------------------

const root = protobuf.loadSync(PROTO_PATH)
const gatewayService = root.lookupService('gateway_protocol.Gateway')

/** @typedef {{name: string, requestType: string, responseType: string, requestStream: boolean, responseStream: boolean, deprecated: boolean}} ProtoRpc */
/** @type {ProtoRpc[]} */
const protoRpcs = Object.entries(gatewayService.methods).map(([name, m]) => ({
	name,
	requestType: m.requestType,
	responseType: m.responseType,
	requestStream: !!m.requestStream,
	responseStream: !!m.responseStream,
	deprecated:
		!!m.options &&
		(m.options.deprecated === true || m.options.deprecated === 'true'),
}))

/** @typedef {{name: string, type: string, repeated: boolean, optional: boolean, isMessage: boolean, comment: string}} ProtoField */
/** @typedef {{name: string, fields: ProtoField[]}} ProtoMessage */

/** @returns {ProtoMessage[]} */
function collectMessages() {
	const out = []
	const ns = root.lookup('gateway_protocol')
	if (!ns || !ns.nestedArray) return out
	for (const entry of ns.nestedArray) {
		if (entry instanceof protobuf.Type) {
			out.push(serializeMessage(entry))
		}
	}
	return out
}

/** @param {protobuf.Type} type @returns {ProtoMessage} */
function serializeMessage(type) {
	return {
		name: type.name,
		fields: Object.values(type.fields).map((f) => ({
			name: f.name,
			type: f.type,
			repeated: !!f.repeated,
			optional: !!f.optional,
			isMessage: !!(f.resolvedType && f.resolvedType instanceof protobuf.Type),
			comment: f.comment || '',
		})),
	}
}

const protoMessages = collectMessages()
const protoMessagesByName = new Map(protoMessages.map((m) => [m.name, m]))

// --- 2. Classify each RPC's request shape -----------------------------------

/** @typedef {1|2|3|4} ShapeClass */

/**
 * Class 4 detector — request requires bespoke shaping if any of:
 *   - it embeds another *Request message field (e.g. CreateProcessInstanceWithResultRequest.request)
 *   - it has a `bytes` field (file-content semantics)
 *   - it has more than one `oneof` group, OR contains a oneof at all (current
 *     facade flattens oneofs explicitly)
 *   - it has a repeated message field whose own request shape contains a
 *     `string variables` field (per-element stringification, e.g. ModifyProcessInstance)
 *
 * @param {string} requestTypeName
 * @returns {{class: ShapeClass, reasons: string[]}}
 */
function classifyRequest(requestTypeName) {
	const msg = protoMessagesByName.get(requestTypeName)
	if (!msg) {
		return { class: 4, reasons: [`request type ${requestTypeName} not found`] }
	}
	const reasons = []

	// Class 4 triggers
	for (const f of msg.fields) {
		if (f.type.endsWith('Request') && f.isMessage) {
			reasons.push(`embeds nested *Request message: ${f.name}: ${f.type}`)
		}
		if (f.type === 'bytes') {
			reasons.push(`has bytes field: ${f.name}`)
		}
		if (f.repeated && f.isMessage) {
			const nested = protoMessagesByName.get(f.type)
			if (
				nested &&
				nested.fields.some(
					(nf) => nf.name === 'variables' && nf.type === 'string'
				)
			) {
				reasons.push(
					`repeated message ${f.type} contains nested 'string variables' (per-element stringification)`
				)
			}
		}
	}
	// Look up the type-level resolved object to find oneofs (protobufjs exposes them on the Type).
	// Filter out synthetic oneofs that proto3 generates for `optional` fields — these are
	// named `_fieldname` and are explicit-presence sugar, not bespoke shaping triggers.
	const t = root.lookupType(`gateway_protocol.${requestTypeName}`)
	const realOneofs =
		t && t.oneofs
			? Object.keys(t.oneofs).filter((n) => !n.startsWith('_'))
			: []
	if (realOneofs.length > 0) {
		reasons.push(`has oneof group(s): ${realOneofs.join(', ')}`)
	}

	if (reasons.length > 0) {
		return { class: 4, reasons }
	}

	const hasVariables = msg.fields.some(
		(f) => f.name === 'variables' && f.type === 'string'
	)
	const hasOpRef = msg.fields.some(
		(f) => f.name === 'operationReference' && f.optional
	)

	if (hasVariables) return { class: 3, reasons: ['has string variables'] }
	if (hasOpRef) return { class: 2, reasons: ['has optional operationReference'] }
	return { class: 1, reasons: ['pure pass-through'] }
}

// --- 3. Extract existing TS surfaces (regex-based, intentionally simple) ----

const zbGrpcSrc = readFileSync(ZBGRPC_PATH, 'utf8')
const wireSrc = readFileSync(WIRE_TYPES_PATH, 'utf8')
const facadeSrc = readFileSync(FACADE_PATH, 'utf8')

// ZBGrpc method names: match `xxxSync(`, `xxxStream(`, `xxxStream:`, `xxxSync:`
const zbGrpcMethods = new Set(
	[...zbGrpcSrc.matchAll(/\b([a-z][A-Za-z0-9]+(?:Sync|Stream))\b\s*[:(<]/g)].map(
		(m) => m[1]
	)
)

// Public ZeebeGrpcClient methods. The facade uses `public foo(` and bare `foo(`
// for some methods — be permissive but anchored to lines starting in a method
// position.
const facadeMethods = new Set()
for (const m of facadeSrc.matchAll(
	/^\s*(?:public\s+(?:async\s+)?|async\s+)?([a-z][A-Za-z0-9]+)\s*[<(]/gm
)) {
	facadeMethods.add(m[1])
}

// Top-level wire-type declarations: interface, class, enum, or type alias.
const wireTypes = new Set(
	[...wireSrc.matchAll(/^export\s+(?:interface|class|enum|type)\s+([A-Z][A-Za-z0-9]+)/gm)].map(
		(m) => m[1]
	)
)

// Field names per wire interface, following `extends` chains so that base-class
// fields are inherited correctly. Best-effort: pull each `export interface X extends Y, Z {`
// block, grep field names, then union with parent fields after a topological pass.
/** @type {Map<string, {fields: Set<string>, extends: string[]}>} */
const rawWire = new Map()
{
	// Capture all interface/class declarations (exported or not) so that
	// extends chains through private base interfaces resolve correctly.
	const interfaceBlock = /(?:^|\n)\s*(?:export\s+)?(?:interface|class)\s+([A-Z][A-Za-z0-9]+)([^{]*)\{([\s\S]*?)\n\}/g
	for (const m of wireSrc.matchAll(interfaceBlock)) {
		const [, name, header, body] = m
		const fields = new Set()
		for (const fm of body.matchAll(/\n\s*(?:readonly\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\??\s*:/g)) {
			fields.add(fm[1])
		}
		const exts = []
		const em = /extends\s+([^{]+)/.exec(header)
		if (em) {
			for (const part of em[1].split(',')) {
				const nm = /([A-Z][A-Za-z0-9]+)/.exec(part.trim())
				if (nm) exts.push(nm[1])
			}
		}
		rawWire.set(name, { fields, extends: exts })
	}
}

/** @type {Map<string, Set<string>>} */
const wireFieldsByType = new Map()
function resolveFields(name, seen = new Set()) {
	if (wireFieldsByType.has(name)) return wireFieldsByType.get(name)
	if (seen.has(name)) return new Set()
	seen.add(name)
	const raw = rawWire.get(name)
	if (!raw) return new Set()
	const out = new Set(raw.fields)
	for (const parent of raw.extends) {
		for (const f of resolveFields(parent, seen)) out.add(f)
	}
	wireFieldsByType.set(name, out)
	return out
}
for (const name of rawWire.keys()) resolveFields(name)

// --- 4. Build the gap report ------------------------------------------------

// Messages we deliberately do not mirror in TS:
//   - empty response messages (no fields) — facade returns void or Record<string, never>
//   - deprecated messages superseded by DeployResource
//   - request messages where the facade accepts inline parameters rather than a typed wire request
const SKIP_MESSAGE_NAMES = new Set([
	'DeployProcessRequest',
	'DeployProcessResponse',
	'ProcessRequestObject',
	// Facade accepts these as inline param objects, not typed wire requests:
	'CancelProcessInstanceRequest',
	'DeleteResourceRequest',
	'ResolveIncidentRequest',
	'UpdateJobRetriesRequest',
	'UpdateJobTimeoutRequest',
])

// Some proto messages are surfaced under a different TS name. Map proto -> TS name.
const MESSAGE_ALIAS = new Map([
	// (none currently — left as a hook)
])

// RPCs that are surfaced under a different facade method name.
const FACADE_ALIAS = new Map([
	['streamActivatedJobs', 'streamJobs'],
])

function effectiveTsName(protoName) {
	return MESSAGE_ALIAS.get(protoName) || protoName
}

/** Maps proto RPC name -> facade method name (lowercase first char). */
function facadeNameFor(rpcName) {
	return rpcName[0].toLowerCase() + rpcName.slice(1)
}

const report = {
	source: JSON.parse(
		readFileSync(resolve(repoRoot, 'src/proto/.zeebe-proto-source.json'), 'utf8')
	),
	rpcs: protoRpcs.map((r) => {
		const defaultName = facadeNameFor(r.name)
		const facadeName = FACADE_ALIAS.get(defaultName) || defaultName
		const cls = classifyRequest(r.requestType)
		const expectedZbGrpcSuffix =
			r.requestStream || r.responseStream ? 'Stream' : 'Sync'
		const expectedZbGrpcMethod = `${defaultName}${expectedZbGrpcSuffix}`
		return {
			name: r.name,
			requestType: r.requestType,
			responseType: r.responseType,
			deprecated: r.deprecated,
			streaming: r.requestStream || r.responseStream,
			class: cls.class,
			classReasons: cls.reasons,
			zbGrpcMethod: expectedZbGrpcMethod,
			zbGrpcPresent: zbGrpcMethods.has(expectedZbGrpcMethod),
			facadeMethod: facadeName,
			facadePresent: facadeMethods.has(facadeName),
		}
	}),
	missingMessages: [],
	missingFields: [],
}

for (const m of protoMessages) {
	if (SKIP_MESSAGE_NAMES.has(m.name)) continue
	if (m.fields.length === 0) continue // empty responses don't need TS mirrors
	const tsName = effectiveTsName(m.name)
	if (!wireTypes.has(tsName)) {
		report.missingMessages.push({ name: m.name, fieldCount: m.fields.length })
	} else {
		const tsFields = wireFieldsByType.get(tsName) || new Set()
		// type-aliases (e.g. discriminated unions) won't have parsed fields — skip field check.
		if (tsFields.size === 0) continue
		const missing = m.fields
			.map((f) => f.name)
			.filter((n) => !tsFields.has(n))
		if (missing.length > 0) {
			report.missingFields.push({ message: m.name, missing })
		}
	}
}

// --- 5. Emit the report -----------------------------------------------------

if (asJson) {
	console.log(JSON.stringify(report, null, 2))
} else {
	const src = report.source
	console.log(
		`Zeebe gRPC coverage report (proto: ${src.repo}@${src.ref} ${src.sha.slice(0, 12)})`
	)
	console.log('')

	const missingZbGrpc = report.rpcs.filter((r) => !r.zbGrpcPresent && !r.deprecated)
	const missingFacade = report.rpcs.filter((r) => !r.facadePresent && !r.deprecated)

	if (missingZbGrpc.length === 0 && missingFacade.length === 0 && report.missingMessages.length === 0 && report.missingFields.length === 0) {
		console.log('OK — no gaps detected.')
	}

	if (missingZbGrpc.length > 0) {
		console.log(`Missing from ZBGrpc interface (${missingZbGrpc.length}):`)
		for (const r of missingZbGrpc) {
			console.log(
				`  - ${r.zbGrpcMethod} [Class ${r.class}] — ${r.classReasons.join('; ')}`
			)
		}
		console.log('')
	}
	if (missingFacade.length > 0) {
		console.log(`Missing from ZeebeGrpcClient facade (${missingFacade.length}):`)
		for (const r of missingFacade) {
			console.log(
				`  - ${r.facadeMethod}() [Class ${r.class}] — ${r.classReasons.join('; ')}`
			)
		}
		console.log('')
	}
	if (report.missingMessages.length > 0) {
		console.log(
			`Missing from interfaces-grpc-1.0.ts (${report.missingMessages.length} messages):`
		)
		for (const m of report.missingMessages) {
			console.log(`  - ${m.name} (${m.fieldCount} fields)`)
		}
		console.log('')
	}
	if (report.missingFields.length > 0) {
		console.log(
			`Existing wire types missing fields (${report.missingFields.length}):`
		)
		for (const f of report.missingFields) {
			console.log(`  - ${f.message}: ${f.missing.join(', ')}`)
		}
		console.log('')
	}

	const class4 = report.rpcs.filter((r) => r.class === 4 && !r.zbGrpcPresent && !r.deprecated)
	if (class4.length > 0) {
		console.log(`WARNING: ${class4.length} new RPCs require bespoke shaping (Class 4):`)
		for (const r of class4) {
			console.log(`  - ${r.name}: ${r.classReasons.join('; ')}`)
		}
		console.log('')
	}
}

if (failOnGap) {
	const gaps =
		report.rpcs.filter((r) => (!r.zbGrpcPresent || !r.facadePresent) && !r.deprecated)
			.length +
		report.missingMessages.length +
		report.missingFields.length
	if (gaps > 0) process.exit(2)
}
