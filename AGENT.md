# Agent Information for Camunda 8 JavaScript SDK

This file is the **canonical** instruction document for AI agents (Copilot, Claude, etc.) working on the Camunda 8 JavaScript SDK repository. It supersedes the previous `.github/copilot-instructions.md`.

See also:
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor onboarding, branch model, release summary
- [MAINTAINER.md](MAINTAINER.md) — operational guide (CI workflows, semantic-release, npm publishing)

---

## Project Overview

The Camunda 8 JavaScript SDK is the official TypeScript/Node.js client library for Camunda Platform 8. It provides unified access to all Camunda 8 APIs including Zeebe, Operate, Optimize, Tasklist, Modeler, and Admin. It targets Node.js (not browser) and ships TypeScript typings.

### Key Features

- Full-featured clients for all Camunda 8 services
- Support for both SaaS and Self-Managed deployments
- OAuth authentication with token management
- Specialized handling for int64 values through the `LosslessDto` system
- Comprehensive testing suite for unit and integration tests

---

## Commit Conventions (read this before committing)

The repo enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint` (see [commitlint.config.js](commitlint.config.js)). The CI job `lint-commits` will block PRs that violate these rules.

### Allowed commit types

Only these `type:` values are accepted (any other type — including `deps:` — will fail `lint-commits`):

| Type           | When to use                                                      | Release impact |
| -------------- | ---------------------------------------------------------------- | -------------- |
| `feat`         | New SDK feature                                                  | patch          |
| `fix`          | Bug fix                                                          | patch          |
| `perf`         | Performance improvement                                          | patch          |
| `revert`       | Revert a previous commit                                         | patch          |
| `release`      | Force a patch release with no other eligible commits             | patch          |
| `server`       | Bump to a new Camunda **minor** line (e.g. 8.8 → 8.9)            | minor          |
| `server-major` | Bump to a new Camunda **major** line (e.g. 8.x → 9.0)            | major          |
| `chore`        | Maintenance, dependency bumps (`chore(deps): ...`), tooling      | none           |
| `build`        | Build system / packaging changes                                 | none           |
| `ci`           | CI workflow / GitHub Actions changes                             | none           |
| `docs`         | Documentation only                                               | none           |
| `refactor`     | Code refactor with no behavior change                            | none           |
| `style`        | Whitespace / formatting only                                     | none           |
| `test`         | Test-only changes                                                | none           |

Note the **mutated semver**: `feat`/`fix` produce **patch** bumps, not minor/major. The SDK's version tracks the Camunda 8 server line, not its own API surface. See [MAINTAINER.md](MAINTAINER.md) for the full release pipeline.

### Scopes

`commitlint` does not enforce a scope-enum, so any scope is accepted. Use scopes when they clarify the change (e.g. `chore(deps): ...`, `fix(zeebe): ...`, `ci(release): ...`).

### Format constraints

- Body lines: max **500** characters per line (`body-max-line-length`).
- Footer lines: max **1000** characters per line (`footer-max-line-length`).
- Header (first line): conventional-commits default — keep concise.

### Common pitfalls

- **`deps:` is not valid.** Use `chore(deps): ...` for dependency pinning / bumps. (Dependabot itself uses `chore(deps):`.)
- The pre-commit Husky hook runs `npm run test`, which can fail on local-only files (e.g. nested worktrees). The release workflow bypasses this with `HUSKY=0`. For agent commits that are otherwise validated, prefix with `HUSKY=0` rather than `--no-verify`.

---

## Essential Commands

### Build & Compilation

```bash
npm run build          # Clean, compile TypeScript, copy proto files
npm run clean          # Remove dist folder and build artifacts
npm run compile        # Compile TypeScript to JavaScript
```

### Testing

The repo uses **vitest** (not jest, despite older docs).

```bash
npm test               # Run unit tests only (CAMUNDA_UNIT_TEST=true)
npm run test:smoketest # Build + smoke test + tsd typings check
npm run test:8.8:sm    # 8.8 self-managed integration
npm run test:8.8:saas  # 8.8 SaaS integration
npm run test:8.7:sm    # 8.7 self-managed integration
npm run test:8.7:mt    # 8.7 multi-tenancy integration
npm run test:8.7:saas  # 8.7 SaaS integration
npm run test:c8run     # C8Run integration
```

Run a single test file:

```bash
# Unit test — source unit env first
. env/unit-test.env && CAMUNDA_UNIT_TEST=true npx vitest run --testTimeout=30000 ${testFile}

