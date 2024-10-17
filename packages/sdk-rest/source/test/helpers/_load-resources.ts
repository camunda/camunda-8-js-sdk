import fs from 'node:fs'

export function loadResourcesFromFiles(files: string[]) {
	const resources: Array<{content: string; name: string}> = []

	for (const file of files) {
		resources.push({
			content: fs.readFileSync(file, {encoding: 'binary'}),
			name: file,
		})
	}

	return resources
}
