# Optimize API Client for Node.js

[![NPM](https://nodei.co/npm/optimize-api-client.png)](https://npmjs.org/package/optimize-api-client) 

![Community Extension](https://img.shields.io/badge/Community%20Extension-An%20open%20source%20community%20maintained%20project-FF4700)

![Lifecycle](https://img.shields.io/badge/Lifecycle-Stable-brightgreen)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A Node.js client for interacting with the [Camunda Platform 8 Optimize REST API](https://docs.camunda.io/optimize/apis-clients/optimize-api/configuration/enable-sharing/).

Uses [camunda-saas-oauth-nodejs](https://github.com/camunda-community-hub/camunda-saas-oauth-nodejs) to use client credentials from the environment for authentication.

## Installation

```
npm i optimize-api-client
```

## Usage

Set the credential for Camunda SaaS in the environment, then: 

```typescript
import { OptimizeApiClient } from 'optimize-api-client`

const optimize = new OperateApiClient()

async function main() {
    await optimize.enableSharing()
    const id = "8a7103a7-c086-48f8-b5b7-a7f83e864688"
    const res = await optimize.exportDashboardDefinitions([id])
    fs.writeFileSync('exported-dashboard.json', JSON.stringify(res, null, 2))
}

main()
```