# Integration test — source the appropriate env file
. env/8.8-alpha.env && npx vitest run --testTimeout=30000 ${testFile}
```

### Code Quality

```bash
npm run lint           # ESLint on src/**/*.ts
npm run format         # Prettier --write on src/**/*.ts

# Single file:
npx prettier --write 'src/${filename}'
npx eslint 'src/${filename}'
```

### Development Environment

```bash
npm run sm:start       # Start Docker Compose (Self-Managed Camunda 8)
npm run sm:stop        # Stop Docker Compose
npm run sm:start:8.8   # Start 8.8 stack
npm run sm:stop:8.8    # Stop 8.8 stack
npm run sm:start:8.9   # Start 8.9 stack
npm run sm:stop:8.9    # Stop 8.9 stack
```

### Documentation

```bash
npm run docs           # Generate TypeDoc docs
npm run docs:watch     # Generate + watch
```

---

## Project Structure

```
src/
├── index.ts              # Main entry point and exports
├── lib/                  # Common utilities and base classes
├── c8/                   # Camunda 8 unified client and REST API
│   ├── index.ts         # Camunda8 main class
│   └── lib/
│       ├── C8Dto.ts     # Data Transfer Objects for REST API
│       └── CamundaRestClient.ts  # REST API client implementation
├── zeebe/               # Zeebe gRPC and REST clients
├── operate/             # Operate API client
├── optimize/            # Optimize API client
├── tasklist/            # Tasklist API client
├── modeler/             # Web Modeler API client
├── admin/               # Admin API client
├── oauth/               # OAuth authentication providers
└── __tests__/           # Test files organized by component and version
```

### Important Files

- `src/c8/lib/C8Dto.ts` — Main DTO definitions for REST API
- `src/c8/lib/CamundaRestClient.ts` — Unified REST API client
- `src/lib/Configuration.ts` — Configuration management
- `src/lib/LosslessDto.ts` — Base class for DTOs with int64 support
- `package.json` — Scripts and dependencies
- `tsconfig.json` — TypeScript configuration
- `commitlint.config.js` — Allowed commit types
- `release.config.js` — semantic-release branch + dist-tag rules

---

## Key Architecture Patterns

### 1. Client Factory Pattern

- The main `Camunda8` class is the factory for all service clients.
- Configuration is centralized in the factory and passed to individual clients.
- Clients are created via methods like `getCamundaRestClient()`, `getZeebeGrpcApiClient()`, `getOperateClient()`, `getTasklistClient()`, etc.
- Clients support both SaaS and Self-Managed configurations.

### 2. DTO Pattern

- DTOs live in `*Dto.ts` files.
- Most DTOs extend `LosslessDto` for int64 handling.
- Use decorators like `@Int64String` for int64 fields.
- Always follow existing patterns when adding new DTOs.

```typescript
export class SomeEntityDto extends LosslessDto {
	@Int64String
	entityKey!: string
	name!: string
	// Other fields...
}
```

### 3. Pagination

- **`CamundaRestClient`**: cursor-based — `startCursor` / `endCursor` (string values).
- **Other APIs (Operate, Tasklist, …)**: `firstSortValues` / `lastSortValues` or `sortValues` (arrays).

### 4. Authentication

The SDK supports five authentication strategies (set via `CAMUNDA_AUTH_STRATEGY` or programmatically):

| Strategy | Use case                                          |
| -------- | ------------------------------------------------- |
| `OAUTH`  | Default for Camunda SaaS and Self-Managed         |
| `BASIC`  | Nginx reverse-proxy with basic auth               |
| `COOKIE` | C8Run 8.7                                         |
| `BEARER` | Custom token management                           |
| `NONE`   | Development or mTLS                               |

- Clients accept `IHeadersProvider` for custom auth.
- Use `constructOAuthProvider()` for standard OAuth flows.
- Token caching and automatic refresh are built in.

### 5. Code formatting and linting

- Prettier formats code; ESLint lints it.
- Configs: `prettier.config.js`, `.eslintrc.json`.
- The Husky pre-commit hook runs `lint-staged` (Prettier on staged TS files) plus `npm run test`.

---

## REST API Endpoint Pattern

When implementing a new REST API endpoint:

1. Review the REST API documentation to understand the endpoint.
2. Create request/response DTOs in the appropriate `*Dto.ts` file.
3. Add appropriate decorators like `@Int64String` for int64 fields.
4. Add the method to the relevant client class.
5. Use the `callApiEndpoint` pattern.
6. Document parameters with JSDoc.
7. Include proper error handling.
8. Write comprehensive unit and integration tests.

```typescript
/**
 * Gets a specific decision instance by ID
 * @param decisionInstanceId The ID of the decision instance to retrieve
 * @returns A GetDecisionInstanceResponse object with the decision instance details
 */
