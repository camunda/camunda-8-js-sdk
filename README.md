# Camunda 8 JavaScript SDK

[![NPM](https://nodei.co/npm/@camunda8/sdk.png)](https://www.npmjs.com/package/@camunda8/sdk)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Full API Docs are [here](https://camunda.github.io/camunda-8-js-sdk/).

This is the official Camunda 8 JavaScript SDK. It is written in TypeScript and runs on Node.js. See why [this does not run in a web browser](https://github.com/camunda/camunda-8-js-sdk/issues/79).

See the QUICKSTART.md file in [the repository](https://github.com/camunda/camunda-8-js-sdk) for a quick start.

## What does "supported" mean?

This is the official supported-by-Camunda Nodejs SDK for Camunda Platform 8.

The Node.js SDK will not always support all features of Camunda Platform 8 immediately upon their release. Complete API coverage for a platform release will lag behind the platform release.

Prioritisation of implementing features is influenced by customer demand.

## Semantic versioning

The SDK package tracks Camunda Platform 8 minor versioning. Feature releases to support current Platform minor version features result in a patch release of the SDK.

## Using the SDK in your project

Install the SDK as a dependency:

```bash
npm i @camunda8/sdk
```

## Usage

In this release, the functionality of Camunda 8 is exposed via dedicated clients for the component APIs.

```typescript
import { Camunda8 } from '@camunda8/sdk'

const c8 = new Camunda8()
const restClient = c8.getCamundaRestClient() // New REST API
const zeebe = c8.getZeebeGrpcApiClient()
const zeebeRest = c8.getZeebeRestClient() // Deprecated
const operate = c8.getOperateApiClient()
const optimize = c8.getOptimizeApiClient()
const tasklist = c8.getTasklistApiClient()
const modeler = c8.getModelerApiClient()
const admin = c8.getAdminApiClient()
```

## Configuration

The configuration for the SDK can be done by any combination of environment variables and explicit configuration passed to the `Camunda8` constructor.

The complete documentation of all configuration parameters can be found [here](https://camunda.github.io/camunda-8-js-sdk/variables/index.CamundaSDKConfiguration.html).

Any configuration passed in to the `Camunda8` constructor is merged over any configuration in the environment. The configuration object fields and the environment variables have exactly the same names.

## A note on how int64 is handled in the JavaScript SDK

Entity keys in Camunda 8 are stored and represented as `int64` numbers. The range of `int64` extends to numbers that cannot be represented by the JavaScript `number` type. To deal with this, `int64` keys are serialised by the SDK to the JavaScript `string` type. See [this issue](https://github.com/camunda/camunda-8-js-sdk/issues/78) for more details.

For `int64` values whose type is not known ahead of time, such as job variables, you can pass an annotated data transfer object (DTO) to decode them reliably. If no DTO is specified, the default behavior of the SDK is to serialise all numbers to JavaScript `number`, and to throw an exception if a number value is detected at a runtime that cannot be accurately represented as the JavaScript `number` type (that is, a value greater than 2^53-1).

## Authorization

Calls to APIs can be authorized using a number of strategies. The most common is OAuth - a token that is obtained via a client id/secret pair exchange.

- Camunda SaaS and Self-Managed by default are configured to use OAuth with token exchange. In most cases, you will use the `OAUTH` strategy and provide configuration only. The token exchange and its lifecycle are managed by the SDK in this strategy. This passes the token in the `authorization` header of requests.
- If you secure the gateway behind an Nginx reverse-proxy secured with basic authentication, you will use the `BASIC` strategy. This adds the login credentials as the `authorization` header on requests.
- For C8Run 8.7, you will need to use the `COOKIE` strategy. This manages a session cookie obtained from a login endpoint, and adds it as a cookie header to requests.
- For more customisation, you can use the `BEARER` strategy. This is a strategy that allows you to dynamically provide the `Bearer` token directly. The currently set token is added as the `authorization` header on requests.
- If you have a even more advanced use-case (for example, the need to add specific headers with specific values to authenticate with a proxy gateway), you can construct your own AuthProvider and pass it to the constructor.
- You can also disable header auth completely and use mTLS (client certificate) — or no authentication at all — with the `NONE` strategy.

For more details on each of these scenarios, see the relevant section below.

### Disable Auth

To disable Auth, set the environment variable `CAMUNDA_AUTH_STRATEGY=NONE`. You can use this when running against a minimal Zeebe broker in a development environment, for example. You can also use this when your authentication is being done using an x509 mTLS certificate (see the section on mTLS).

### OAuth

If your platform is secured with OAuth token exchange (Camunda SaaS or Self-Managed with Identity), provide the following configuration fields at a minimum, either via the `Camunda8` constructor or in environment variables:

```bash
CAMUNDA_AUTH_STRATEGY=OAUTH
ZEEBE_ADDRESS=...
ZEEBE_CLIENT_ID=...
ZEEBE_CLIENT_SECRET=...
CAMUNDA_OAUTH_URL=...
```

To get a token for the Camunda SaaS Administration API or the Camunda SaaS Modeler API, set the following:

```bash
CAMUNDA_AUTH_STRATEGY=OAUTH
CAMUNDA_CONSOLE_CLIENT_ID=...
CAMUNDA_CONSOLE_CLIENT_SECRET=...
```

### Token caching

OAuth tokens are cached in-memory and on-disk. The disk cache is useful to prevent token endpoint saturation when restarting or rolling over workers, for example. They can all hit the cache instead of requesting new tokens.

You can turn off the disk caching by setting `CAMUNDA_TOKEN_DISK_CACHE_DISABLE` to true. This will cache tokens in-memory only.

By default, the token cache directory is `$HOME/.camunda`. You can specify a different directory by providing a full file path value for `CAMUNDA_TOKEN_CACHE_DIR`.

Here is an example of specifying a different cache directory via the constructor:

```typescript
import { Camunda8 } from '@camunda8/sdk'

const c8 = new Camunda8({
	CAMUNDA_TOKEN_CACHE_DIR: '/tmp/cache',
})
```

If the cache directory does not exist, the SDK will attempt to create it (recursively). If the SDK is unable to create it, or the directory exists but is not writeable by your application, the SDK will throw an exception.

### Basic Auth

To use basic auth, set the following values either via the environment or explicitly in code via the constructor:

```bash
CAMUNDA_AUTH_STRATEGY=BASIC
CAMUNDA_BASIC_AUTH_USERNAME=....
CAMUNDA_BASIC_AUTH_PASSWORD=...
```

### Cookie Auth

For C8Run with 8.7, you need to use [Cookie Authentication](https://docs.camunda.io/docs/apis-tools/camunda-api-rest/camunda-api-rest-authentication/#authentication-via-cookie-c8run-only).

To use cookie auth, set the following value:

```
CAMUNDA_AUTH_STRATEGY=COOKIE

# Optional configurable values - these are the defaults
CAMUNDA_AUTH_COOKIE_URL=http://localhost:8080/api/login
CAMUNDA_AUTH_COOKIE_USERNAME=demo
CAMUNDA_AUTH_COOKIE_PASSWORD=demo
```

### Bearer Token Auth

The BEARER auth strategy is provided as a low-level primitive for advanced use-cases that are not covered by the others. In this case, you need to pass an `authorization` header with a `Bearer` token on requests, but it is not issued by a supported OAuth token exchange endpoint. In this case, you can implement a token exchange mechanism and manage the lifecycle of the token, and dynamically inject it as a header through a `BearerAuthProvider`.

To use a Bearer token that you have already obtained, and that does not need to be dynamically updated during the lifetime of the application, simply set the following values:

```bash
CAMUNDA_AUTH_STRATEGY=BEARER
CAMUNDA_OAUTH_TOKEN=....
```

To refresh the bearer token dynamically at runtime (for example, when it has expired and your obtain a new one), you pass in a `BearerAuthProvider` that you control:

```typescript
import { Camunda8, Auth } from '@camunda8/sdk'

const bearerAuth = new Auth.BearerAuthProvider()
const c8 = new Camunda8({ oauthProvider: bearerAuth }) // All clients and workers will use bearerAuth
// ... after obtaining a new token
bearerAuth.setToken('SOMETOKENVALUE....') // Dynamically update the bearer token value
```

### Advanced Custom Headers

You can add arbitrary headers to all requests by implementing `IOAuthProvider`:

```typescript
import { Camunda8, Auth } from '@camunda8/sdk'

class MyCustomAuthProvider implements Auth.IOAuthProvider {
	async getToken(audience: string) {
		// here we give a static example, but this class may read configuration,
		// exchange credentials with an endpoint, manage token lifecycles, and so forth...
		// Return an object which will be merged with the headers on the request
		return {
			'x-custom-auth-header': 'someCustomValue',
		}
	}
}

const customAuthProvider = new MyCustomAuthProvider()
const c8 = new Camunda8({ oauthProvider: customAuthProvider })
```

You can use this approach to wrap one of the existing strategy classes using a facade pattern to encapsulate and extend it.

## TLS

If you are using self-signed certificates, you can provide the self-signed certificate path using the configuration parameter / environment variable: `CAMUNDA_CUSTOM_ROOT_CERT_PATH`.

### mTLS

The Zeebe gRPC client supports mTLS. You can provide the mTLS certificate and key with:

```
CAMUNDA_CUSTOM_CERT_CHAIN_PATH # path to mTLS certificate
CAMUNDA_CUSTOM_PRIVATE_KEY_PATH # path to mTLS (client-side) key
```

## Connection configuration examples

### Self-Managed

This is the complete environment configuration needed to run against the Dockerised Self-Managed stack in the `docker` subdirectory:

```bash
# Self-Managed
export ZEEBE_ADDRESS='localhost:26500'
export ZEEBE_REST_ADDRESS='http://localhost:8080'
export ZEEBE_CLIENT_ID='zeebe'
export ZEEBE_CLIENT_SECRET='zecret'
export CAMUNDA_OAUTH_STRATEGY='OAUTH'
export CAMUNDA_OAUTH_URL='http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token'
export CAMUNDA_TASKLIST_BASE_URL='http://localhost:8082'
export CAMUNDA_OPERATE_BASE_URL='http://localhost:8081'
export CAMUNDA_OPTIMIZE_BASE_URL='http://localhost:8083'
export CAMUNDA_MODELER_BASE_URL='http://localhost:8070/api'

# Turn off the tenant ID, which may have been set by multi-tenant tests
# You can set this in a constructor config, or in the environment if running multi-tenant
export CAMUNDA_TENANT_ID=''

# TLS for gRPC is on by default. If the Zeebe broker is not secured by TLS, turn it off
export CAMUNDA_SECURE_CONNECTION=false
```

If you are using an OIDC that requires a `scope` parameter to be passed with the token request, set the following variable:

```
CAMUNDA_TOKEN_SCOPE
```

Here is an example of doing this via the constructor, rather than via the environment:

```typescript
import { Camunda8 } from '@camunda8/sdk'

const c8 = new Camunda8({
	ZEEBE_ADDRESS: 'localhost:26500',
	ZEEBE_REST_ADDRESS: 'http://localhost:8080',
	ZEEBE_CLIENT_ID: 'zeebe',
	ZEEBE_CLIENT_SECRET: 'zecret',
	CAMUNDA_OAUTH_STRATEGY: 'OAUTH',
	CAMUNDA_OAUTH_URL:
		'http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token',
	CAMUNDA_TASKLIST_BASE_URL: 'http://localhost:8082',
	CAMUNDA_OPERATE_BASE_URL: 'http://localhost:8081',
	CAMUNDA_OPTIMIZE_BASE_URL: 'http://localhost:8083',
	CAMUNDA_MODELER_BASE_URL: 'http://localhost:8070/api',
	CAMUNDA_TENANT_ID: '', // We can override values in the env by passing an empty string value
	CAMUNDA_SECURE_CONNECTION: false,
})
```

### Camunda SaaS

Here is a complete configuration example for connection to Camunda SaaS:

```bash
export ZEEBE_ADDRESS='5c34c0a7-7f29-4424-8414-125615f7a9b9.syd-1.zeebe.camunda.io:443'
export ZEEBE_REST_ADDRESS='https://syd-1.zeebe.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9'
export ZEEBE_CLIENT_ID='yvvURO9TmBnP3zx4Xd8Ho6apgeiZTjn6'
export ZEEBE_CLIENT_SECRET='iJJu-SHgUtuJTTAMnMLdcb8WGF8s2mHfXhXutEwe8eSbLXn98vUpoxtuLk5uG0en'
# export CAMUNDA_CREDENTIALS_SCOPES='Zeebe,Tasklist,Operate,Optimize' # What APIs these client creds are authorised for
export CAMUNDA_TASKLIST_BASE_URL='https://syd-1.tasklist.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9'
export CAMUNDA_OPTIMIZE_BASE_URL='https://syd-1.optimize.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9'
export CAMUNDA_OPERATE_BASE_URL='https://syd-1.operate.camunda.io/5c34c0a7-7f29-4424-8414-125615f7a9b9'
export CAMUNDA_OAUTH_URL='https://login.cloud.camunda.io/oauth/token'
export CAMUNDA_AUTH_STRATEGY='OAUTH'

# This is on by default, but we include it in case it got turned off for local tests
export CAMUNDA_SECURE_CONNECTION=true

# Admin Console and Modeler API Client
export CAMUNDA_CONSOLE_CLIENT_ID='e-JdgKfJy9hHSXzi'
export CAMUNDA_CONSOLE_CLIENT_SECRET='DT8Pe-ANC6e3Je_ptLyzZvBNS0aFwaIV'
export CAMUNDA_CONSOLE_BASE_URL='https://api.cloud.camunda.io'
export CAMUNDA_CONSOLE_OAUTH_AUDIENCE='api.cloud.camunda.io'
```

## Logging

The SDK uses a Winston / Pino compatible logging setup. By default it uses Winston.

When using the default logging library, you can set the logging level of the SDK via the environment variable (or constructor configuration property) `CAMUNDA_LOG_LEVEL`. This defaults to 'info'. Values (in order of priority): `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`.

### Custom logger

You can supply a custom logger via the constructor. For example, to use the [Pino](https://getpino.io/) logging library:

```typescript
import pino from 'pino'

import { Camunda8 } from '../../c8/index'

const level = process.env.CAMUNDA_LOG_LEVEL ?? 'trace'
const logger = pino({ level }) // Logging level controlled via the logging library

logger.info('Pino logger created')
const c8 = new Camunda8({
	logger,
})
c8.log.info('Using pino logger')
```

## Debugging

The SDK uses the [`debug`](https://github.com/debug-js/debug) library to help you debug specific issues. This produces verbose, low-level output from specific components to the console.

To enable debugging output, set a value for the `DEBUG` environment variable. The value is a comma-separated list of debugging namespaces. The SDK has the following namespaces:

| Value                    | Component                        |
| ------------------------ | -------------------------------- |
| `camunda:adminconsole`   | Administration API               |
| `camunda:modeler`        | Modeler API                      |
| `camunda:operate`        | Operate API                      |
| `camunda:optimize`       | Optimize API                     |
| `camunda:tasklist`       | Tasklist API                     |
| `camunda:oauth`          | OAuth Token Exchange             |
| `camunda:grpc`           | Zeebe gRPC channel               |
| `camunda:worker`         | Zeebe Worker                     |
| `camunda:worker:verbose` | Zeebe Worker (additional detail) |
| `camunda:zeebeclient`    | Zeebe Client                     |

Here is an example of turning on debugging for the OAuth and Operate components:

```bash
DEBUG=camunda:oauth,camunda:operate node app.js
```

This is intended for development debugging and it should not be enabled in production. The debug trace can include sensitive information such as secrets.

## Diagnostic Trace file

You can output a diagnostic trace file to use with Camunda technical support by setting the environment variable `CAMUNDA_SUPPORT_LOG_ENABLED` to true. This will output a file `camunda-support.log` containing diagnostic information and tracing calls. This information is useful for debugging. Be aware that this log file will contain secrets such as bearer tokens, as well as exposing urls.

## Process Variable Typing

Process variables - the `variables` of Zeebe messages, jobs, and process instance creation requests and responses - are stored in the broker as key:value pairs. They are transported as a JSON string. The SDK parses the JSON string into a JavaScript object.

Various Zeebe methods accept DTO classes for variable input and output. These DTO classes are used to provide design-time type information on the `variables` object. They are also used to safely decode 64-bit integer values that cannot be accurately represented by the JavaScript `number` type.

To create a DTO to represent the expected shape and type of the `variables` object, extend the `LosslessDto` class:

```typescript
class myVariableDTO extends LosslessDto {
	firstName!: string
	lastName!: string
	age!: number
	optionalValue?: number
	@Int64String
	veryBigInteger?: string
	constructor(data: Partial<myVariableDTO>) {
		super(data)
	}
}
```

## Typing of Zeebe worker variables

The variable payload in a Zeebe worker task handler is available as an object `job.variables`. By default, this is of type `any` for the gRPC API, and `unknown` for the REST API.

The `ZBClient.createWorker()` method accepts an `inputVariableDto` to control the parsing of number values and provide design-time type information. Passing an `inputVariableDto` class to a Zeebe worker is optional. If a DTO class is passed to the Zeebe worker, it is used for two purposes:

- To provide design-time type information on the `job.variables` object.
- To specify the parsing of JSON number fields. These can potentially represent `int64` values that cannot be represented accurately by the JavaScript `number` type. With a DTO, you can specify that a specific JSON number fields be parsed losslessly to a `string` or `BigInt`.

With no DTO specified, there is no design-time type safety. At run-time, all JSON numbers are converted to the JavaScript `number` type. If a variable field has a number value that cannot be safely represented using the JavaScript number type (a value greater than 2^53 -1), an exception is thrown.

To provide a DTO, extend the `LosslessDto` class like so:

```typescript
class MyVariableDto extends LosslessDto {
	name!: string
	maybeAge?: number
	@Int64String
	veryBigNumber!: string
	@BigIntValue
	veryBigInteger!: bigint
}
```

In this case, `veryBigNumber` is an `int64` value. It is transferred as a JSON number on the wire, but the parser will parse it into a `string` so that no loss of precision occurs. Similarly, `veryBigInteger` is a very large integer value. In this case, we direct the parser to parse this variable field as a `bigint`.

You can nest DTOs like this:

```typescript
class MyLargerDto extends LosslessDto {
	id!: string
	@ChildDto(MyVariableDto)
	entry!: MyVariableDto
}
```

## Typing of custom headers

The Zeebe worker receives custom headers as `job.customHeaders`. The `ZBClient.createWorker()` method accepts a `customHeadersDto` to control the behavior of custom header parsing of number values and provide design-time type information.

This follows the same strategy as the job variables, as previously described.

## Zeebe User Tasks

From 8.5, you can use Zeebe user tasks. See the documentation on [how to migrate to Zeebe user tasks](https://docs.camunda.io/docs/apis-tools/tasklist-api-rest/migrate-to-zeebe-user-tasks/).

The SDK supports the Zeebe REST API. Be sure to set the `ZEEBE_REST_ADDRESS` either via environment variable or configuration field.

## Job Streaming

The Zeebe gRPC API supports streaming available jobs, rather than polling for them.

The ZeebeGrpcClient method `StreamJobs` allows you to use this API.

Please note that only jobs that become available _after_ the stream is opened are pushed to the client. For jobs that were already activatable _before_ the method is called, you need to use a polling worker.

In this release, this is not handled for you. You must both poll and stream jobs to make sure that you get jobs that were available before your application started as well as jobs that become available after your application starts.

In a subsequent release, the ZeebeWorker will transparently handle this for you.

## Multi-tenant workers

Workers, both polling and streaming, can be multi-tenanted, requesting jobs from more than one tenant.

Example:

```typescript
client.createWorker({
	taskHandler: (job) => {
		console.log(job.tenantId) // '<default>' | 'green'
		return job.complete()
	},
	taskType: 'multi-tenant-work',
	tenantIds: ['<default>', 'green'],
})

client.streamJobs({
	taskHandler: async (job) => {
		console.log(job.tenantId) // '<default>' | 'green'
		return job.complete()
	},
	type: 'multi-tenant-stream-work',
	tenantIds: ['<default>', 'green'],
	worker: 'stream-worker',
	timeout: 2000,
})
```

## Polling worker backoff in error conditions

When a polling worker encounters an error, including not being authenticated, the worker will back off subsequent polls by +2 seconds with each subsequent failure, up to a maximum of `CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS`, which is 15000 by default (15 seconds). If the failure is due to invalid credentials and occurs during the token request, then the worker backoff will be compounded with a token endpoint backoff, which is +1000ms for each subsequent failure up to a maximum of 15s.

This means that if you start a worker with invalid credentials, then the polling backoff will look like this, by default (times in seconds): 3, 6, 9, 12, 15, 18, 21, 23, 24, 25, 26, 27, 28, 29, 30, 30, 30...

If the worker is backing off for a reason other than invalid credentials - for example a backpressure signal from the gateway - it will be: 2, 4, 6, 8, 10, 12, 14, 15, 15, 15.....
