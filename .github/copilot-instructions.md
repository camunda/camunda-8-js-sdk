# Copilot Instructions for Camunda 8 JavaScript SDK

This document provides guidance for Copilot or other AI tools when working with the Camunda 8 JavaScript SDK repository. Follow these architectural patterns and guidelines to ensure consistent and high-quality contributions.

## Repository Overview

The Camunda 8 JavaScript SDK is the official TypeScript/Node.js client library for Camunda Platform 8. It provides unified access to all Camunda 8 APIs including Zeebe, Operate, Optimize, Tasklist, Modeler, and Admin. It's designed for Node.js environments (not browser) and provides TypeScript typings.

### Key Features

- Full-featured clients for all Camunda 8 services
- Support for both SaaS and Self-Managed deployments
- OAuth authentication with token management
- Specialized handling for int64 values through the LosslessDto system
- Comprehensive testing suite for unit and integration tests

## Code Architecture

### Project Structure

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

## Key Architectural Patterns

### 1. Client Factory Pattern

- The main `Camunda8` class serves as a factory for all service clients
- Configuration is centralized in the factory and passed to individual clients
- Clients are created via methods like `getCamundaRestClient()`, `getZeebeGrpcApiClient()`, etc.

### 2. DTO Pattern

- Data Transfer Objects (DTOs) are defined in `*Dto.ts` files
- Most DTOs extend `LosslessDto` for int64 handling
- Use decorators like `@Int64String` for proper number handling
- Always follow existing patterns when adding new DTOs

Example:

```typescript
export class SomeEntityDto extends LosslessDto {
	@Int64String
	entityKey!: string
	name!: string
	// Other fields...
}
```

### 3. REST API Endpoint Implementation

When implementing a new REST API endpoint:

1. Create request/response DTOs in the appropriate `*Dto.ts` file
2. Add the method to the relevant client class
3. Use the `callApiEndpoint` pattern for implementation
4. Document parameters with JSDoc comments
5. Include proper error handling

Example:

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

### 4. Search Endpoints Pattern

For implementing search endpoints:

1. Define filter interface (e.g., `SomeEntitySearchFilter`)
2. Extend `BaseSearchRequest<TSortFields, TFilter>` or `BaseSearchRequestWithOptionalFilter<TSortFields, TFilter>`
3. Define response interface extending `PaginatedCamundaRestSearchResponse<EntityDetails>`
4. Use cursor-based pagination with `startCursor`/`endCursor` for REST API endpoints

### 5. Authentication Patterns

The SDK supports multiple authentication strategies:

- OAUTH (default for Camunda SaaS and Self-Managed)
- BASIC (for Nginx reverse-proxy with basic auth)
- COOKIE (for C8Run 8.7)
- BEARER (for custom token management)
- NONE (for development or mTLS)

### 6. Code formatting and linting

- Use Prettier for code formatting
- Use ESLint for linting
- Follow the existing `prettier.config.json` and `.eslintrc.json` configurations
- You can run `npx prettier --write 'src/${filename}'` to format the code and `npx eslint 'src/${filename}'` to check for linting issues

## Testing Patterns

### Test Organization

- Unit tests: `*.unit.spec.ts` - Mock external dependencies
- Integration tests: `*.integration.spec.ts` - Test against real services
- Tests are organized by component and version in `__tests__/` directory

### Test Implementation Guidelines

1. For unit tests:

   - Mock external dependencies and API calls
   - Test error handling paths
   - Validate proper parameter passing
   - To run a unit test, source environment variables from `env/unit-test.env` and run `CAMUNDA_UNIT_TEST=true npx jest --runInBand --testTimeout=30000 ${testFile}`

2. For integration tests:

   - Deploy required resources (BPMN, DMN) before testing
   - Clean up resources after tests
   - Use environment variables from `env/` directory
   - Handle async operations with proper timeouts
   - Ensure that response Dtos are properly validated using assertions in tests
   - To run an integration test, source environment variables from `env/8.8-alpha.env` run `npx jest --runInBand --testTimeout=30000 ${testFile}`

3. For DMN and BPMN tests:
   - Place test models in `__tests__/<version>/resources/`
   - Use `FIRST` hit policy for DMN decision tables (not `UNIQUE`)
   - Properly validate deployed resources before testing

Example test structure:

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

## Common Development Tasks

### Adding a New REST API Endpoint

1. Review the REST API documentation to understand the endpoint
2. Create request and response DTOs in the appropriate `*Dto.ts` file
3. Add appropriate decorators like `@Int64String` for int64 fields
4. Implement the method in the client class
5. Write comprehensive unit and integration tests

### Handling int64 Values

- Always use `@Int64String` decorator for int64 fields in DTOs
- Extend `LosslessDto` for request and response DTOs
- Follow existing patterns for handling large numbers

## Coding Guidelines

1. Use TypeScript strict mode
2. Add detailed JSDoc comments to public methods
3. Follow existing naming conventions
4. Write comprehensive tests for all new functionality
5. Include both unit and integration tests
6. Maintain backward compatibility
7. Use meaningful variable and function names
8. Follow the existing error handling patterns

## Documentation Guidelines

- Include JSDoc comments for all public methods and classes
- Document parameters, return types, and thrown exceptions
- Include examples for complex functionality
- Keep documentation up-to-date with code changes

## Code Examples

### Adding a New REST API Method

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

### Adding a New Search Endpoint

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
