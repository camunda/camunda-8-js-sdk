import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { OperateApiClient } from '../../operate'

const operate = createClient()

function cancelProcesses8_8(processDefinitionKey: string) {
	const c8 = new CamundaRestClient()

	c8.searchProcessInstances({
		filter: {
			processDefinitionKey,
			state: 'ACTIVE',
		},
		sort: [{ field: 'processInstanceKey', order: 'DESC' }],
	}).then((processes) => {
		return Promise.all(
			processes.items.map((item) => {
				return c8
					.cancelProcessInstance({
						processInstanceKey: item.processInstanceKey,
					})
					.catch((e) => {
						console.log(`Failed to delete process ${item.processInstanceKey}`)
						console.log(e)
					})
			})
		)
	})
}

async function cancelProcesses8_7(processDefinitionKey: string) {
	if (!operate) {
		return
	}
	const processes = await operate
		.searchProcessInstances({
			filter: {
				processDefinitionKey,
				state: 'ACTIVE',
			},
		})
		.catch((e) => {
			console.log(
				`Failed to search for process instances for ${processDefinitionKey}`
			)
			console.log(e)
		})
	if (processes) {
		await Promise.all(
			processes.items.map((item) => {
				return operate.deleteProcessInstance(item.key).catch((e) => {
					console.log(`Failed to delete process ${item.key}`)
					console.log(e)
				})
			})
		)
	}
}

function createClient() {
	if (process.env.CAMUNDA_VERSION === '8.8') {
		return null // We don't support Operate in 8.8
	}
	try {
		return new OperateApiClient()
	} catch (e: unknown) {
		console.log((e as Error).message)
		console.log(`Running without access to Operate`)
		return null
	}
}

export const cancelProcesses =
	process.env.CAMUNDA_VERSION === '8.8'
		? cancelProcesses8_8
		: cancelProcesses8_7
