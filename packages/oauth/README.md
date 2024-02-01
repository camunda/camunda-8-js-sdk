# Camunda SaaS OAuth for Node.js

[![NPM](https://nodei.co/npm/camunda-saas-oauth.png)](https://npmjs.org/package/camunda-saas-oauth)

![Community Extension](https://img.shields.io/badge/Community%20Extension-An%20open%20source%20community%20maintained%20project-FF4700)

![Lifecycle](https://img.shields.io/badge/Lifecycle-Stable-brightgreen)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A library to exchange a set of Camunda 8 SaaS API credentials for a token to make API calls to Camunda 8 SaaS. Uses [camunda-8-credentials-from-env](https://github.com/camunda-community-hub/camunda-8-credentials-from-env) to get the credentials from the environment.

Caches the token to disk, and refreshes tokens before they expire.

## Installation

Install as a dependency:

```
npm i @camunda8/oauth
```

## Usage

```typescript
import * as auth from '@camunda8/oauth'

async function main() {
	const useragent = 'myclient-nodejs/1.0.0'
	const operateToken = await auth.getOperateToken(useragent)
	const tasklistToken = await auth.getTasklistToken(useragent)
	const optimizeToken = await auth.getOptimizeToken(useragent)
	const zeebeToken = await auth.getZeebeToken(useragent)
	return {
		operateToken,
		tasklistToken,
		optimizeToken,
		zeebeToken,
	}
}
```

The call will throw if the client credentials are not found in the environment, or you request a token for a scope for which the credentials are not valid.

## Configuration

Set the API client credentials in the environment, using [the environment variables from the web console](https://docs.camunda.io/docs/components/console/manage-clusters/manage-api-clients/).

To configure a different cache directory, set the `CAMUNDA_TOKEN_CACHE_DIR` environment variable.

To turn off disk caching, set the environment variable `CAMUNDA_TOKEN_CACHE=memory-only`.

## User Agent

Example of a custom user agent string: `mycustom-client-nodejs/${pkg.version} ${CUSTOM_AGENT_STRING}`

## Advanced Usage

The methods that return tokens use an `OAuthProvider` to get the tokens.

The `OAuthProvider` class is a wrapper that hydrates a `OAuthProviderImpl` with credentials from the environment.

If you want to manually set the credentials (for example, to address multiple clusters in a single application), you can do so by creating an `OAuthProviderImpl` directly, like so:

```typescript
import { OAuthProviderImpl } from 'camunda-saas-oauth'

const oauth = new OAuthProviderImpl({
	/** OAuth Endpoint URL */
	authServerUrl,
	/** OAuth Audience */
	audience,
	clientId,
	clientSecret,
	userAgentString,
})

const operateToken = oauth.getToken('OPERATE')
const optimizeToken = oauth.getToken('OPTIMIZE')
const tasklistToken = oauth.getToken('TASKLIST')
const zeebeToken = oauth.getToken('ZEEBE')
```