async getDecisionInstance(
  decisionInstanceId: string
): Promise<GetDecisionInstanceResponse> {
  return this.callApiEndpoint({
    method: 'get',
    path: `decision-instances/${decisionInstanceId}`,
    responseType: GetDecisionInstanceResponse,
  })
}
```

### Full example: GET endpoint

```typescript
// In C8Dto.ts
export class GetEntityRequest extends LosslessDto {
  @Int64String
  entityId!: string
}

export class EntityDetails extends LosslessDto {
  @Int64String
  entityKey!: string
  name!: string
  creationTime!: string
  state!: string
}

// In CamundaRestClient.ts
/**
 * Gets an entity by ID
 * @param entityId The ID of the entity to retrieve
 * @returns An EntityDetails object with entity information
 */
async getEntity(entityId: string): Promise<EntityDetails> {
  return this.callApiEndpoint<UnknownRequestBody, EntityDetails>({
    method: 'get',
    path: `entities/${entityId}`,
  })
}
```

### Search endpoints

For implementing search endpoints:

1. Define the filter interface (e.g. `SomeEntitySearchFilter`).
2. Extend `BaseSearchRequest<TSortFields, TFilter>` or `BaseSearchRequestWithOptionalFilter<TSortFields, TFilter>`.
3. Define a response interface extending `PaginatedCamundaRestSearchResponse<EntityDetails>`.
4. Use cursor-based pagination with `startCursor` / `endCursor` for REST API endpoints.

```typescript
// In C8Dto.ts
export interface EntitySearchFilter {
  state?: string
  name?: string
}

export type EntitySortFields = 'creationTime' | 'name'

export class SearchEntitiesRequest extends BaseSearchRequest<
  EntitySortFields,
  EntitySearchFilter
> {}

export class CamundaRestSearchEntitiesResponse extends PaginatedCamundaRestSearchResponse<EntityDetails> {}

// In CamundaRestClient.ts
/**
 * Search for entities
 * @param request The search request with filters and sorting options
 * @returns A paginated response with entity details
 */
