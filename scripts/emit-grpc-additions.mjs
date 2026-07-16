#!/usr/bin/env node
/**
 * Emits TypeScript source snippets for additive gRPC surface gaps detected
 * by `scripts/check-grpc-coverage.mjs`. Intended to be run after pulling a
 * new gateway.proto via `npm run fetch:zeebe-proto` to mechanically backfill
 * the additive parts of the facade.
 *
 * What it can emit:
 *   - new top-level wire-type interfaces (interfaces-grpc-1.0.ts)
 *   - new optional fields on existing wire-type interfaces
 *   - new method signatures on the ZBGrpc interface (interfaces-1.0.ts)
 *   - new public facade methods on ZeebeGrpcClient.ts for Class 1-3 RPCs
 *
 * What it refuses to emit (HARD FAIL):
 *   - Class 4 RPCs — these embed nested *Request messages, file-bytes,
 *     real oneofs, or per-element variables and require human-designed
 *     ergonomic facades.
 *
 * Modes:
 *   --print    (default) write proposed changes to stdout
 *   --apply    append new wire-type interfaces, ZBGrpc method signatures,
 *              and facade methods directly into the source files. Existing-
 *              type field additions are still printed, never auto-applied
 *              (they require precise insertion inside an existing block).
 *   --json     emit the proposed changes as a JSON document (for tooling)
 *
 * Exit codes:
 *   0  no additive gaps to emit
 *   1  CLI / IO error
 *   3  one or more Class 4 RPCs need bespoke facades — refusing to emit
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import protobuf from 'protobufjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

const PROTO_PATH = resolve(repoRoot, 'src/proto/zeebe.proto')
const ZBGRPC_PATH = resolve(repoRoot, 'src/zeebe/lib/interfaces-1.0.ts')
const WIRE_TYPES_PATH = resolve(
	repoRoot,
	'src/zeebe/lib/interfaces-grpc-1.0.ts'
)
const FACADE_PATH = resolve(repoRoot, 'src/zeebe/zb/ZeebeGrpcClient.ts')

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const asJson = args.has('--json')

// ---------------------------------------------------------------------------
// 1. Load proto + classify (mirrors scripts/check-grpc-coverage.mjs)
// ---------------------------------------------------------------------------

const root = protobuf.loadSync(PROTO_PATH)
const gatewayService = root.lookupService('gateway_protocol.Gateway')

const protoRpcs = Object.entries(gatewayService.methods).map(([name, m]) => ({
	name,
	requestType: m.requestType,
	responseType: m.responseType,
	requestStream: !!m.requestStream,
	responseStream: !!m.responseStream,
	deprecated:
		!!m.options &&
		(m.options.deprecated === true || m.options.deprecated === 'true'),
	comment: m.comment || '',
}))

function collectMessages() {
	const out = []
	const ns = root.lookup('gateway_protocol')
	if (!ns || !ns.nestedArray) return out
	for (const entry of ns.nestedArray) {
		if (entry instanceof protobuf.Type) out.push(serializeMessage(entry))
	}
	return out
}

function serializeMessage(type) {
	return {
		name: type.name,
		comment: type.comment || '',
		fields: Object.values(type.fields).map((f) => ({
			name: f.name,
			type: f.type,
			repeated: !!f.repeated,
			optional: !!f.optional,
			isMessage: !!(
				f.resolvedType && f.resolvedType instanceof protobuf.Type
			),
			isEnum: !!(
				f.resolvedType && f.resolvedType instanceof protobuf.Enum
			),
			comment: f.comment || '',
		})),
	}
}

const protoMessages = collectMessages()
const protoMessagesByName = new Map(protoMessages.map((m) => [m.name, m]))

function classifyRequest(requestTypeName) {
	const msg = protoMessagesByName.get(requestTypeName)
	if (!msg) return { class: 4, reasons: [`request not found: ${requestTypeName}`] }
	const reasons = []
	for (const f of msg.fields) {
		if (f.type.endsWith('Request') && f.isMessage)
			reasons.push(`embeds nested *Request: ${f.name}: ${f.type}`)
		if (f.type === 'bytes') reasons.push(`bytes field: ${f.name}`)
		if (f.repeated && f.isMessage) {
			const nested = protoMessagesByName.get(f.type)
			if (
				nested &&
				nested.fields.some(
					(nf) => nf.name === 'variables' && nf.type === 'string'
				)
			) {
				reasons.push(
					`repeated ${f.type} contains nested 'string variables'`
				)
			}
		}
	}
	const t = root.lookupType(`gateway_protocol.${requestTypeName}`)
	const realOneofs =
		t && t.oneofs
			? Object.keys(t.oneofs).filter((n) => !n.startsWith('_'))
			: []
	if (realOneofs.length > 0)
		reasons.push(`oneof group(s): ${realOneofs.join(', ')}`)
	if (reasons.length > 0) return { class: 4, reasons }
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

// ---------------------------------------------------------------------------
// 2. Read existing TS surfaces (regex-based, identical to detector)
// ---------------------------------------------------------------------------

const zbGrpcSrc = readFileSync(ZBGRPC_PATH, 'utf8')
const wireSrc = readFileSync(WIRE_TYPES_PATH, 'utf8')
const facadeSrc = readFileSync(FACADE_PATH, 'utf8')

const zbGrpcMethods = new Set(
	[
		...zbGrpcSrc.matchAll(
			/\b([a-z][A-Za-z0-9]+(?:Sync|Stream))\b\s*[:(<]/g
		),
	].map((m) => m[1])
)

const facadeMethods = new Set()
for (const m of facadeSrc.matchAll(
	/^\s*(?:public\s+(?:async\s+)?|async\s+)?([a-z][A-Za-z0-9]+)\s*[<(]/gm
)) {
	facadeMethods.add(m[1])
}

const wireTypes = new Set(
	[
		...wireSrc.matchAll(
			/^export\s+(?:interface|class|enum|type)\s+([A-Z][A-Za-z0-9]+)/gm
		),
	].map((m) => m[1])
)

const rawWire = new Map()
{
	const interfaceBlock =
		/(?:^|\n)\s*(?:export\s+)?(?:interface|class)\s+([A-Z][A-Za-z0-9]+)([^{]*)\{([\s\S]*?)\n\}/g
	for (const m of wireSrc.matchAll(interfaceBlock)) {
		const [, name, header, body] = m
		const fields = new Set()
		for (const fm of body.matchAll(
			/\n\s*(?:readonly\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\??\s*:/g
		)) {
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

const SKIP_MESSAGE_NAMES = new Set([
	'DeployProcessRequest',
	'DeployProcessResponse',
	'ProcessRequestObject',
	'CancelProcessInstanceRequest',
	'DeleteResourceRequest',
	'ResolveIncidentRequest',
	'UpdateJobRetriesRequest',
	'UpdateJobTimeoutRequest',
])

const FACADE_ALIAS = new Map([['streamActivatedJobs', 'streamJobs']])

const facadeNameFor = (rpcName) => rpcName[0].toLowerCase() + rpcName.slice(1)

// ---------------------------------------------------------------------------
// 3. Emit helpers
// ---------------------------------------------------------------------------

/**
 * Map a proto field to its TS type string. int64-family types are mirrored as
 * `string` to match the rest of interfaces-grpc-1.0.ts (gRPC marshals them as
 * strings on the wire).
 */
