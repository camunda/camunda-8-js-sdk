import {ModelerApiClient} from '../index'
import 'dotenv/config'

const modeler = new ModelerApiClient()

test("It can get info", async () => {
    const res = await modeler.getInfo()
    expect(res.version).toBe('v1')
})

test("", async () => {
    const res = await modeler.searchProjects({filter: {name: "__test__"}})
    if (res.items.length === 0) {
        console.log("Creating project")
        await modeler.createProject("__test__")
        console.log(JSON.stringify(await modeler.searchProjects({filter: {name: "__test__"}}), null, 2))
    }
    expect(res).toBeTruthy()
})