import chalk from 'chalk'
import logLine from 'single-line-log'
import winston from 'winston' // Import Winston

import { createLogger } from '../src/c8/lib/C8Logger'
import { CamundaRestClient } from '../src/c8/lib/CamundaRestClient'

/**
 * Creates process instances with 50KB variable payloads, while simultaneously servicing jobs.
 * Calls are made every 3ms for each.
 */

const TARGET = parseInt(process.env.BP_PROFILE_TARGET || '1000', 10)
const START_CONCURRENCY = parseInt(
	process.env.BP_PROFILE_START_CONCURRENCY || '200',
	10
) // max inflight createProcessInstance
const ACTIVATE_BATCH = parseInt(
	process.env.BP_PROFILE_ACTIVATE_BATCH || '1',
	10
) // maxJobsToActivate per poll

interface ScenarioConfig {
	name: string
	env: Record<string, unknown>
}

async function runScenario(procDefKey: string, scenario: ScenarioConfig) {
	const client = new CamundaRestClient({
		config: {
			CAMUNDA_LOG_LEVEL: 'info', // reduce noise; adjust to 'trace' for deep debugging
			...scenario.env,
		},
	})

	let started = 0
	let completed = 0
	const inFlight: Promise<void>[] = []
	let done = false
	const startedKeys: string[] = []
	const t0 = Date.now()
	let lastProgressPrint = 0
	const PROGRESS_INTERVAL_MS = parseInt(
		process.env.BP_PROFILE_PROGRESS_INTERVAL_MS || '250',
		10
	)
	const PROGRESS_ENABLED =
		(process.env.BP_PROFILE_PROGRESS || 'true').toLowerCase() !== 'false'

	function writeProgress(tag?: string) {
		if (!PROGRESS_ENABLED) return
		const elapsed = Date.now() - t0
		const throughput =
			elapsed > 0 ? (completed / (elapsed / 1000)).toFixed(1) : '0.0'
		const backpressure = chalk.blueBright('backpressure=per-call')
		const line =
			`[bp-progress] scenario=${scenario.name} ` +
			chalk.green(` started=${started}/${TARGET}`) +
			chalk.red(` completed=${completed}/${TARGET}`) +
			` ${backpressure}` +
			` thrpt=${throughput}/s` +
			` elapsedMs=${elapsed}` +
			(tag ? ` ${tag}` : '')
		logLine.stdout(line)
	}

	// ~50KB (exact length)
	const LARGE_50KB_PAYLOAD = (() => {
		const size = 50 * 1024
		// Build from a moderate alphabet for readability but still low compression ratio
		const alphabet =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
		let out = ''
		// Simple chunked generation to avoid huge temporary arrays
		while (out.length < size) {
			let chunk = ''
			for (let i = 0; i < 2048 && out.length + chunk.length < size; i++) {
				chunk += alphabet[Math.floor(Math.random() * alphabet.length)]
			}
			out += chunk
		}
		return out
	})()

	const LARGE_VARIABLES = { heavy: LARGE_50KB_PAYLOAD }

	const consumer = new Promise((res) => {
		const worker = client.createJobWorker({
			type: 'test-job',
			maxJobsToActivate: ACTIVATE_BATCH,
			timeout: 30000,
			pollIntervalMs: 1,
			worker: 'bp-profile-worker',
			logger: createLogger({
				level: 'warn',
				format: winston.format.combine(
					winston.format.timestamp(),
					winston.format.colorize(),
					winston.format.simple()
				),
				transports: [new winston.transports.Console()],
			}),
			jobHandler: async (job) => {
				const now = Date.now()
				if (now - lastProgressPrint >= PROGRESS_INTERVAL_MS) {
					writeProgress()
					lastProgressPrint = now
				}
				// Complete immediately
				completed++
				if (done) {
					worker.stop()
					res(null)
				}
				return job.complete()
			},
		})
	})

	// Producer loop: launches up to START_CONCURRENCY inflight createProcessInstance ops.
	const producer = (async () => {
		while (!done) {
			// Fill available slots
			while (!done && started < TARGET && inFlight.length < START_CONCURRENCY) {
				const p = client
					.createProcessInstance({
						processDefinitionKey: procDefKey,
						variables: LARGE_VARIABLES,
					})
					.then((r) => {
						started++
						if (r && r.processInstanceKey)
							startedKeys.push(r.processInstanceKey)
					})
					.catch(() => {
						// Swallow & continue (transient or backpressure classification)
					})
					.finally(() => {
						const idx = inFlight.indexOf(p)
						if (idx >= 0) inFlight.splice(idx, 1)
					})
				inFlight.push(p)
			}
			if (completed >= TARGET) break
			const now = Date.now()
			if (now - lastProgressPrint >= PROGRESS_INTERVAL_MS) {
				writeProgress()
				lastProgressPrint = now
			}
			// Small yield to event loop
			await new Promise((r) => setTimeout(r, 5))
		}
	})()

	// Watcher to terminate when done
	const watcher = (async () => {
		while (!done) {
			if (completed >= TARGET) {
				done = true
				break
			}
			await new Promise((r) => setTimeout(r, 25))
		}
	})()

	await Promise.race([
		Promise.all([producer, consumer, watcher]),
		new Promise((_, rej) =>
			setTimeout(() => rej(new Error('scenario timeout')), 480_000)
		),
	])

	done = true // ensure loops exit
	// Wait for any lingering create ops
	await Promise.allSettled(inFlight)

	const durationMs = Date.now() - t0
	writeProgress('FINAL')
	if (logLine.stdout?.clear) logLine.stdout.clear()

	return {
		scenario: scenario.name,
		duration: `${durationMs / 1000}s`,
		started,
		completed,
		permitsMax: null,
		bpSeverity: 'n/a',
	}
}