function tsTypeForField(f) {
	let base
	switch (f.type) {
		case 'string':
			base = 'string'
			break
		case 'bool':
			base = 'boolean'
			break
		case 'int32':
		case 'uint32':
		case 'sint32':
		case 'fixed32':
		case 'sfixed32':
		case 'float':
		case 'double':
			base = 'number'
			break
		case 'int64':
		case 'uint64':
		case 'sint64':
		case 'fixed64':
		case 'sfixed64':
			base = 'string'
			break
		case 'bytes':
			base = 'Uint8Array'
			break
		default:
			// message or enum
			base = f.type
			break
	}
	return f.repeated ? `${base}[]` : base
}

function jsdoc(text, indent = '') {
	if (!text) return ''
	const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
	if (lines.length === 0) return ''
	if (lines.length === 1) return `${indent}/** ${lines[0]} */\n`
	return (
		`${indent}/**\n` +
		lines.map((l) => `${indent} * ${l}`).join('\n') +
		`\n${indent} */\n`
	)
}

function emitWireInterface(msg) {
	let out = jsdoc(msg.comment)
	out += `export interface ${msg.name} {\n`
	for (const f of msg.fields) {
		out += jsdoc(f.comment, '\t')
		const opt = f.optional ? '?' : ''
		out += `\t${f.name}${opt}: ${tsTypeForField(f)}\n`
	}
	out += `}\n`
	return out
}

