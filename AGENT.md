# Agent Information for Camunda 8 JavaScript SDK

This file contains information for AI agents working on the Camunda 8 JavaScript SDK repository.

See also:
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor onboarding, branch model, release summary
- [MAINTAINER.md](MAINTAINER.md) — operational guide (CI workflows, semantic-release, npm publishing)

## Project Overview

The Camunda 8 JavaScript SDK is the official TypeScript/Node.js SDK for Camunda Platform 8. It provides unified access to all Camunda 8 APIs including Zeebe, Operate, Optimize, Tasklist, Modeler, and Admin. It targets Node.js (not browser) and ships TypeScript typings.

## Commit Conventions (read this before committing)

The repo enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint` (see [commitlint.config.js](commitlint.config.js)). The CI job `lint-commits` will block PRs that violate these rules.

### Allowed commit types

Only these `type:` values are accepted (any other type — including `deps:` — will fail `lint-commits`):

| Type           | When to use                                                                                              | Release impact |
| -------------- | -------------------------------------------------------------------------------------------------------- | -------------- |
| `feat`         | New SDK feature                                                                                          | patch          |
| `fix`          | Bug fix                                                                                                  | patch          |
| `perf`         | Performance improvement                                                                                  | patch          |
| `revert`       | Revert a previous commit                                                                                 | patch          |
| `release`      | Force a patch release with no other eligible commits                                                     | patch          |
| `server`       | Bump to a new Camunda **minor** line (e.g. 8.8 → 8.9)                                                    | minor          |
| `server-major` | Bump to a new Camunda **major** line (e.g. 8.x → 9.0)                                                    | major          |
| `chore`        | Maintenance, dependency bumps (`chore(deps): ...`), tooling                                              | none           |
| `build`        | Build system / packaging changes                                                                         | none           |
| `ci`           | CI workflow / GitHub Actions changes                                                                     | none           |
| `docs`         | Documentation only                                                                                       | none           |
| `refactor`     | Code refactor with no behavior change                                                                    | none           |
| `style`        | Whitespace / formatting only                                                                             | none           |
| `test`         | Test-only changes                                                                                        | none           |

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

## Essential Commands

### Build & Compilation
```bash
npm run build          # Clean, compile TypeScript, and copy proto files
npm run clean          # Remove dist folder and build artifacts
npm run compile        # Compile TypeScript to JavaScript
```

### Testing
```bash
npm test               # Run unit tests only
npm run test:integration    # Run integration tests (requires Docker)
npm run test:local     # Run local integration tests
npm run test:smoketest # Build and run smoke tests
npm run test:c8run     # Run Camunda 8 specific tests
```

### Code Quality
```bash
npm run lint           # Run ESLint on TypeScript files
npm run format         # Format code with Prettier
```

### Development Environment
```bash
npm run sm:start       # Start Docker Compose for Self-Managed Camunda 8
npm run sm:stop        # Stop Docker Compose services
npm run sm:start8.8    # Start Camunda 8.8 specific environment
npm run sm:stop8.8     # Stop Camunda 8.8 environment
```

### Documentation
```bash
npm run docs           # Generate TypeDoc documentation
npm run docs:watch     # Generate and watch docs for changes
```

## Project Structure

```
src/
├── index.ts              # Main entry point
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
└── __tests__/           # Test files organized by component
```

## Key Architecture Patterns

### Client Pattern
- Each API has its own client class (e.g., `OperateApiClient`, `TasklistApiClient`)
- All clients are instantiated through the main `Camunda8` factory class
- Clients support both SaaS and Self-Managed configurations

### DTO Pattern
- Data Transfer Objects (DTOs) extend `LosslessDto` for int64 handling
- Use decorators like `@Int64String` for precise number handling
- Search request DTOs extend `BaseSearchRequest<TSortFields, TFilter>` or `BaseSearchRequestWithOptionalFilter<TSortFields, TFilter>`
- Response DTOs use `PaginatedCamundaRestSearchResponse<T>` pattern for consistent pagination

### Authentication
- OAuth2/OIDC support for SaaS
- Basic auth and custom auth providers for Self-Managed
- Token caching and automatic refresh

The SDK supports five authentication strategies (set via `CAMUNDA_AUTH_STRATEGY` or programmatically):

| Strategy | Use case                                                          |
| -------- | ----------------------------------------------------------------- |
| `OAUTH`  | Default for Camunda SaaS and Self-Managed                         |
| `BASIC`  | Nginx reverse-proxy with basic auth                               |
| `COOKIE` | C8Run 8.7                                                         |
| `BEARER` | Custom token management                                           |
| `NONE`   | Development or mTLS                                               |

### Pagination
- **CamundaRestClient**: Uses `startCursor`/`endCursor` (string values)
- **Other APIs**: Use `firstSortValues`/`lastSortValues` or `sortValues` (arrays)

## Testing Patterns

### Test Organization
- Unit tests: `*.unit.spec.ts` - Mock external dependencies
- Integration tests: `*.integration.spec.ts` - Test against real services
- Local integration: `*local-integration.spec.ts` - Test local Docker setup

### Test Environment Variables
- `CAMUNDA_UNIT_TEST=true` - Forces unit test mode
- Various `ZEEBE_*`, `OPERATE_*` environment variables for service configuration
- Integration tests use environment files from `env/` directory (e.g., `env/8.8-alpha.env`)

### Test Utilities
- Use `jest` as the test framework
- Tests are organized by component in `src/__tests__/`
- Integration tests require either Docker services or sourced environment variables
- **Running Integration Tests**: `source env/8.8-alpha.env && npx jest path/to/test.rest.spec.ts`
- **Running Unit Tests**: `npm test -- --testPathPattern="testname.unit"`

## Common Development Tasks

### Adding New Search Endpoints
1. Define filter interface (e.g., `ProcessInstanceSearchFilter`)
2. Extend `BaseSearchRequest<TSortFields, TFilter>` or `BaseSearchRequestWithOptionalFilter<TSortFields, TFilter>`
3. Define details interface for response items (e.g., `DecisionInstanceDetails`)
4. Create `CamundaRest*Response` interface extending `PaginatedCamundaRestSearchResponse<DetailsType>`
5. Add method to `CamundaRestClient` using `callApiEndpoint` pattern
6. Write comprehensive unit tests with mocked `callApiEndpoint`
7. Write integration tests that source environment variables from `env/` directory

### Adding New API Clients
1. Create client class in appropriate directory (e.g., `src/newservice/`)
2. Define DTOs in `*Dto.ts` file
3. Add client factory method to main `Camunda8` class
4. Export client from main `index.ts`

### Handling Authentication
- Clients accept `IHeadersProvider` for custom auth
- Use `constructOAuthProvider()` for standard OAuth flows
- Set appropriate environment variables for configuration

## Important Files

- `src/c8/lib/C8Dto.ts` - Main DTO definitions for REST API
- `src/c8/lib/CamundaRestClient.ts` - Unified REST API client
- `src/lib/Configuration.ts` - Configuration management
- `src/lib/LosslessDto.ts` - Base class for DTOs with int64 support
- `package.json` - Scripts and dependencies
- `tsconfig.json` - TypeScript configuration

## Common Issues & Solutions

### Build Issues
- Run `npm run clean` before building if encountering cache issues
- Ensure all imports use correct relative paths
- Check for TypeScript errors with `npm run compile`

### Test Issues  
- Integration tests require Docker services: `npm run sm:start`
- Use `npm run test` for unit tests only
- Check test environment variables are set correctly

### Authentication Issues
- Verify OAuth configuration for SaaS
- Check basic auth credentials for Self-Managed
- Ensure certificates are properly configured for custom CA

## Code Style Guidelines

- Use TypeScript strict mode
- Follow existing patterns for DTO definitions
- Use `LosslessDto` base class for API responses
- Prefer composition over inheritance for client features
- Write comprehensive JSDoc comments for public APIs

### Code formatting and linting

- Prettier formats code; ESLint lints it.
- Configs: `prettier.config.js`, `.eslintrc.json`.
- To format/lint a single file: `npx prettier --write 'src/${filename}'` and `npx eslint 'src/${filename}'`.
- The Husky pre-commit hook runs `lint-staged` (Prettier on staged TS files) plus `npm run test`.

## REST API Endpoint Pattern

When implementing a new REST API endpoint:

1. Create request/response DTOs in the appropriate `*Dto.ts` file.
2. Add the method to the relevant client class.
3. Use the `callApiEndpoint` pattern.
4. Document parameters with JSDoc.
5. Include proper error handling.

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

For search endpoints:

1. Define filter interface (e.g. `SomeEntitySearchFilter`).
2. Extend `BaseSearchRequest<TSortFields, TFilter>` or `BaseSearchRequestWithOptionalFilter<TSortFields, TFilter>`.
3. Define response interface extending `PaginatedCamundaRestSearchResponse<EntityDetails>`.
4. Use cursor-based pagination with `startCursor`/`endCursor` for REST API endpoints.

## BPMN / DMN Test Resources

- Place test models in `__tests__/<version>/resources/` (e.g. `__tests__/8.8/resources/`).
- For DMN decision tables, use the **`FIRST`** hit policy (not `UNIQUE`).
- Validate that resources are deployed before exercising them in tests.

## Recent Additions

### Search Decision Instances API
- `searchDecisionInstances()` method in `CamundaRestClient`
- `DecisionInstanceSearchFilter` and `SearchDecisionInstancesRequest` DTOs
- `CamundaRestSearchDecisionInstancesResponse` with cursor-based pagination
- Comprehensive unit and integration tests
- Follows established patterns for search endpoints

## Dependencies

Key dependencies to be aware of:
- `got` - HTTP client library
- `@grpc/grpc-js` - gRPC client
- `lossless-json` - JSON parsing with int64 support
- `form-data` - Multipart form handling
- `jest` - Testing framework
