# Camunda 8 JS SDK

This SDK runs on Node 18+ and in modern web browsers. It provides an interface to the Camunda 8 REST API.

This package is native [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and ndoes not provide a CommonJS export. If your project uses CommonJS, you will have to [convert to ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Usage

Install as a project dependency:

```
npm i @camunda8/sdk # or yarn add @camunda8/sdk
```

```typescript
import { CamundaRestClient } from '@camunda8/sdk'

const camunda = new Camunda8RestClient()

async function main() {
    const topology = await camunda.getTopology()
    console.log('Cluster topology', topology)
}
```

## Self-signed or custom certificates

If your Camunda 8 gateway is secured with a custom certificate, you will need to install `@camunda8/custom-certificate`.

If you need to use custom certificates (such as self-signed certificates), then you will need to use `@camunda8/sdk` and run on Node. Custom certificates are not supported in the browser.