function emitZbGrpcMethod(rpc) {
	const sync = rpc.requestStream || rpc.responseStream ? 'Stream' : 'Sync'
	const m = `${facadeNameFor(rpc.name)}${sync}`
	return (
		`\t${m}(\n` +
		`\t\treq: ${rpc.requestType}\n` +
		`\t): Promise<${rpc.responseType}>\n`
	)
}

function emitFacadeMethod(rpc, cls) {
	const m = FACADE_ALIAS.get(facadeNameFor(rpc.name)) || facadeNameFor(rpc.name)
	const sync = rpc.requestStream || rpc.responseStream ? 'Stream' : 'Sync'
	const grpcMethod = `${facadeNameFor(rpc.name)}${sync}`
	const reqT = `Grpc.${rpc.requestType}`
	const resT = `Grpc.${rpc.responseType}`
	const docs =
		jsdoc(rpc.comment || `${rpc.name} (auto-generated facade — Class ${cls}).`)

	if (cls === 1) {
		return (
			docs +
			`public ${m}(req: ${reqT}): Promise<${resT}> {\n` +
			`\treturn this.executeOperation('${m}', async () =>\n` +
			`\t\t(await this.grpc).${grpcMethod}(req)\n` +
			`\t)\n` +
			`}\n`
		)
	}
	if (cls === 2) {
		return (
			docs +
			`public ${m}(req: ${reqT}): Promise<${resT}> {\n` +
			`\treturn this.executeOperation('${m}', async () =>\n` +
			`\t\t(await this.grpc).${grpcMethod}({\n` +
			`\t\t\t...req,\n` +
			`\t\t\toperationReference: req.operationReference?.toString(),\n` +
			`\t\t})\n` +
			`\t)\n` +
			`}\n`
		)
	}
	if (cls === 3) {
		return (
			docs +
			`public ${m}(req: ${reqT}): Promise<${resT}> {\n` +
			`\tconst variables = losslessStringify(req.variables) as unknown as ZB.JSONDoc\n` +
			`\treturn this.executeOperation('${m}', async () =>\n` +
			`\t\t(await this.grpc).${grpcMethod}({\n` +
			`\t\t\t...req,\n` +
			`\t\t\tvariables: variables as unknown as string,\n` +
			`\t\t\ttenantId: req.tenantId ?? (this.tenantId as string),\n` +
			`\t\t})\n` +
			`\t)\n` +
			`}\n`
		)
	}
	throw new Error(`emitFacadeMethod called for Class ${cls} — refused`)
}

// ---------------------------------------------------------------------------
// 4. Build the work list
// ---------------------------------------------------------------------------

const work = {
	newWireInterfaces: [], // {name, source}
	newZbGrpcMethods: [], // {rpc, source}
	newFacadeMethods: [], // {rpc, source}
	missingFields: [], // {message, missing: [{name, tsType, optional, comment}]}
	class4Refusals: [], // {rpc, reasons}
}

