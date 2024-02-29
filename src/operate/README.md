# Operate API Client for Node.js

[![NPM](https://nodei.co/npm/operate-api-client.png)](https://npmjs.org/package/operate-api-client)

![Community Extension](https://img.shields.io/badge/Community%20Extension-An%20open%20source%20community%20maintained%20project-FF4700)

![Lifecycle](https://img.shields.io/badge/Lifecycle-Stable-brightgreen)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A Node.js client for interacting with the [Camunda 8 Operate REST API](https://docs.camunda.io/docs/apis-clients/operate-api/) in Camunda 8 SaaS.

Uses [camunda-saas-oauth-nodejs](https://github.com/camunda-community-hub/camunda-saas-oauth-nodejs) to use client credentials from the environment for authentication.

## Installation

```
npm i @camunda8/operate
```

## Usage

Set the credentials for Camunda SaaS in the environment, then:

```typescript
import { OperateApiClient } from '@camunda8/operate'

const operate = new OperateApiClient()

operate
	.searchProcessInstances({
		filter: {
			state: 'ACTIVE',
		},
		size: 50,
	})
	.then((instances) => {
		console.log(instances)
	})
```

## Advanced Usage

If you want to create multiple instances of the client in an application - for example, to address different clusters - then you can hydrate the client manually using an `OAuthProviderImpl` like so:

```typescript
import { OperateApiClient } from '@camunda8/operate'
import { OAuthProviderImpl } from '@camunda8/oauth'

const oauthProvider1 = new OAuthProviderImpl({
	audience: 'zeebe.camunda.io',
	authServerUrl: 'https://login.cloud.camunda.io/oauth/token',
	clientId: process.env.ZEEBE_CLIENT_ID_1,
	clientSecret: process.env.ZEEBE_CLIENT_SECRET_1,
	userAgentString: 'operate-client-nodejs',
})

const client_1 = new OperateApiClient({
	oauthProvider,
	baseUrl: process.env.CAMUNDA_OPERATE_BASE_URL_1,
})

const oauthProvider2 = new OAuthProviderImpl({
	audience: 'zeebe.camunda.io',
	authServerUrl: 'https://login.cloud.camunda.io/oauth/token',
	clientId: process.env.ZEEBE_CLIENT_ID_2,
	clientSecret: process.env.ZEEBE_CLIENT_SECRET_2,
	userAgentString: 'operate-client-nodejs',
})

const client_2 = new OperateApiClient({
	oauthProvider,
	baseUrl: process.env.CAMUNDA_OPERATE_BASE_URL_2,
})
```
