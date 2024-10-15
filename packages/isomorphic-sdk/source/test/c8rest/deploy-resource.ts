/* eslint-disable @typescript-eslint/naming-convention */

import path from 'node:path'
import http from 'node:http'
import type net from 'node:net'
import {promisify} from 'node:util'
import test from 'ava'
import multiparty from 'multiparty';
import {CamundaRestClient} from '../../c8-rest/index.js'

type HttpTestServer = http.Server & {
	stop: () => Promise<void>;
	port: number;
	request_body: string;
}

const createHttpTestServer = async () => {
	const server: HttpTestServer = http.createServer((request, response) => {
		// Set CORS headers
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
		response.setHeader('Access-Control-Allow-Credentials', 'true');

		if (request.method === 'OPTIONS') {
			// Handle preflight requests
			response.writeHead(204);
			response.end();
			return;
		}

		if (request.method === 'POST') {
			const form = new multiparty.Form();

			form.parse(request, (error, fields, files) => {
				if (error) {
					console.error('Error parsing form data', error);
					response.writeHead(400, {'Content-Type': 'application/json'});
					response.end(JSON.stringify({error: 'Invalid form data'}));
					return;
				}

				// Process the fields and files
				const body = {
					fields,
					files,
				};

				server.request_body = JSON.stringify(body);

				const responseJson = {
					deploymentKey: 234_323_434,
					deployments: [
						{
							processDefinition: {
								processDefinitionKey: 2_343_232,
								processDefinitionId: 'processId',
								version: 1,
								resourceName: 'resourceName',
								tenantId: '',
							},
						},
					],
					tenantId: '',
				};

				response.writeHead(200, {'Content-Type': 'application/json'});
				response.end(JSON.stringify(responseJson));
			});
		} else {
			response.writeHead(405, {'Content-Type': 'application/json'});
			response.end(JSON.stringify({error: 'Method not allowed'}));
		}
	}) as HttpTestServer

	await promisify(server.listen.bind(server))()
	server.port = (server.address() as net.AddressInfo).port
	server.stop = async () => promisify(server.close.bind(server))()
	return server
}

test('Correctly sends a deploy request', async t => {
	const server = await createHttpTestServer()
	const client = new CamundaRestClient({
		configuration:
		{
			ZEEBE_REST_ADDRESS: `http://localhost:${server.port}`,
			CAMUNDA_AUTH_STRATEGY: 'NONE',
		},
	})
	const response = await client.deployResourcesFromFiles({files: [path.join('distribution', 'test', 'resources', 'MigrateProcess-Rest-Version-1.bpmn')]})

	t.is(response.deployments.length, 1)
	t.is(response.processDefinitions[0].processDefinitionKey, '2343232')
	await server.stop()
	t.pass()
})