for (const rpc of protoRpcs) {
	if (rpc.deprecated) continue
	const sync = rpc.requestStream || rpc.responseStream ? 'Stream' : 'Sync'
	const grpcMethod = `${facadeNameFor(rpc.name)}${sync}`
	const fName = FACADE_ALIAS.get(facadeNameFor(rpc.name)) || facadeNameFor(rpc.name)
	const cls = classifyRequest(rpc.requestType)
	const zbMissing = !zbGrpcMethods.has(grpcMethod)
	const fMissing = !facadeMethods.has(fName)
	if (!zbMissing && !fMissing) continue
	if (cls.class === 4) {
		work.class4Refusals.push({ rpc, reasons: cls.reasons })
		continue
	}
	if (zbMissing) {
		work.newZbGrpcMethods.push({ rpc, source: emitZbGrpcMethod(rpc) })
	}
	if (fMissing) {
		work.newFacadeMethods.push({
			rpc,
			source: emitFacadeMethod(rpc, cls.class),
		})
	}
}

for (const m of protoMessages) {
	if (SKIP_MESSAGE_NAMES.has(m.name)) continue
	if (m.fields.length === 0) continue
	if (!wireTypes.has(m.name)) {
		work.newWireInterfaces.push({ name: m.name, source: emitWireInterface(m) })
		continue
	}
	const tsFields = wireFieldsByType.get(m.name) || new Set()
	if (tsFields.size === 0) continue
	const missing = m.fields
		.filter((f) => !tsFields.has(f.name))
		.map((f) => ({
			name: f.name,
			tsType: tsTypeForField(f),
			optional: f.optional,
			comment: f.comment,
		}))
	if (missing.length > 0) {
		work.missingFields.push({ message: m.name, missing })
	}
}

// ---------------------------------------------------------------------------
// 5. Refuse on Class 4
// ---------------------------------------------------------------------------

if (work.class4Refusals.length > 0) {
	console.error(
		`emit-grpc-additions: refusing to emit — ${work.class4Refusals.length} RPC(s) require bespoke (Class 4) facades:\n`
	)
	for (const r of work.class4Refusals) {
		console.error(`  - ${r.rpc.name}: ${r.reasons.join('; ')}`)
	}
	console.error(
		`\nThese must be hand-written by a maintainer. After adding them, re-run this script.`
	)
	process.exit(3)
}

// ---------------------------------------------------------------------------
// 6. Emit
// ---------------------------------------------------------------------------

const totalGaps =
	work.newWireInterfaces.length +
	work.newZbGrpcMethods.length +
	work.newFacadeMethods.length +
	work.missingFields.length

if (totalGaps === 0) {
	if (asJson) {
		console.log(JSON.stringify({ ok: true, gaps: 0 }))
	} else {
		console.log('emit-grpc-additions: no additive gaps to emit.')
	}
	process.exit(0)
}

if (asJson) {
	console.log(JSON.stringify(work, null, 2))
	process.exit(0)
}

const banner = (title) => `\n${'='.repeat(72)}\n${title}\n${'='.repeat(72)}\n`

