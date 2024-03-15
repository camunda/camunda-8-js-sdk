import { ModelerApiClient } from '../../modeler/index'

test('It can get info', async () => {
	const modeler = new ModelerApiClient()

	const res = await modeler.getInfo()
	expect(res.version).toBe('v1')
})

test('Can create project', async () => {
	const modeler = new ModelerApiClient()

	let res
	res = await modeler.searchProjects({ filter: { name: '__test__' } })
	if (res.items.length === 0) {
		console.log('Creating project')
		res = await modeler.createProject('__test__')
	}
	expect(res).toBeTruthy()
})
