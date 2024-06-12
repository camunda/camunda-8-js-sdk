# Contributing to @camunda8/sdk

Thank you for considering contributing to @camunda8/sdk! We welcome contributions from the community to make our package even better.

## Getting Started

To get started with contributing, please follow these steps:

It's a good idea to discuss your contribution in an issue in the repository first, to align on the approach - particularly if it is a new feature.

1. Fork the repository and clone it to your local machine.
2. Check out the `alpha` branch. This is the development branch.
3. Install the dependencies by running `npm install`.
4. Make your changes or additions to the codebase.
5. Write tests to cover your changes and ensure existing tests pass.
6. Run the tests using `npm test` to make sure everything is working correctly. See below for details on running integration tests.
7. Commit your changes and push them to your forked repository. Use [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) format for the commit message. See the note below.
8. Submit a pull request against `alpha`.
9. If any changes are needed they will be requested.
10. Your PR will be merged to `alpha` and the integration tests run in CI.
11. When the `alpha` branch is merged into `main`, a new package is published to NPM.

## A note on commit messages

The repository uses [`semantic-release`](https://github.com/semantic-release/semantic-release) to create releases. Because we track the Camunda 8 Platform minor version, we treat feature implementation during a minor release cycle as a patch release rather than a minor release.

Creating a commit with a `feat` commit message will cause the package version patch release number to increment. To update the minor version, a commit with the type `minor` is needed.

## Running tests

Run all the unit tests with `npm run test`.

### Integration tests

Integration tests can be run against Self-Managed or against Camunda SaaS.

To run integration tests against Camunda SaaS, but credentials for a Camunda SaaS API Client with scopes for all components in the environment, then run the integration tests against Camunda SaaS with `npm run test:integration`.

To run the integration tests against Self-Managed, you can use either your own Self-Managed instance, or start one locally using Docker.

To start one locally, run `docker compose -f docker-compose-modeler.yaml -f docker-compose-multitenancy.yml up -d`.

Put the following credentials in the environment:

```bash
# Self-Managed
export ZEEBE_SECURE_CONNECTION=false
export ZEEBE_GRPC_ADDRESS='localhost:26500'
export ZEEBE_REST_ADDRESS='localhost:8080/v1/'
export ZEEBE_CLIENT_ID='zeebe'
export ZEEBE_CLIENT_SECRET='zecret'
export ZEEBE_AUTHORIZATION_SERVER_URL='http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token'
export ZEEBE_TOKEN_AUDIENCE='zeebe.camunda.io'
export CAMUNDA_CREDENTIALS_SCOPES='Zeebe,Tasklist,Operate,Optimize'
export CAMUNDA_OAUTH_URL='http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token'
export CAMUNDA_TASKLIST_BASE_URL='http://localhost:8082'
export CAMUNDA_OPERATE_BASE_URL='http://localhost:8081'
export CAMUNDA_OPTIMIZE_BASE_URL='http://localhost:8083'
export CAMUNDA_MODELER_BASE_URL='http://localhost:8086'
export CAMUNDA_MODELER_OAUTH_AUDIENCE='_omit_'
export CAMUNDA_TENANT_ID=''

export CAMUNDA_TEST_TYPE='local'

# Modeler API Client
export CAMUNDA_CONSOLE_CLIENT_ID='zeebe'
export CAMUNDA_CONSOLE_CLIENT_SECRET='zecret'
# export CAMUNDA_CONSOLE_BASE_URL='https://api.cloud.camunda.io'
# export CAMUNDA_CONSOLE_OAUTH_AUDIENCE='api.cloud.camunda.io'
```

Now run the integration tests against Self-Managed with `npm run test:local-integration`.

### Multi-tenancy tests

To run the multi-tenancy tests, use the following environment variables:

```bash
# Self-Managed
export ZEEBE_SECURE_CONNECTION=false
export ZEEBE_GRPC_ADDRESS='localhost:26500'
export ZEEBE_REST_ADDRESS='localhost:8080/v1/'
export ZEEBE_CLIENT_ID='zeebe'
export ZEEBE_CLIENT_SECRET='zecret'
export ZEEBE_AUTHORIZATION_SERVER_URL='http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token'
export ZEEBE_TOKEN_AUDIENCE='zeebe.camunda.io'
export CAMUNDA_CREDENTIALS_SCOPES='Zeebe,Tasklist,Operate,Optimize'
export CAMUNDA_OAUTH_URL='http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token'
export CAMUNDA_TASKLIST_BASE_URL='http://localhost:8082'
export CAMUNDA_OPERATE_BASE_URL='http://localhost:8081'
export CAMUNDA_OPTIMIZE_BASE_URL='http://localhost:8083'
export CAMUNDA_TEST_TYPE='local'
export CAMUNDA_TENANT_ID='<default>'
```

Now run the integration tests against Self-Managed with `npm run test:multitenancy`.

## Code Style

We follow a specific code style in our project to maintain consistency. Please make sure to adhere to the following guidelines:

- Run `npm run lint` to lint your code with ESLint.
- Run `npm run format` to format your code to the project standard.

## Issue Reporting

If you encounter any bugs or issues while using @camunda/sdk, please report them in the [issue tracker](https://github.com/camunda/camunda-8-js-sdk/issues). Provide as much detail as possible, including steps to reproduce the issue.

## Feature Requests

If you have any ideas or feature requests for @camunda/sdk, please submit them in the [issue tracker](https://github.com/camunda/camunda-8-js-sdk/issues). We appreciate your feedback and suggestions.

## License

By contributing to @camunda/sdk, you agree that your contributions will be licensed under the [Apache License](https://opensource.org/licenses/Apache).

## Contact

If you have any questions or need further assistance, open an issue in the repository.

Happy contributing!
