import { OAuthProviderImpl } from '@jwulf/oauth'

import { ProcessDefinition, Query } from '../lib/APIObjects'
import { OperateApiClient } from '../'

/**
 * In order to test:
 * Add clientId, clientSecret, and baseUrl from an API credential set
 */

const oauthProvider = new OAuthProviderImpl({
	audience: 'zeebe.camunda.io',
	authServerUrl: 'https://login.cloud.camunda.io/oauth/token',
	clientId: '...',
	clientSecret: '...',
	userAgentString: 'operate-client-nodejs',
})

const c = new OperateApiClient({
	oauthProvider,
	baseUrl: 'https://syd-1.operate.camunda.io/..clusterId...',
})

jest.setTimeout(15000)

xtest('It can get the Incident', async () => {
	const res = await c.searchIncidents({
		filter: {
			processInstanceKey: 2251799816400111,
		},
	})
	console.log(JSON.stringify(res, null, 2))
	expect(res.total).toBe(1)
})
xtest('It can search process definitions', async () => {
	const query: Query<ProcessDefinition> = {
		filter: {},
		size: 50,
		sort: [
			{
				field: 'bpmnProcessId',
				order: 'ASC',
			},
		],
	}
	const defs = await c.searchProcessDefinitions(query)
	expect(defs.total).toBeGreaterThanOrEqual(0)
})
