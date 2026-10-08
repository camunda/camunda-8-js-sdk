import fs from 'fs'

import { ModelerApiClient } from '../../modeler'
import { matrix } from '../../test-support/testTags'

vi.setConfig({ testTimeout: 10_000 })

describe('ModelerApiClient', () => {
	let modeler: ModelerApiClient

	beforeAll(() => {
		modeler = new ModelerApiClient()
	})

	afterAll(async () => {
		// Cleanup any remaining test data. Every assertion has already run by now,
		// so a cleanup problem is logged rather than failing the suite.
		let existingProjects: Awaited<ReturnType<typeof modeler.searchProjects>>
		try {
			existingProjects = await modeler.searchProjects({
				filter: { name: '__test__' },
				// Also sweeps up projects leaked by earlier runs whose cleanup failed.
				size: 50,
			})
		} catch (e) {
			console.warn(
				`Could not look up test projects for cleanup: ${(e as Error).message}`
			)
			return
		}
		for (const project of existingProjects.items) {
			try {
				await deleteProjectAndContents(modeler, project.id)
			} catch (e) {
				console.warn(
					`Could not clean up test project ${project.id}: ${
						(e as Error).message
					}`
				)
			}
		}
	})

	describe('createProject', () => {
		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should create a new project', async () => {
			const projectResponse = await modeler.createProject('__test__')
			expect(projectResponse.name).toBe('__test__')
		})
	})

	describe('getProject', () => {
		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should retrieve an existing project', async () => {
			const projectResponse = await modeler.createProject('__test__')
			const retrievedProject = await modeler.getProject(projectResponse.id)
			expect(retrievedProject.metadata.name).toBe('__test__')
		})

		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should throw an error if the project does not exist', async () => {
			await expect(modeler.getProject('non-existent-id')).rejects.toThrow()
		})
	})

	describe('updateProject', () => {
		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should update an existing project', async () => {
			const projectResponse = await modeler.createProject('__test__')
			const updatedProject = await modeler.renameProject(
				projectResponse.id,
				'__test__ updated'
			)
			expect(updatedProject.name).toBe('__test__ updated')
		})

		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should throw an error if the project does not exist', async () => {
			await expect(
				modeler.renameProject('non-existent-id', 'Updated name')
			).rejects.toThrow()
		})
	})

	describe('deleteProject', () => {
		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should delete an existing project', async () => {
			const projectResponse = await modeler.createProject('__test__')
			await modeler.deleteProject(projectResponse.id)
			await expect(modeler.getProject(projectResponse.id)).rejects.toThrow()
		})

		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should throw an error if the project does not exist', async () => {
			await expect(modeler.deleteProject('non-existent-id')).rejects.toThrow()
		})

		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)(
			'should delete a project that had root-level content, once emptied',
			async () => {
				// Root-level content may be stored in an automatically created
				// process application, which blocks deleteProject until removed.
				const projectResponse = await modeler.createProject('__test__')
				const folder = await modeler.createFolder({
					projectId: projectResponse.id,
					name: 'Test Folder',
				})
				await modeler.createFile({
					folderId: folder.id,
					projectId: projectResponse.id,
					name: 'Test File',
					content: fs.readFileSync(
						'./src/__tests__/testdata/generic-test.bpmn',
						'utf-8'
					),
					fileType: 'bpmn',
				})

				await deleteProjectAndContents(modeler, projectResponse.id)

				await expect(modeler.getProject(projectResponse.id)).rejects.toThrow()
			}
		)
	})

	describe('searchProjects', () => {
		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should return a list of projects matching the filter', async () => {
			await modeler.createProject('__test__')
			const searchResponse = await modeler.searchProjects({
				filter: { name: '__test__' },
			})
			expect(searchResponse.items.length).toBeGreaterThan(0)
			expect(searchResponse.items[0].name).toBe('__test__')
		})

		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)(
			'should return an empty list if no projects match the filter',
			async () => {
				const searchResponse = await modeler.searchProjects({
					filter: { name: 'non-existent-project' },
				})
				expect(searchResponse.items.length).toBe(0)
			}
		)
	})

	describe('createFolder', () => {
		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should create a new folder in an existing project', async () => {
			const projectResponse = await modeler.createProject('__test__')
			const folderResponse = await modeler.createFolder({
				projectId: projectResponse.id,
				name: 'Test Folder',
			})
			expect(folderResponse.name).toBe('Test Folder')
		})

		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should throw an error if the project does not exist', async () => {
			await expect(
				modeler.createFolder({
					projectId: 'non-existent-project-id',
					name: 'Test Folder',
				})
			).rejects.toThrow()
		})
	})

	describe('createFile', () => {
		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should create a new file in an existing folder', async () => {
			const projectResponse = await modeler.createProject('__test__')
			const folderResponse = await modeler.createFolder({
				projectId: projectResponse.id,
				name: 'Test Folder',
			})
			const fileResponse = await modeler.createFile({
				folderId: folderResponse.id,
				projectId: projectResponse.id,
				name: 'Test File',
				content: fs.readFileSync(
					'./src/__tests__/testdata/generic-test.bpmn',
					'utf-8'
				),
				fileType: 'bpmn',
			})
			expect(fileResponse.name).toBe('Test File')
		})

		test.runIf(
			matrix({
				include: {
					versions: ['8.8', '8.7'],
					deployments: ['saas'],
					tenancy: ['single-tenant', 'multi-tenant'],
					security: ['secured'],
				},
			})
		)('should throw an error if the folder does not exist', async () => {
			await expect(
				modeler.createFile({
					folderId: 'non-existent-folder-id',
					name: 'Test File',
					content: fs.readFileSync(
						'./src/__tests__/testdata/generic-test.bpmn',
						'utf-8'
					),
					fileType: 'bpmn',
				})
			).rejects.toThrow()
		})
	})
})

/**
 * Empties and deletes a project. Order matters: files first (a folder or
 * process application can only be deleted once no files remain in its
 * subtree), then folders (a root folder may live inside a process
 * application, which takes it along when deleted), then process
 * applications, then the project.
 *
 * Since Web Modeler started storing v1 root-level files and folders in an
 * automatically created "<project> - General" process application, a project
 * cannot be deleted while it contains any process application, so deleting
 * only files and folders is no longer enough.
 */
async function deleteProjectAndContents(
	modeler: ModelerApiClient,
	projectId: string
) {
	// files/search covers the whole project, including files nested in folders
	// and process applications, which getProject only lists at the root.
	// Bounded so a search index that lags behind deletes cannot loop forever.
	for (let page = 0; page < 20; page++) {
		const files = await modeler.searchFiles({
			filter: { projectId },
			size: 50,
		})
		if (files.items.length === 0) break
		for (const file of files.items) {
			await ignoreNotFound(modeler.deleteFile(file.id))
		}
	}
	// Folders before process applications: v1 lists a folder created at the
	// root as a root folder, but it actually lives inside the catch-all process
	// application, and deleting that application deletes the folder with it.
	const { content } = await modeler.getProject(projectId)
	for (const folder of content.folders) {
		await ignoreNotFound(modeler.deleteFolder(folder.id))
	}
	for (const processApplication of content.processApplications ?? []) {
		await ignoreNotFound(
			modeler.deleteProcessApplication(processApplication.id)
		)
	}
	await modeler.deleteProject(projectId)
}

/** Treat 404 as success: the resource is already gone, which is the goal. */
async function ignoreNotFound(deletion: Promise<unknown>) {
	try {
		await deletion
	} catch (e) {
		if ((e as { statusCode?: number }).statusCode !== 404) throw e
	}
}
