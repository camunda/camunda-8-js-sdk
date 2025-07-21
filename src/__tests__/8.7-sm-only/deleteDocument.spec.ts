import fs from 'fs'
import path from 'path'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()
jest.setTimeout(30000)

test('It can delete a document', async () => {
	const packageRoot = getProjectRoot()
	const errorFilePath = path.join(packageRoot, 'error.log')
	fs.writeFileSync(
		errorFilePath,
		'Error details will be written here if the test fails.'
	)
	try {
		const response = await c8.uploadDocument({
			file: fs.createReadStream('README.md'),
			metadata: {
				processDefinitionId: 'process-definition-id',
			},
		})
		expect(response.metadata.processDefinitionId).toBe('process-definition-id')
		expect(response.metadata.contentType).toBe('text/markdown')

		const downloadResponse = await c8.downloadDocument({
			documentId: response.documentId,
			contentHash: response.contentHash,
		})
		expect(downloadResponse).toBeTruthy()
		expect(downloadResponse).toBeInstanceOf(Buffer)

		await c8.deleteDocument({
			documentId: response.documentId,
		})
		// expect this to throw 404
		await expect(async () => {
			await c8.downloadDocument({
				documentId: response.documentId,
				contentHash: response.contentHash,
			})
		}).rejects.toThrow(/404/)
	} catch (error) {
		fs.writeFileSync(errorFilePath, JSON.stringify(error, null, 2))
		console.error(
			`Error occurred during test. Details written to ${errorFilePath}`
		)
		throw error
	}
})

function getProjectRoot(): string {
	// Start from current working directory
	let currentDir = process.cwd()

	while (currentDir !== path.parse(currentDir).root) {
		if (fs.existsSync(path.join(currentDir, 'package.json'))) {
			return currentDir
		}
		currentDir = path.dirname(currentDir)
	}

	throw new Error('Project root not found')
}