// Pre-test cleanup (best-effort): cancel residual active instances from previous dev runs.
async function cleanup() {
	const cleaner = new CamundaRestClient()
	console.log(
		'[backpressure-profile] Cleaning up instances from previous runs...'
	)
	try {
		const activeProcesses = await cleaner.searchProcessInstances({
			filter: { state: 'ACTIVE', processDefinitionId: 'Process_0f7cr6y' },
			page: { limit: 2000, from: 0 },
		})
		console.log(
			`[backpressure-profile] Canceling ${activeProcesses.items.length} processes...`
		)
		for (const instance of activeProcesses.items) {
			await cleaner.cancelProcessInstance({
				processInstanceKey: instance.processInstanceKey,
			})
		}
	} catch {
		// swallow error
	}
}

// describe('backpressure profiling', { timeout: 480_000 }, () => {
// it(`profiles scenarios (TARGET=${TARGET})`, {timeout: 480_000}, async () => {
async function main() {
	// Deploy process with a single service task of type 'test-job'
	const bootstrap = new CamundaRestClient()
	const deployment = await bootstrap.deployResourcesFromFiles([
		'./test-job-process.bpmn',
	])
	const { processDefinitionKey } = deployment.processes[0]
	await bootstrap.getProcessDefinition(processDefinitionKey)

	const scenarios: Record<string, ScenarioConfig> = {
		LEGACY: {
			name: 'legacy (per-call)',
			env: { CAMUNDA_SDK_BACKPRESSURE_PROFILE: 'LEGACY' },
		},
		BALANCED: {
			name: 'balanced',
			env: { CAMUNDA_SDK_BACKPRESSURE_PROFILE: 'BALANCED' },
		},
		CONSERVATIVE: {
			name: 'conservative',
			env: { CAMUNDA_SDK_BACKPRESSURE_PROFILE: 'CONSERVATIVE' },
		},
		AGGRESSIVE: {
			name: 'aggressive',
			env: { CAMUNDA_SDK_BACKPRESSURE_PROFILE: 'AGGRESSIVE' },
		},
	}

	const scenarioName = process.env.CAMUNDA_SDK_BACKPRESSURE_PROFILE ?? 'LEGACY'
	const sc = scenarios[scenarioName]
	// eslint-disable-next-line no-console
	console.log(`\n[backpressure-profile] Starting scenario: ${sc.name}`)
	const metrics = await runScenario(processDefinitionKey, sc)
	// eslint-disable-next-line no-console
	console.log('[backpressure-profile] Scenario complete', metrics)
	process.exit(0)
}

cleanup().then(main)
