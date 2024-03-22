import { OperateApiClient } from 'operate'

const operate = createClient()

export async function cancelProcesses(processDefinitionKey: string) {
	if (!operate) {
		return
	}
	const processes = await operate.searchProcessInstances({
		filter: {
			processDefinitionKey,
		},
	})
	await Promise.all(
		processes.items.map((item) => {
			return operate.deleteProcessInstance(item.key).catch((e) => {
				console.log(`Failed to delete process ${item.key}`)
				console.log(e)
			})
		})
	)
}

function createClient() {
	try {
		return new OperateApiClient()
	} catch (e: unknown) {
		// console.log(e.message)
		// console.log(`Running without access to Operate`)
		return null
	}
}
