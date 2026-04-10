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
		// Cleanup any remaining test data
		const existingProjects = await modeler.searchProjects({
			filter: { name: '__test__' },
		})
		for (const project of existingProjects.items) {
			const projectData = await modeler.getProject(project.id)
			for (const file of projectData.content.files) {
				await modeler.deleteFile(file.id)
			}
			for (const folder of projectData.content.folders) {
				await modeler.deleteFolder(folder.id)
			}
			await modeler.deleteProject(project.id)
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
