# 1.2.4

## Fixes

_Things that were broken and are now fixed._

-   Update dependency `camunda-saas-oauth` to 1.2.4 to fix an issue with token expiration. Cached tokens were not correctly expired, leading to a 401 Unauthorized response to API calls after some time. The tokens are now correctly evicted from the cache. Thanks to [@hanh-le-clv](https://github.com/hanh-le-clv) for reporting this. See [this issue](https://github.com/camunda-community-hub/camunda-8-sdk-node-js/issues/7) for more details.

# 1.2.3

-   Add private method `safeJSONparse` to handle non-serializable variables.
-   In version 1.2.2, a maximum of 10 variables were returned by `getJSONVariablesforProcess`. In version 1.2.3, up to 1000 variables are returned.

# 1.2.2

### Enhancements

-   Add method `getJSONVariablesforProcess` to return variables as an object.

# 1.2.0

### Enhancements

-   Support custom OAuthProvider and baseUrl via constructor to enable multiple clients/clusters per application. See [#4](https://github.com/camunda-community-hub/operate-client-node-js/issues/4) for more details.
