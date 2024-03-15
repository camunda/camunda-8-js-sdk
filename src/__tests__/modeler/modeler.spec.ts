import { ModelerApiClient } from '../../modeler/index'

process.env.DEBUG = 'camunda:token'
const modeler = new ModelerApiClient()

test('It can get info', async () => {
	const res = await modeler.getInfo()
	expect(res.version).toBe('v1')
})

test('Can create project', async () => {
	let res
	res = await modeler.searchProjects({ filter: { name: '__test__' } })
	if (res.items.length === 0) {
		console.log('Creating project')
		res = await modeler.createProject('__test__')
	}
	expect(res).toBeTruthy()
})
