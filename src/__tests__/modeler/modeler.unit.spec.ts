import type { BeforeRequestHook } from 'got'

import { EnvironmentSetup, EnvironmentStorage } from '../../lib'
import { ModelerApiClient } from '../../modeler/index'

let storage: EnvironmentStorage = {}
beforeAll(() => {
	storage = EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})
afterAll(() => EnvironmentSetup.restoreEnv(storage))

test('Constructor does not throws without base url', () => {
	const thrown = false
	try {
		const m = new ModelerApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
		expect(m).toBeTruthy()
	} catch (e) {
		expect((e as Error).message.includes('Missing')).toBe(true)
	}
	expect(thrown).toBe(false)
})

test('Can get construct a client', () => {
	const client = new ModelerApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	expect(client).toBeTruthy()
})

/**
 * The methods below assert the HTTP method, path, and (where applicable) request body that the
 * client sends, without contacting a live server. We inject a `middleware` (got beforeRequest) hook
 * that captures the outgoing request and then throws to short-circuit the network call. This guards
 * against wrong-verb / wrong-path regressions like the milestone and collaborator bugs.
 */
interface CapturedRequest {
	method?: string
	path?: string
	body?: unknown
}

function makeCapturingClient(captured: CapturedRequest) {
	const middleware: BeforeRequestHook = (options) => {
		captured.method = options.method
		captured.path = options.url.pathname
		captured.body = options.body
		throw new Error('__captured__')
	}
	return new ModelerApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_MODELER_BASE_URL: 'http://localhost:8070/api',
			middleware: [middleware],
		},
	})
}

describe('ModelerApiClient request shape', () => {
	test('createVersion issues POST /api/v1/versions with body', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(
			client.createVersion({ fileId: 'file-1', name: 'v1' })
		).rejects.toThrow()
		expect(captured.method).toBe('POST')
		expect(captured.path).toBe('/api/v1/versions')
		expect(JSON.parse(captured.body as string)).toEqual({
			fileId: 'file-1',
			name: 'v1',
		})
	})

	test('getVersion issues GET /api/v1/versions/{versionId}', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(client.getVersion('version-1')).rejects.toThrow()
		expect(captured.method).toBe('GET')
		expect(captured.path).toBe('/api/v1/versions/version-1')
	})

	test('updateVersion issues PATCH /api/v1/versions/{versionId} with body', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(
			client.updateVersion('version-1', { name: 'renamed' })
		).rejects.toThrow()
		expect(captured.method).toBe('PATCH')
		expect(captured.path).toBe('/api/v1/versions/version-1')
		expect(JSON.parse(captured.body as string)).toEqual({ name: 'renamed' })
	})

	test('deleteVersion issues DELETE /api/v1/versions/{versionId}', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(client.deleteVersion('version-1')).rejects.toThrow()
		expect(captured.method).toBe('DELETE')
		expect(captured.path).toBe('/api/v1/versions/version-1')
	})

	test('restoreVersion issues POST /api/v1/versions/{versionId}/restore with body', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(
			client.restoreVersion('version-1', { version: 3 })
		).rejects.toThrow()
		expect(captured.method).toBe('POST')
		expect(captured.path).toBe('/api/v1/versions/version-1/restore')
		expect(JSON.parse(captured.body as string)).toEqual({ version: 3 })
	})

	test('compareVersions issues GET /api/v1/versions/compare/{a}...{b}', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(client.compareVersions('a', 'b')).rejects.toThrow()
		expect(captured.method).toBe('GET')
		expect(captured.path).toBe('/api/v1/versions/compare/a...b')
	})

	test('searchVersions issues POST /api/v1/versions/search with body', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(
			client.searchVersions({ filter: { fileId: 'file-1' } })
		).rejects.toThrow()
		expect(captured.method).toBe('POST')
		expect(captured.path).toBe('/api/v1/versions/search')
		expect(JSON.parse(captured.body as string)).toEqual({
			filter: { fileId: 'file-1' },
		})
	})

	// Regression guard for the fixed GET -> DELETE bug on the deprecated milestone endpoint.
	test('deleteMilestone issues DELETE /api/v1/milestones/{milestoneId}', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(client.deleteMilestone('milestone-1')).rejects.toThrow()
		expect(captured.method).toBe('DELETE')
		expect(captured.path).toBe('/api/v1/milestones/milestone-1')
	})

	// Regression guard for the fixed malformed collaborator path.
	test('deleteCollaborator issues DELETE /api/v1/projects/{projectId}/collaborators/{email}', async () => {
		const captured: CapturedRequest = {}
		const client = makeCapturingClient(captured)
		await expect(
			client.deleteCollaborator({
				projectId: 'project-1',
				email: 'user@example.com',
			})
		).rejects.toThrow()
		expect(captured.method).toBe('DELETE')
		expect(captured.path).toBe(
			'/api/v1/projects/project-1/collaborators/user@example.com'
		)
	})
})
