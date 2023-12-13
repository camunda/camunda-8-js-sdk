# Camunda 8 Unified SDK for Node.js

[![NPM](https://nodei.co/npm/camunda-8-sdk.png)](https://npmjs.org/package/camunda-8-sdk) 

This SDK provides a high-level Node.js API for Camunda Platform 8. It is a wrapper around the following individual clients:

- [Web Console](https://github.com/camunda-community-hub/console-client-node-js)
- [Optimize API Client](https://github.com/camunda-community-hub/optimize-client-node-js)
- [Operate API Client](https://github.com/camunda-community-hub/operate-client-node-js)
- [Tasklist API Client](https://github.com/camunda-community-hub/tasklist-client-node-js)
- [Zeebe API Client](https://github.com/camunda-community-hub/zeebe-client-node-js)
- [Web Modeler API Client](https://github.com/camunda-community-hub/modeler-client-node-js)

It uses the following libraries to hydrate credentials from the environment:

- [Camunda 8 Credentials from Environment](https://github.com/camunda-community-hub/camunda-8-credentials-from-env)
- [Camunda SaaS OAuth](https://github.com/camunda-community-hub/camunda-saas-oauth-nodejs)

The full API documentation is hosted [here](https://camunda-community-hub.github.io/camunda-8-sdk-node-js/). 

Watch a seven-minute speedrun demo video here:

[![](./img/video.png)](https://www.youtube.com/watch?v=A-P6upPCQWA)

## API Coverage

| Component   | Tested Environment  |
|---|---|
| Zeebe  | SaaS, Self-hosted  |
| Operate  | SaaS  | 
| Optimize  | SaaS  | 
| Tasklist  |  SaaS  |
| Console   |  SaaS  |

## Installation

```bash
npm i camunda-8-sdk
```

## Usage

Set your Camunda SaaS credentials in the environment (at the moment, only Camunda SaaS is fully supported).

```typescript
import { C8 } from 'camunda-8-sdk'

const zbc = new C8.ZBClient()
const console = new C8.ConsoleApiClient()
const operate = new C8.OperateApiClient()
const optimize = new C8.OptimizeApiClient()
const tasklist = new C8.TasklistApiClient()
```

Refer to the API docs [here](https://camunda-community-hub.github.io/camunda-8-sdk-node-js/) for full documentation of each component.