if (apply) {
	// 6a. Append new wire interfaces.
	if (work.newWireInterfaces.length > 0) {
		let appended = `\n// -- Auto-emitted by scripts/emit-grpc-additions.mjs ------------------------\n`
		for (const w of work.newWireInterfaces) {
			appended += `\n${w.source}`
		}
		writeFileSync(WIRE_TYPES_PATH, wireSrc.replace(/\s*$/, '\n') + appended)
		console.log(
			`Appended ${work.newWireInterfaces.length} new wire-type interface(s) to ${WIRE_TYPES_PATH}`
		)
	}

	// 6b. Append new ZBGrpc method signatures inside the ZBGrpc interface block.
	if (work.newZbGrpcMethods.length > 0) {
		const zbg = readFileSync(ZBGRPC_PATH, 'utf8')
		const m = /(\nexport interface ZBGrpc[^{]*\{[\s\S]*?)\n\}/.exec(zbg)
		if (!m) {
			console.error(
				'emit-grpc-additions: could not locate ZBGrpc interface block — skipping ZBGrpc inserts.'
			)
		} else {
			const insertion = work.newZbGrpcMethods
				.map((w) => w.source)
				.join('')
			const updated = zbg.replace(
				m[0],
				`${m[1]}\n\t// -- Auto-emitted by scripts/emit-grpc-additions.mjs --\n${insertion}}`
			)
			writeFileSync(ZBGRPC_PATH, updated)
			console.log(
				`Inserted ${work.newZbGrpcMethods.length} ZBGrpc method signature(s) into ${ZBGRPC_PATH}`
			)
		}
	}

	// 6c. Append new facade methods just before the final closing brace of the class.
	if (work.newFacadeMethods.length > 0) {
		const f = readFileSync(FACADE_PATH, 'utf8')
		// Find the last `\n}\n` that closes the ZeebeGrpcClient class.
		const idx = f.lastIndexOf('\n}')
		if (idx === -1) {
			console.error(
				'emit-grpc-additions: could not locate ZeebeGrpcClient closing brace — skipping facade inserts.'
			)
		} else {
			const insertion =
				`\n\t// -- Auto-emitted by scripts/emit-grpc-additions.mjs --\n` +
				work.newFacadeMethods
					.map((w) =>
						w.source
							.split('\n')
							.map((l) => (l ? `\t${l}` : l))
							.join('\n')
					)
					.join('\n')
			const updated = f.slice(0, idx) + insertion + f.slice(idx)
			writeFileSync(FACADE_PATH, updated)
			console.log(
				`Inserted ${work.newFacadeMethods.length} facade method(s) into ${FACADE_PATH}`
			)
		}
	}

	if (work.missingFields.length > 0) {
		console.log(banner('FIELDS to splice into existing wire-type interfaces'))
		console.log(
			'(Not auto-applied — these need precise insertion inside an existing interface body.)\n'
		)
		for (const mf of work.missingFields) {
			console.log(`// In interface ${mf.message}:`)
			for (const f of mf.missing) {
				if (f.comment)
					console.log(
						`\t/** ${f.comment.split(/\r?\n/).join(' ').trim()} */`
					)
				console.log(
					`\t${f.name}${f.optional ? '?' : ''}: ${f.tsType}`
				)
			}
			console.log('')
		}
	}

	console.log(
		'\nDone. Run `npx tsc --noEmit` and `node scripts/check-grpc-coverage.mjs` to verify.'
	)
	process.exit(0)
}

// Default --print mode
if (work.newWireInterfaces.length > 0) {
	console.log(banner(`NEW WIRE-TYPE INTERFACES (${WIRE_TYPES_PATH})`))
	for (const w of work.newWireInterfaces) console.log(w.source)
}
if (work.newZbGrpcMethods.length > 0) {
	console.log(banner(`NEW ZBGrpc METHOD SIGNATURES (${ZBGRPC_PATH})`))
	for (const w of work.newZbGrpcMethods) console.log(w.source)
}
if (work.newFacadeMethods.length > 0) {
	console.log(banner(`NEW FACADE METHODS (${FACADE_PATH})`))
	for (const w of work.newFacadeMethods) console.log(w.source)
}
if (work.missingFields.length > 0) {
	console.log(banner('FIELDS to splice into existing wire-type interfaces'))
	for (const mf of work.missingFields) {
		console.log(`// In interface ${mf.message}:`)
		for (const f of mf.missing) {
			if (f.comment)
				console.log(
					`\t/** ${f.comment.split(/\r?\n/).join(' ').trim()} */`
				)
			console.log(`\t${f.name}${f.optional ? '?' : ''}: ${f.tsType}`)
		}
		console.log('')
	}
}

console.log(
	'\n(Re-run with --apply to write new interfaces, ZBGrpc signatures, and facade methods.)'
)
