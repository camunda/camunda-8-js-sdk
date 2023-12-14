import {ConsoleApiClient} from '../index'

jest.setTimeout(10000)

test('getParameters', async () => {
    const c = new ConsoleApiClient()
    const res = await c.getParameters()
    expect(res).toBeTruthy()
})

test('getClusters', async () => {
    const c = new ConsoleApiClient()
    const res = await c.getClusters()
    expect(res).toBeTruthy()
})

test('createClient', async () => {
    const c = new ConsoleApiClient()
    const clusters = await c.getClusters()
    const clusterUuid = clusters[0].uuid
    const res = await c.createClient({clusterUuid, clientName: 'testors', permissions: ["Zeebe"]})
    const client = await c.getClient(clusterUuid, res.clientId)
    expect(client.ZEEBE_ADDRESS).toBeTruthy()
    await c.deleteClient(clusterUuid, res.clientId)
    expect(c).toBeTruthy()
})

// xtest('transform client credentials', () => {
//     const credentialsRes = {
//       name: "test",
//       uuid: "b80e3408-db28-46a9-b761-e1d4e4013050",
//       clientId: "RpH9pMLQc5ijcAE1t~JGZ9~I4Wb~aL5O",
//       clientSecret: "OsutXDCPKT2wSLLe7~M.NE9pHBSjtCqDrmcaXBKf1fF5PjwM9Hxp5tHKH4OgC98w",
//       permissions: [
//           "Zeebe",
//           "Operate",
//           "Optimize",
//           "Tasklist"
//       ]
//   }

//       const clusterRes = {
//         uuid: '5c34c0a7-7f29-4424-8414-125615f7a9b9',
//         name: 'My Test Cluster',
//         created: '2023-04-18T21:49:48.688Z',
//         ownerId: '84488983-8a8f-454d-9e1e-ba2c2f3f75d6',
//         planType: {
//           uuid: '37b564b6-3ce8-4f98-a64e-96a64b38d06b',
//           name: 'Trial Cluster'
//         },
//         region: {
//           uuid: 'f5f90399-923c-47d2-beca-75fae2fa6229',
//           name: 'Sydney, Australia (australia-southeast1)'
//         },
//         k8sContext: {
//           uuid: 'f5f90399-923c-47d2-beca-75fae2fa6229',
//           name: 'Sydney, Australia (australia-southeast1)'
//         },
//         generation: { uuid: '9a91e023-a3c0-4949-90c5-809ff06a4dfc', name: 'Zeebe 8.2.2' },
//         channel: { uuid: '6bdf0d1c-3d5a-4df6-8d03-762682964d85', name: 'Stable' },
//         ipwhitelist: null,
//         status: {
//           ready: 'Healthy',
//           zeebeStatus: 'Healthy',
//           operateStatus: 'Healthy',
//           tasklistStatus: 'Healthy',
//           optimizeStatus: 'Healthy'
//         },
//         links: {
//           zeebe: '5c34c0a7-7f29-4424-8414-125615f7a9b9.syd-1.zeebe.camunda.io',
//           operate: 'https://syd-1.operate.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9',
//           tasklist: 'https://syd-1.tasklist.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9',
//           optimize: 'https://syd-1.optimize.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9',
//           connectors: 'https://syd-1.connectors.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9',
//           console: 'https://console.cloud.camunda.io/org/84488983-8a8f-454d-9e1e-ba2c2f3f75d6/cluster/5c34c0a7-7f29-4424-8414-125615f7a9b9'
//         }
//       }

//     const expectedOutput = `export ZEEBE_ADDRESS='7cad87f9-e217-4552-ab37-34b54012036a.syd-1.zeebe.camunda.io:443'
// export ZEEBE_CLIENT_ID='RpH9pMLQc5ijcAE1t~JGZ9~I4Wb~aL5O'
// export ZEEBE_CLIENT_SECRET='OsutXDCPKT2wSLLe7~M.NE9pHBSjtCqDrmcaXBKf1fF5PjwM9Hxp5tHKH4OgC98w'
// export ZEEBE_AUTHORIZATION_SERVER_URL='https://login.cloud.camunda.io/oauth/token'
// export ZEEBE_TOKEN_AUDIENCE='zeebe.camunda.io'
// export CAMUNDA_CLUSTER_ID='5c34c0a7-7f29-4424-8414-125615f7a9b9'
// export CAMUNDA_CLUSTER_REGION='syd-1'
// export CAMUNDA_CREDENTIALS_SCOPES='Zeebe,Tasklist,Operate,Optimize'
// export CAMUNDA_TASKLIST_BASE_URL='https://syd-1.tasklist.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9'
// export CAMUNDA_OPTIMIZE_BASE_URL='https://syd-1.optimize.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9'
// export CAMUNDA_OPERATE_BASE_URL='https://syd-1.operate.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9'
// export CAMUNDA_OAUTH_URL='https://login.cloud.camunda.io/oauth/token'`

// })