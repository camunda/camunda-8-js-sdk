import { Camunda8 } from '../../c8'

const c8 = new Camunda8()
const camunda = c8.getCamundaRestClient()
const operate = c8.getOperateApiClient()

export async function cancelProcesses(processDefinitionKey: string) {
	const topology = await camunda.getTopology()

	const gatewayVersion = topology.gatewayVersion
	const [major, minor] = gatewayVersion.split('.').map(Number)
	const useCamundaRestClient = major > 8 || (major === 8 && minor >= 8)
	const { searchProcessInstances, cancelProcessInstance } = useCamundaRestClient
		? {
				searchProcessInstances: camunda.searchProcessInstances.bind(camunda),
				cancelProcessInstance: (pid) =>
					camunda.cancelProcessInstance({ processInstanceKey: pid }),
			}
		: {
				searchProcessInstances: operate.searchProcessInstances.bind(operate),
				cancelProcessInstance: operate.deleteProcessInstance.bind(operate),
			}

	const processes = await searchProcessInstances({
		filter: {
			processDefinitionKey,
			state: 'ACTIVE',
		},
	}).catch((e) => {
		console.log(
			`Failed to search for process instances for ${processDefinitionKey}`
		)
		console.log(e)
	})
	if (processes) {
		await Promise.all(
			processes.items.map((item) => {
				return cancelProcessInstance(item.key ?? item.processInstanceKey).catch(
					() => {} // Swallow exception
				)
			})
		)
	}
}
