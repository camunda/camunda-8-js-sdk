import process from 'node:process'
import test from 'ava'
import delay from 'delay'
import {LosslessNumber} from '@camunda8/lossless-json'
import {type HTTPError} from 'ky'
import {CamundaRestClient} from '../../c8-rest/index.js'
import {type ProcessDefinition, type Query} from '../../dto/operate-dto.js'
import {OperateApiClient} from '../../operate/index.js'

// eslint-disable-next-line ava/no-skip-test
test.skip('It can get the Incident', async t => {
	const c = new OperateApiClient()

	const incidents = await c.searchIncidents({
		filter: {
			processInstanceKey: new LosslessNumber('2251799816400111'),
		},
	})
	console.log(JSON.stringify(test, null, 2))
	t.is(incidents.total, 1)
})

// eslint-disable-next-line ava/no-skip-test
test.skip('It can search process definitions', async t => {
	const c = new OperateApiClient()

	const query: Query<ProcessDefinition> = {
		filter: {},
		size: 5,
		sort: [
			{
				field: 'bpmnProcessId',
				order: 'ASC',
			},
		],
	}
	const definitions = await c.searchProcessDefinitions(query)
	t.is(definitions.total > 0, true)
})

test('getJSONVariablesforProcess works', async t => {
	t.timeout(17_000)
	const c = new OperateApiClient()
	const zeebe = new CamundaRestClient()
	console.log(process.cwd())
	await zeebe.deployResourcesFromFiles({
		files: ['./distribution/test/resources/Operate-StraightThrough.bpmn'],
	})
	const p = await zeebe.createProcessInstanceWithResult({
		processDefinitionId: 'operate-straightthrough',
		variables: {
			foo: 'bar',
		},
	})

	// Wait for Operate to catch up.
	await delay(15_000)

	// Make sure that the process instance exists in Operate.
	const processInstance = await c.getProcessInstance(p.processInstanceKey)
	// If this fails, it is probably a timing issue.
	// Operate is eventually consistent, so we need to wait a bit.
	t.is(processInstance.key, p.processInstanceKey)
	const response = await c.getJsonVariablesforProcess(p.processInstanceKey)
	t.is(response.foo as unknown as string, 'bar')
})

test('test error type', async t => {
	t.timeout(7000)
	const c = new OperateApiClient()
	const zeebe = new CamundaRestClient()
	await zeebe.deployResourcesFromFiles({
		files: ['./distribution/test/resources/Operate-StraightThrough.bpmn'],
	})
	const p = await zeebe.createProcessInstanceWithResult({
		processDefinitionId: 'operate-straightthrough',
		variables: {
			foo: 'bar',
		},
	})
	await delay(5000)

	/**
	 * Here we request a process instance that doesn't exist.
	 * Understanding that this is the issue requires a bit of gymnastics by the consumer.
	 * This call may fail due to lack of permissions, a network error (including misconfiguration), or the process instance not existing.
	 * To rule out the other issues and focus on the process instance not existing, we need to catch the error and check the response body.
	 * (e.response?.body as string).includes('404') will return true if the response body contains the string '404'.
	 * This is a bit of a hack, but it's the best we can do without a more specific error type.
	 * Do we really want to expose consumers to this?
	 */
	try {
		await c
			.getProcessInstance(`${p.processInstanceKey}1`)
		t.fail()
	} catch (error: unknown) {
		t.is(((error as HTTPError).message.includes('404')), true)
	}
})