async searchEntities(
  request: SearchEntitiesRequest
): Promise<CamundaRestSearchEntitiesResponse> {
  return this.callApiEndpoint<SearchEntitiesRequest, CamundaRestSearchEntitiesResponse>({
    method: 'post',
    path: 'entities/search',
    body: request,
  })
}
```

### Handling int64 Values

- Always use the `@Int64String` decorator for int64 fields in DTOs.
- Extend `LosslessDto` for request and response DTOs.
- Follow existing patterns for handling large numbers.

---

## Testing Patterns

### Test Organization

- Unit tests: `*.unit.spec.ts` — mock external dependencies.
- Integration tests: `*.integration.spec.ts` (and `*.rest.spec.ts`) — test against real services.
- Local integration: `*local-integration.spec.ts` — local Docker setup.
- Tests are organized by component and version under `src/__tests__/`.

### Test Environment Variables

- `CAMUNDA_UNIT_TEST=true` — forces unit-test mode.
- `TEST_DEPLOYMENT`, `TEST_VERSION`, `TEST_TENANCY`, `TEST_SECURITY` — gate which integration suites run.
- Various `ZEEBE_*`, `CAMUNDA_*` environment variables for service configuration.
- Integration tests source environment files from `env/` (e.g. `env/8.8-alpha.env`, `env/unit-test.env`).

### Test Implementation Guidelines

**Unit tests:**
- Mock external dependencies and API calls.
- Test error handling paths.
- Validate proper parameter passing.
- Run a single unit test file:
  ```bash
  . env/unit-test.env && CAMUNDA_UNIT_TEST=true npx vitest run --testTimeout=30000 ${testFile}
  ```

**Integration tests:**
- Deploy required resources (BPMN, DMN) before testing.
- Clean up resources after tests.
- Source environment variables from `env/`.
- Handle async operations with proper timeouts.
- Validate response DTOs with assertions.
- Run a single integration test file:
  ```bash
  . env/8.8-alpha.env && npx vitest run --testTimeout=30000 ${testFile}
  ```

**BPMN / DMN test resources:**
- Place test models in `src/__tests__/<version>/resources/` (e.g. `src/__tests__/8.8/resources/`).
- For DMN decision tables, use the **`FIRST`** hit policy (not `UNIQUE`).
- Validate that resources are deployed before exercising them.

### Example test structure

```typescript
describe('SomeClient.someMethod', () => {
	let client: SomeClient

	beforeAll(async () => {
		// Setup resources and client
	})

	it('should correctly handle the happy path', async () => {
		// Test implementation
		// Assert expected behavior
	})

	it('should handle error conditions', async () => {
		// Test error paths
		// Assert error handling
	})
})
```

---

## Common Development Tasks

### Adding a New REST API Endpoint

See [REST API Endpoint Pattern](#rest-api-endpoint-pattern) above. Summary:

1. Review the REST API spec.
2. Create request/response DTOs in `*Dto.ts` (with `@Int64String` decorators where needed).
3. Add the client method using `callApiEndpoint`.
4. Write unit + integration tests.

### Adding a New Search Endpoint

See [Search endpoints](#search-endpoints) above. Summary:

1. Define filter interface.
2. Extend `BaseSearchRequest<TSortFields, TFilter>` or `BaseSearchRequestWithOptionalFilter<TSortFields, TFilter>`.
3. Define details interface for response items.
4. Define response interface extending `PaginatedCamundaRestSearchResponse<DetailsType>`.
5. Add method to `CamundaRestClient` using `callApiEndpoint`.
6. Write unit tests with mocked `callApiEndpoint`.
7. Write integration tests sourcing env files.

### Adding a New API Client

1. Create the client class in an appropriate directory (e.g. `src/newservice/`).
2. Define DTOs in a `*Dto.ts` file.
3. Add a client factory method to the `Camunda8` class.
4. Export the client from `src/index.ts`.

---

## Coding Guidelines

1. Use TypeScript strict mode.
2. Add detailed JSDoc comments to public methods.
3. Follow existing naming conventions.
4. Write comprehensive tests for all new functionality.
5. Include both unit and integration tests.
6. Maintain backward compatibility.
7. Use meaningful variable and function names.
8. Follow the existing error handling patterns.
9. Use `LosslessDto` base class for API responses.
10. Prefer composition over inheritance for client features.

## Documentation Guidelines

- Include JSDoc comments for all public methods and classes.
- Document parameters, return types, and thrown exceptions.
- Include examples for complex functionality.
- Keep documentation up-to-date with code changes.

---

## Common Issues & Solutions

### Build Issues
- Run `npm run clean` before building if encountering cache issues.
- Ensure all imports use correct relative paths.
- Check for TypeScript errors with `npm run compile`.

### Test Issues
- Integration tests require Docker services: `npm run sm:start` (or one of the version-specific variants).
- Use `npm run test` for unit tests only.
- Verify test environment variables are set (source the right file from `env/`).

### Authentication Issues
- Verify OAuth configuration for SaaS.
- Check basic-auth credentials for Self-Managed.
- Ensure certificates are properly configured for custom CA.

### Commit Rejected by `lint-commits`
- Confirm the type is in the [allowed commit types](#allowed-commit-types) table. `deps:` is the most common mistake — use `chore(deps):` instead.

---

## Dependencies

Key dependencies to be aware of:

- `@camunda8/orchestration-cluster-api` — generated REST client (pinned to 8.x; see [MAINTAINER.md](MAINTAINER.md))
- `@grpc/grpc-js` — gRPC client
- `lossless-json` — JSON parsing with int64 support
- `form-data` — Multipart form handling
- `vitest` — test framework
- `got` — HTTP client (legacy paths)

---

## Recent Additions

### Search Decision Instances API
- `searchDecisionInstances()` method on `CamundaRestClient`
- `DecisionInstanceSearchFilter` and `SearchDecisionInstancesRequest` DTOs
- `CamundaRestSearchDecisionInstancesResponse` with cursor-based pagination
- Comprehensive unit and integration tests
- Follows established patterns for search endpoints
