# console-client-node-js

The Camunda 8 Web Console API client for Node.js.

## Installation

```bash
npm i @camunda8/console
```

## Usage

Set the credential for the Camunda SaaS Console in the environment, then:

```typescript
import { ConsoleApiClient } from '@camunda8/console'

const console = new ConsoleApiClient()

async function main() {
	const res = await console.getClusters()
	console.log(res)
	const params = await console.getParameters()
	console.log(params)
}

main()
```
