import { OptimizeApiClient } from "../lib/OptimizeApiClient"
import fs from 'fs'

let client: OptimizeApiClient

afterEach(() => {
    if (client) {
        client.close()
    }
})

xtest('Can get Dashboards', async () => {
    const id = "8a7103a7-c086-48f8-b5b7-a7f83e864688"
    const client = new OptimizeApiClient()
    const res = await client.exportDashboardDefinitions([id])
    fs.writeFileSync('exported-dashboard.json', JSON.stringify(res, null, 2))
    expect(res).toBeTruthy()
    client.close()
})

test('Can get readiness', async () => {
    client = new OptimizeApiClient()
    const res = await client.getReadiness()
    expect(res).toBe("")
    client.close()
})