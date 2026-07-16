#!/usr/bin/env node
/**
 * Fetches the upstream Zeebe gateway.proto from camunda/camunda at the ref
 * pinned in .zeebe-proto-version and writes it to src/proto/zeebe.proto.
 *
 * Also writes src/proto/.zeebe-proto-source.json with the resolved commit SHA
 * for reproducibility.
 *
 * Usage:
 *   node scripts/fetch-zeebe-proto.mjs            # fetch at pinned ref
 *   node scripts/fetch-zeebe-proto.mjs --check    # exit non-zero if local copy is stale
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

const REPO = 'camunda/camunda'
const PROTO_PATH = 'zeebe/gateway-protocol/src/main/proto/gateway.proto'
const LOCAL_PROTO = resolve(repoRoot, 'src/proto/zeebe.proto')
const LOCAL_META = resolve(repoRoot, 'src/proto/.zeebe-proto-source.json')
const REF_FILE = resolve(repoRoot, '.zeebe-proto-version')

const checkOnly = process.argv.includes('--check')

const ref = readFileSync(REF_FILE, 'utf8').trim()
if (!ref) {
	console.error(`error: ${REF_FILE} is empty`)
	process.exit(1)
}

/** @param {string} url */
async function ghFetch(url) {
	const headers = { 'User-Agent': 'camunda-8-js-sdk-proto-sync' }
	if (process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
	}
	const res = await fetch(url, { headers })
	if (!res.ok) {
		throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`)
	}
	return res
}

async function resolveCommitSha(ref) {
	// Resolve a branch/tag ref to a concrete commit SHA so that the recorded
	// metadata is reproducible even if the branch moves.
	const res = await ghFetch(
		`https://api.github.com/repos/${REPO}/commits/${encodeURIComponent(ref)}`
	)
	const body = await res.json()
	if (!body.sha) {
		throw new Error(`could not resolve ref ${ref}: no sha in response`)
	}
	return body.sha
}

async function fetchProtoAtSha(sha) {
	const url = `https://raw.githubusercontent.com/${REPO}/${sha}/${PROTO_PATH}`
	const res = await ghFetch(url)
	return res.text()
}

const sha = await resolveCommitSha(ref)
const upstream = await fetchProtoAtSha(sha)

const meta = {
	source: `https://github.com/${REPO}/blob/${sha}/${PROTO_PATH}`,
	repo: REPO,
	path: PROTO_PATH,
	ref,
	sha,
	fetchedAt: new Date().toISOString(),
}

if (checkOnly) {
	let local = ''
	try {
		local = readFileSync(LOCAL_PROTO, 'utf8')
	} catch {
		console.error(`error: ${LOCAL_PROTO} does not exist`)
		process.exit(2)
	}
	if (local !== upstream) {
		console.error(
			`error: ${LOCAL_PROTO} is out of sync with ${REPO}@${ref} (${sha.slice(0, 12)})`
		)
		console.error(`run: node scripts/fetch-zeebe-proto.mjs`)
		process.exit(2)
	}
	console.log(
		`ok: src/proto/zeebe.proto matches ${REPO}@${ref} (${sha.slice(0, 12)})`
	)
	process.exit(0)
}

writeFileSync(LOCAL_PROTO, upstream)
writeFileSync(LOCAL_META, JSON.stringify(meta, null, '\t') + '\n')
console.log(
	`wrote src/proto/zeebe.proto from ${REPO}@${ref} (${sha.slice(0, 12)})`
)
