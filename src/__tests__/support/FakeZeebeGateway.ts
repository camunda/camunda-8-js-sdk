import path from 'node:path'

import {
	Server,
	ServerCredentials,
	ServerWritableStream,
	loadPackageDefinition,
	sendUnaryData,
	ServerUnaryCall,
	status,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'

/**
 * A small real gRPC server that speaks enough of the Zeebe gateway protocol
 * (from the SDK's own zeebe.proto) for a streaming worker: Topology,
 * StreamActivatedJobs, ActivateJobs and CompleteJob.
 *
 * It exists so that fault-injection tests of the stream lifecycle can run in
 * the unit-test job against real grpc-js streams and a real TCP connection
 * (see TcpFaultProxy), instead of against a mock. It is not a broker: jobs are
 * handed out by `offerJob()`, and nothing is persisted.
 */

interface JobMessage {
	key: string
	type: string
	variables: string
}

type JobStream = ServerWritableStream<{ type: string }, JobMessage>

const protoPath = path.join(__dirname, '../../proto/zeebe.proto')

export class FakeZeebeGateway {
	private readonly server = new Server()
	private nextKey = 1
	private readonly streams = new Set<JobStream>()
	private readonly pending: JobMessage[] = []
	readonly completedJobKeys: string[] = []
	/** Number of StreamActivatedJobs calls received. */
	streamCalls = 0
	port = 0

	static async start(): Promise<FakeZeebeGateway> {
		const gateway = new FakeZeebeGateway()
		await gateway.listen()
		return gateway
	}

	get grpcAddress(): string {
		return `grpc://127.0.0.1:${this.port}`
	}

	/** Number of job streams currently open. */
	get openStreams(): number {
		return this.streams.size
	}

	/**
	 * Create a job. It goes to an open stream for its type if there is one,
	 * otherwise it waits to be returned by ActivateJobs (a poll).
	 */
	offerJob(type: string, variables: Record<string, unknown> = {}): string {
		const job: JobMessage = {
			key: String(this.nextKey++),
			type,
			variables: JSON.stringify(variables),
		}
		const stream = [...this.streams].find((s) => s.request.type === type)
		if (stream) {
			stream.write(this.toActivatedJob(job))
		} else {
			this.pending.push(job)
		}
		return job.key
	}

	async close(): Promise<void> {
		this.streams.forEach((s) => s.destroy())
		this.server.forceShutdown()
	}

	private toActivatedJob(job: JobMessage) {
		return {
			key: job.key,
			type: job.type,
			processInstanceKey: '1',
			bpmnProcessId: 'fake',
			processDefinitionVersion: 1,
			processDefinitionKey: '1',
			elementId: 'task',
			elementInstanceKey: '1',
			customHeaders: '{}',
			worker: 'fake',
			retries: 3,
			deadline: String(Date.now() + 30_000),
			variables: job.variables,
			tenantId: '<default>',
		}
	}

	private async listen(): Promise<void> {
		const definition = loadSync(protoPath, {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true,
		})
		const proto = loadPackageDefinition(definition) as unknown as {
			gateway_protocol: { Gateway: { service: never } }
		}
		this.server.addService(proto.gateway_protocol.Gateway.service, {
			Topology: (
				_call: ServerUnaryCall<unknown, unknown>,
				callback: sendUnaryData<unknown>
			) =>
				callback(null, {
					brokers: [],
					clusterSize: 1,
					partitionsCount: 1,
					replicationFactor: 1,
					gatewayVersion: 'fake',
				}),
			StreamActivatedJobs: (call: JobStream) => {
				this.streamCalls++
				this.streams.add(call)
				const release = () => this.streams.delete(call)
				call.on('cancelled', release)
				call.on('close', release)
				call.on('error', release)
				// Stays open: the call is never ended by the server.
			},
			ActivateJobs: (call: ServerWritableStream<{ type: string }, unknown>) => {
				const jobs = this.pending
					.splice(0)
					.filter((j) => j.type === call.request.type)
					.map((j) => this.toActivatedJob(j))
				call.write({ jobs })
				call.end()
			},
			CompleteJob: (
				call: ServerUnaryCall<{ jobKey: string }, unknown>,
				callback: sendUnaryData<unknown>
			) => {
				this.completedJobKeys.push(call.request.jobKey)
				callback(null, {})
			},
			FailJob: (
				_call: ServerUnaryCall<unknown, unknown>,
				callback: sendUnaryData<unknown>
			) => callback({ code: status.UNIMPLEMENTED }, null),
		})
		this.port = await new Promise<number>((resolve, reject) =>
			this.server.bindAsync(
				'127.0.0.1:0',
				ServerCredentials.createInsecure(),
				(error, port) => (error ? reject(error) : resolve(port))
			)
		)
	}
}
