# Contributing to @camunda8/sdk

Thank you for considering contributing to @camunda8/sdk! We welcome contributions from the community to make our package even better.

## Getting Started

To get started with contributing, please follow these steps:

1. Fork the repository and clone it to your local machine.
2. Install the dependencies by running `npm install`.
3. Make your changes or additions to the codebase.
4. Write tests to cover your changes and ensure existing tests pass.
5. Run the tests using `npm test` to make sure everything is working correctly.
6. Commit your changes and push them to your forked repository.
7. Submit a pull request to the main repository.

## Running tests

Run all the unit tests with `lerna run test`.

### Integration tests

Integration tests can be run against Self-Managed or against Camunda SaaS.

To run integration tests against Camunda SaaS, but credentials for a Camunda SaaS API Client with scopes for all components in the environment, then run the integration tests against Camunda SaaS with `lerna run test:integration`.

To run the integration tests against Self-Managed, you can use either your own Self-Managed instance, or start one locally using Docker.

To start one locally, run `docker compose -f docker/docker-compose.yml up -d`.

Put the following credentials in the environment:

```bash
# Self-Managed
export ZEEBE_SECURE_CONNECTION=false
export ZEEBE_ADDRESS='localhost:26500'
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
```

## Code Style

We follow a specific code style in our project to maintain consistency. Please make sure to adhere to the following guidelines:

- Run `lerna run lint` to lint your code with ESLint.
- Run `lerna run prettify` to format your code to the project standard.

## Issue Reporting

If you encounter any bugs or issues while using @camunda/sdk, please report them in the [issue tracker](https://github.com/camunda-community-hub/camunda-8-js-sdk/issues). Provide as much detail as possible, including steps to reproduce the issue.

## Feature Requests

If you have any ideas or feature requests for @camunda/sdk, please submit them in the [issue tracker](https://github.com/camunda-community-hub/camunda-8-js-sdk/issues). We appreciate your feedback and suggestions.

## License

By contributing to @camunda/sdk, you agree that your contributions will be licensed under the [Apache License](https://opensource.org/licenses/Apache).

## Contact

If you have any questions or need further assistance, feel free to reach out to us at [your-email@example.com].

Happy contributing!
