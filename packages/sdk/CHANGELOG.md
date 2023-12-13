# CHANGELOG

## Version 0.15.1

## Fixes

_Things that were broken and are now fixed._

-   Update dependency `camunda-saas-oauth` to 1.2.4 to fix an issue with token expiration. Cached tokens were not correctly expired, leading to a 401 Unauthorized response to API calls after some time. The tokens are now correctly evicted from the cache. Thanks to [@hanh-le-clv](https://github.com/hanh-le-clv) for reporting this. See [this issue](https://github.com/camunda-community-hub/camunda-8-sdk-node-js/issues/7) for more details.

## Version 0.15.0

-   Update Operate client to 1.2.3, safely parsing variables when retrieving all variables for a process. 

## Version 0.14.0

### Enhancements

-   Update Tasklist client to 0.9.5, safely parsing variables when retrieving a Task.

## Version 0.13.0

### Enhancements

-   Update Operate API client to 1.2.2.

## Version 0.11.0

### Enhancements

-   Update Operate API client to 1.2.0, enabling multiple clusters per application via custom OAuth injection.