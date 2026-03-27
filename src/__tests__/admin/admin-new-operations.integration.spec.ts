import { AdminApiClient } from '../../admin/index'
import { matrix } from '../../test-support/testTags'

vi.setConfig({ testTimeout: 15_000 })

const saasMatrix = matrix({
	include: {
		versions: ['8.8', '8.7'],
		deployments: ['saas'],
		tenancy: ['single-tenant', 'multi-tenant'],
		security: ['secured', 'unsecured'],
	},
})

describe('AdminApiClient - new operations', () => {
	let c: AdminApiClient
	let clusterUuid: string

	beforeAll(async () => {
		c = new AdminApiClient()
		const clusters = await c.getClusters()
		expect(clusters.length).toBeGreaterThan(0)
		clusterUuid = clusters[0].uuid
	})

	describe('Meta', () => {
		test.runIf(saasMatrix)('getIpRanges', async () => {
			const res = await c.getIpRanges()
			expect(res).toBeTruthy()
			expect(res['web-modeler']).toBeDefined()
			expect(Array.isArray(res['web-modeler'])).toBe(true)
		})
	})

	describe('Cluster management', () => {
		test.runIf(saasMatrix)('getCluster returns cluster details', async () => {
			const cluster = await c.getCluster(clusterUuid)
			expect(cluster).toBeTruthy()
			expect(cluster.uuid).toBe(clusterUuid)
			expect(cluster.name).toBeTruthy()
			expect(cluster.status).toBeTruthy()
		})
	})

	describe('Secrets', () => {
		const testSecretName = `__test_secret_${Date.now()}`
		const testSecretValue = 'test-value-initial'
		const updatedSecretValue = 'test-value-updated'

		afterAll(async () => {
			// Cleanup: delete test secret
			await c.deleteSecret(clusterUuid, testSecretName).catch(() => {})
		})

		test.runIf(saasMatrix)('create and update a secret', async () => {
			// Create
			await c.createSecret({
				clusterUuid,
				secretName: testSecretName,
				secretValue: testSecretValue,
			})

			// Verify it exists
			const secrets = await c.getSecrets(clusterUuid)
			expect(secrets[testSecretName]).toBe(testSecretValue)

			// Update
			await c.updateSecret(clusterUuid, testSecretName, updatedSecretValue)

			// Verify update
			const updatedSecrets = await c.getSecrets(clusterUuid)
			expect(updatedSecrets[testSecretName]).toBe(updatedSecretValue)
		})
	})

	describe('IP Allowlist', () => {
		test.runIf(saasMatrix)(
			'updateIpAllowlist can set and clear an allowlist',
			async () => {
				// Set a test allowlist entry
				await c.updateIpAllowlist(clusterUuid, [
					{ description: '__test_entry', ip: '203.0.113.0/24' },
				])

				// Clear the allowlist to restore original state
				await c.updateIpAllowlist(clusterUuid, [])
			}
		)
	})

	describe('Backups', () => {
		test.runIf(saasMatrix)('getBackups returns an array', async () => {
			const backups = await c.getBackups(clusterUuid)
			expect(Array.isArray(backups)).toBe(true)
		})
	})

	describe('Secure Connectivity', () => {
		test.runIf(saasMatrix)(
			'getSecureConnectivityStatus returns status',
			async () => {
				const status = await c.getSecureConnectivityStatus(clusterUuid)
				expect(status).toBeTruthy()
				expect(status.status).toBeDefined()
			}
		)
	})

	describe('Monitoring', () => {
		test.runIf(saasMatrix)(
			'getMonitoringClients returns response',
			async () => {
				const res = await c.getMonitoringClients(clusterUuid)
				expect(res).toBeTruthy()
				expect(res.clients).toBeDefined()
				expect(Array.isArray(res.clients)).toBe(true)
			}
		)
	})

	describe('Activity / Audit', () => {
		test.runIf(saasMatrix)(
			'getActivityEvents returns audit events',
			async () => {
				const events = await c.getActivityEvents()
				expect(Array.isArray(events)).toBe(true)
				if (events.length > 0) {
					expect(events[0].service).toBeDefined()
					expect(events[0].orgId).toBeDefined()
					expect(events[0].timestamp).toBeDefined()
					expect(events[0].auditType).toBeDefined()
				}
			}
		)

		test.runIf(saasMatrix)(
			'getActivityEventsCsv returns a CSV string',
			async () => {
				const csv = await c.getActivityEventsCsv()
				expect(typeof csv).toBe('string')
			}
		)
	})

	describe('Members', () => {
		test.runIf(saasMatrix)(
			'getUsers returns organization members',
			async () => {
				const members = await c.getUsers()
				expect(Array.isArray(members)).toBe(true)
				expect(members.length).toBeGreaterThan(0)
				expect(members[0].email).toBeDefined()
				expect(members[0].roles).toBeDefined()
			}
		)
	})
})
