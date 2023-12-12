# Camunda 8 Web Modeler API Client 

This is a Node.js client for the Camunda 8 Web Modeler API v1.

To install: 

```bash
npm i @jwulf/modeler --registry https://npm.pkg.github.com
```

## Usage

Set the environment variables for a Console API client.

```typescript
import { ModelerApiClient } from '@jwulf/modeler'

// Hydrate credentials from the environment using the dotenv package
import 'dotenv/config'

async function main() {
    const info = await modeler.getInfo()
    console.log(JSON.stringify(info, null, 2))
    const projects = await modeler.searchProjects({})
    console.log(`Found ${projects.length} projects`)
    console.log(JSON.stringify(projects, null, 2))
    })
}

main()
```