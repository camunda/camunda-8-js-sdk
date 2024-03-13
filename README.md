# Camunda 8 JavaScript SDK

[![NPM](https://nodei.co/npm/@camunda8/sdk.png)](https://www.npmjs.com/package/@camunda8/sdk)

This is the official Camunda 8 JavaScript SDK.

## Using the SDK in your project

Install the SDK as a dependency:

```bash
npm i @camunda8/sdk
```

## Usage

In this release, the functionality of the Camunda Platform 8 is exposed via dedicated clients for the component APIs.

```typescript
import { Camunda8 } from '@camunda8/sdk'

const c8 = new Camunda8()
const zeebe = c8.getZeebeGrpcClient()
const operate = c8.getOperateApiClient()
const optimize = c8.getOptimizeApiClient()
const tasklist = c8.getTasklistApiClient()
const modeler = c8.getModelerApiClient()
const console = c8.getConsoleApiClient()
```

## Configuration

You can explicitly configure in code by passing a `Partial<Camunda8PlatformConfiguration>` to the constructor, or via environment variables.

Any configuration in environment variables will be automatically picked by the component, and

## OAuth

### Disable OAuth

To disable OAuth, set the environment variable `CAMUNDA_OAUTH_DISABLED`. You can use this when, for example, running against a minimal Zeebe broker in a development environment.

With this environment variable set, the SDK will inject a `NullAuthProvider` that does nothing.
