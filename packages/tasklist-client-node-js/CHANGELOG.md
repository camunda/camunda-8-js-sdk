# 0.9.6

## Fixes

_Things that were broken and are now fixed._

-   Update dependency `camunda-saas-oauth` to 1.2.4 to fix an issue with token expiration. Cached tokens were not correctly expired, leading to a 401 Unauthorized response to API calls after some time. The tokens are now correctly evicted from the cache. Thanks to [@hanh-le-clv](https://github.com/hanh-le-clv) for reporting this. See [this issue](https://github.com/camunda-community-hub/camunda-8-sdk-node-js/issues/7) for more details.