# Development

## Testing

Tests for this client require environment variables to be configured based on a valid cluster API client. [See these docs](https://docs.camunda.io/docs/components/console/manage-clusters/manage-api-clients/#create-a-client) for more information about creating a cluster API client, and obtaining the necessary environment variables.

The environment variables can be defined manually in the terminal instance prior to running the tests, or you may create a `.env` file to hold them. See [.env.example](./.env.example) for an example configuration containing the necessary keys.
