## [8.7.15](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.14...v8.7.15) (2025-06-06)


### Bug Fixes

* destroy streams rather than removing all listeners. Fixes [#466](https://github.com/camunda/camunda-8-js-sdk/issues/466) ([2d12170](https://github.com/camunda/camunda-8-js-sdk/commit/2d12170387c3bc06f1a2ecd3c31fba20132b6ae4))

## [8.7.14](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.13...v8.7.14) (2025-06-05)


### Bug Fixes

* prevent ZBLogger crash when stacktrace is undefined ([d9b757f](https://github.com/camunda/camunda-8-js-sdk/commit/d9b757f734b7daf768e75a03843b4cdb43da0870))

## [8.7.13](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.12...v8.7.13) (2025-06-05)


### Features

* add getVariable to Rest API client. Fixes [#344](https://github.com/camunda/camunda-8-js-sdk/issues/344) ([ecacfda](https://github.com/camunda/camunda-8-js-sdk/commit/ecacfdac8d94a0cd292c7138b04e7871400bc703))
* add static method to OAuthProvider to clear file cache ([754bc20](https://github.com/camunda/camunda-8-js-sdk/commit/754bc2000dd42a4055a00dec6cc40138db7a78f6))

## [8.7.12](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.11...v8.7.12) (2025-06-04)


### Bug Fixes

* suppress cancelation error when worker is stopping. FIxes [#432](https://github.com/camunda/camunda-8-js-sdk/issues/432) ([d4f313c](https://github.com/camunda/camunda-8-js-sdk/commit/d4f313c10ae49b510acfa9f402b42d9278a7988d))

## [8.7.11](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.10...v8.7.11) (2025-05-30)


### Bug Fixes

* check the existing correlationKey first instead of using uuid() every time ([1cebb44](https://github.com/camunda/camunda-8-js-sdk/commit/1cebb443784105ff73e0e156a9ffa55c7c57a834))

## [8.7.10](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.9...v8.7.10) (2025-05-30)


### Bug Fixes

* do not remove stream listeners on stream end. fixes [#466](https://github.com/camunda/camunda-8-js-sdk/issues/466) ([c0003bf](https://github.com/camunda/camunda-8-js-sdk/commit/c0003bfb995aed8ba60c881ff4316f6694f34beb))

## [8.7.9](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.8...v8.7.9) (2025-05-27)


### Features

* add searchUsersForTenant ([4438ad0](https://github.com/camunda/camunda-8-js-sdk/commit/4438ad0c36e6f524880eca94256bf1c302c549dd))
* add searchUsersForTenant ([7d16d12](https://github.com/camunda/camunda-8-js-sdk/commit/7d16d126ace4328ff1e1648e87d3dd8f7b05116e))
* **camunda:** implement searchUsers. fixes [#338](https://github.com/camunda/camunda-8-js-sdk/issues/338) ([4a981f1](https://github.com/camunda/camunda-8-js-sdk/commit/4a981f1f633e9b735f399f56800bf1d5c2fa270f))
* **camunda:** implement searchUsers. fixes [#338](https://github.com/camunda/camunda-8-js-sdk/issues/338) ([2f3ea0d](https://github.com/camunda/camunda-8-js-sdk/commit/2f3ea0dcdb28a736b187b31e4c73a5aa5e1e35af))
* enhance context output for ZeebeGrpcClient log messages. fixes [#467](https://github.com/camunda/camunda-8-js-sdk/issues/467) ([2ababad](https://github.com/camunda/camunda-8-js-sdk/commit/2ababadbe80c82f1f838f87ef83d9711569a6004))

## [8.7.8](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.7...v8.7.8) (2025-05-16)


### Features

* add hinting for Rest errors. fixes [#456](https://github.com/camunda/camunda-8-js-sdk/issues/456) ([cf34f57](https://github.com/camunda/camunda-8-js-sdk/commit/cf34f5747f328be3fceba6f588b2cbc8bb32004a))
* debug and trace support log infrastructure. fixes [#457](https://github.com/camunda/camunda-8-js-sdk/issues/457) ([a8e3234](https://github.com/camunda/camunda-8-js-sdk/commit/a8e3234760edb6e0fa33c9eec5ddbf54b82ea2dd))

## [8.7.7](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.6...v8.7.7) (2025-05-12)


### Bug Fixes

* expose configuration in documentation. fixes [#451](https://github.com/camunda/camunda-8-js-sdk/issues/451) ([55dc5d5](https://github.com/camunda/camunda-8-js-sdk/commit/55dc5d5885c5c30373b930573e783c13b45609fb))
* refactor tests for configuration change ([4b33ad4](https://github.com/camunda/camunda-8-js-sdk/commit/4b33ad45f3e5bebf02801b535c5bc38252bf938a))

## [8.7.6](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.5...v8.7.6) (2025-05-08)


### Features

* enable arbitrary headers on requests. fixes [#448](https://github.com/camunda/camunda-8-js-sdk/issues/448) ([e07ab76](https://github.com/camunda/camunda-8-js-sdk/commit/e07ab7629ef55f124242eed0c8fb27279c3b76a2))

## [8.7.5](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.4...v8.7.5) (2025-05-07)


### Features

* allow dynamic update of Bearer token. fixes [#445](https://github.com/camunda/camunda-8-js-sdk/issues/445) ([fda54f5](https://github.com/camunda/camunda-8-js-sdk/commit/fda54f5d662d1ad8c5e4c8f095e38f3e00c43336))

## [8.7.4](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.3...v8.7.4) (2025-05-05)


### Bug Fixes

* rename messageKey in PublishMessageResponse Dto ([9ce67f6](https://github.com/camunda/camunda-8-js-sdk/commit/9ce67f677b157f6cf5f98f3a475f54a1a3c58418))
* update documentation around TLS and mTLS configuration, fixes [#395](https://github.com/camunda/camunda-8-js-sdk/issues/395) ([bcd4590](https://github.com/camunda/camunda-8-js-sdk/commit/bcd4590e62b9f8845320aba76a3f2c09ab1f8fc6))

## [8.7.3](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.2...v8.7.3) (2025-05-05)


### Bug Fixes

* change CorrelateMessageResponse Dto. fixes [#433](https://github.com/camunda/camunda-8-js-sdk/issues/433) ([c1f1fdc](https://github.com/camunda/camunda-8-js-sdk/commit/c1f1fdc76a1e88c5909993ed996d0ac00b656f3c))
* created self-signed cert valid for 100 years ([4bdbab9](https://github.com/camunda/camunda-8-js-sdk/commit/4bdbab95e9a1749a606ce84a34a42ae7c290c3b4))


### Features

* add Cookie auth to support c8run ([1ee9ad1](https://github.com/camunda/camunda-8-js-sdk/commit/1ee9ad1f0e1e77ddf3e86c7a7b00f2a95bcb2726))

## [8.7.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.1...v8.7.2) (2025-04-28)


### Features

* make activeJobs REST calls cancelable. fixes [#424](https://github.com/camunda/camunda-8-js-sdk/issues/424) ([7cf5e6d](https://github.com/camunda/camunda-8-js-sdk/commit/7cf5e6df1293db5a13e2427537576450e44f919c))

## [8.7.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.7.0...v8.7.1) (2025-04-23)


### Features

* add generic callApiEndpoint method ([384161e](https://github.com/camunda/camunda-8-js-sdk/commit/384161e050960f1965ceeea3f65aaf0258a42576))

# [8.7.0](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.38...v8.7.0) (2025-04-16)

## [8.6.38](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.37...v8.6.38) (2025-04-14)


### Bug Fixes

* **camunda8:** standardise on search for methods. closes [#363](https://github.com/camunda/camunda-8-js-sdk/issues/363) ([3e4deaa](https://github.com/camunda/camunda-8-js-sdk/commit/3e4deaaedbc3fb277eacd9be269b02736bca0a95))


### Features

* **camunda8:** implement evaluateDecision. closes [#291](https://github.com/camunda/camunda-8-js-sdk/issues/291) ([ff7ac09](https://github.com/camunda/camunda-8-js-sdk/commit/ff7ac090d343ab37678f0e2491900bdadec00409))

## [8.6.37](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.36...v8.6.37) (2025-04-10)


### Features

* **camunda8:** implement createDocumentLink. closes Implement Create Document link [#300](https://github.com/camunda/camunda-8-js-sdk/issues/300) ([e46114c](https://github.com/camunda/camunda-8-js-sdk/commit/e46114cadd225178d1449ff87e8b3f3af7f151ae))
* **camunda8:** implement modifyProcessInstance. closes Implement Modify process instance [#321](https://github.com/camunda/camunda-8-js-sdk/issues/321) ([20ca335](https://github.com/camunda/camunda-8-js-sdk/commit/20ca335120f9c82acc5e36cf5734f80533916659))
* **camunda8:** implement uploadDocuments. closes Implement Upload multiple documents [#404](https://github.com/camunda/camunda-8-js-sdk/issues/404) ([3f2ef14](https://github.com/camunda/camunda-8-js-sdk/commit/3f2ef14d26499200832cf37eb3dd8dfece70b578))

## [8.6.36](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.35...v8.6.36) (2025-04-09)


### Features

* **camunda8:** implement deleteDocument. closes Implement Delete document [#299](https://github.com/camunda/camunda-8-js-sdk/issues/299) ([18115c3](https://github.com/camunda/camunda-8-js-sdk/commit/18115c3796c15ddd8ebf8615f9ef287c7390a090))

## [8.6.35](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.34...v8.6.35) (2025-04-09)


### Bug Fixes

* **camunda8:** change userTask method names and set explict return types ([6fc8bee](https://github.com/camunda/camunda-8-js-sdk/commit/6fc8bee168a91398484299a43c314bb28ab4d36f))

## [8.6.34](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.33...v8.6.34) (2025-04-09)


### Bug Fixes

* **camunda8:** remove debugging console.error statement ([b4fa2b0](https://github.com/camunda/camunda-8-js-sdk/commit/b4fa2b033b89ca1b9a1dab7e617235f53ce49bd1))


### Features

* **camunda8:** implement uploadDocument and downloadDocument. fixes [#297](https://github.com/camunda/camunda-8-js-sdk/issues/297), fixes [#298](https://github.com/camunda/camunda-8-js-sdk/issues/298) ([b6b8b18](https://github.com/camunda/camunda-8-js-sdk/commit/b6b8b184212989d8a75fbf9bf6335965dc8ba222))

## [8.6.33](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.32...v8.6.33) (2025-03-17)


### Bug Fixes

* polling when maxJobsToActivate is reached ([0dc7fe4](https://github.com/camunda/camunda-8-js-sdk/commit/0dc7fe4be7073c4fb3c69522dbb793b8dc418738))

## [8.6.32](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.31...v8.6.32) (2025-03-06)


### Bug Fixes

* add tests and documentation for logging ([3522faf](https://github.com/camunda/camunda-8-js-sdk/commit/3522faf3cfcd0a7e80315ee1f49936ee5cd867f2)), closes [#397](https://github.com/camunda/camunda-8-js-sdk/issues/397)
* **operate:** allow paging for getVariablesforProcess ([b94532d](https://github.com/camunda/camunda-8-js-sdk/commit/b94532d3480764bc6abda795f85b8d8db382d517)), closes [#387](https://github.com/camunda/camunda-8-js-sdk/issues/387)

## [8.6.31](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.30...v8.6.31) (2025-03-05)


### Bug Fixes

* use ZEEBE_TOKEN_AUDIENCE if set ([ac46921](https://github.com/camunda/camunda-8-js-sdk/commit/ac46921f94a5c58fccc39553d9120eb82897b44e)), closes [#392](https://github.com/camunda/camunda-8-js-sdk/issues/392)

## [8.6.30](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.29...v8.6.30) (2025-03-05)


### Features

* **camunda8:** support getUserTask (8.8) ([26e0507](https://github.com/camunda/camunda-8-js-sdk/commit/26e0507e6d7b9f79802aa59df2520ffceb9126f9))
* **camunda:** implement getUserTaskVariables ([6dd59f6](https://github.com/camunda/camunda-8-js-sdk/commit/6dd59f681039802a26344732c9ddbf94a733c91d)), closes [#342](https://github.com/camunda/camunda-8-js-sdk/issues/342)
* **camunda:** implement searchProcessInstances. fixes [#320](https://github.com/camunda/camunda-8-js-sdk/issues/320) ([bce0eb1](https://github.com/camunda/camunda-8-js-sdk/commit/bce0eb1913764290ffd1427506052687b95b0586))

## [8.6.29](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.28...v8.6.29) (2025-03-04)


### Bug Fixes

* fix searchUserTasks ([a39ad05](https://github.com/camunda/camunda-8-js-sdk/commit/a39ad05f58c0ae43fb1145ac2716dac996b8d667))

## [8.6.28](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.27...v8.6.28) (2025-02-28)


### Bug Fixes

* **camunda8:** remove experimental decorator ([809fe9b](https://github.com/camunda/camunda-8-js-sdk/commit/809fe9b26fb5952188c6f1f88b8d6f376669d917))

## [8.6.27](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.26...v8.6.27) (2025-02-27)


### Bug Fixes

* **camunda8:** add optional tenantId to deployResourcesFromFiles ([dff868e](https://github.com/camunda/camunda-8-js-sdk/commit/dff868ea75eeac04c56c26ed3dc6e0e65bf6e201)), closes [#375](https://github.com/camunda/camunda-8-js-sdk/issues/375)


### Features

* **camunda8:** add queryVariables method. fixes [#343](https://github.com/camunda/camunda-8-js-sdk/issues/343) ([b361d71](https://github.com/camunda/camunda-8-js-sdk/commit/b361d71028b7d58afa88a3bbea21ef55117ca2a5))
* **camunda8:** implement findUserTasks ([d2baa70](https://github.com/camunda/camunda-8-js-sdk/commit/d2baa70502516cf1c18daed1253c079fd8a4e271)), closes [#341](https://github.com/camunda/camunda-8-js-sdk/issues/341)
* **camunda:** implement getUserTask. fixes [#339](https://github.com/camunda/camunda-8-js-sdk/issues/339) ([8bcb59a](https://github.com/camunda/camunda-8-js-sdk/commit/8bcb59affcc4b7ef9b1d4ff9a0f0a1500d3b257a))

## [8.6.26](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.25...v8.6.26) (2025-02-26)


### Bug Fixes

* **repo:** close backoff timers on worker close ([405595a](https://github.com/camunda/camunda-8-js-sdk/commit/405595a2d7c9a4ca6687204e83fce3614ccf5599))


### Features

* **camunda:** implement backoff on errors for REST job worker ([4895942](https://github.com/camunda/camunda-8-js-sdk/commit/4895942ac8a98caef346997d63d75a48a69a4b2c)), closes [#370](https://github.com/camunda/camunda-8-js-sdk/issues/370)

## [8.6.25](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.24...v8.6.25) (2025-02-17)


### Bug Fixes

* **zeebe:** throw UNAUTHENTICATED error on ActivateJobs from stream.error event ([d44029e](https://github.com/camunda/camunda-8-js-sdk/commit/d44029e3c181a9c458de91319db4631c67d4bdf7)), closes [#378](https://github.com/camunda/camunda-8-js-sdk/issues/378)

## [8.6.24](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.23...v8.6.24) (2025-02-12)


### Features

* **zeebe:** support 8.7 string entity keys (backwards-compatible with int64) ([1ea31f0](https://github.com/camunda/camunda-8-js-sdk/commit/1ea31f00bfcda30cc1e683abd75210c62e1c363d)), closes [#279](https://github.com/camunda/camunda-8-js-sdk/issues/279)

## [8.6.23](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.22...v8.6.23) (2025-02-05)


### Bug Fixes

* **oauth:** pass out full auth header from getToken method ([55a19b6](https://github.com/camunda/camunda-8-js-sdk/commit/55a19b65e0d2e9bcb6e168139ee1af0f8770d6f9)), closes [#367](https://github.com/camunda/camunda-8-js-sdk/issues/367)

## [8.6.22](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.21...v8.6.22) (2025-02-04)


### Features

* **zeebe:** implement backoff on UNAUTHENTICATED error for workers ([56c3c78](https://github.com/camunda/camunda-8-js-sdk/commit/56c3c78429e899aa139c92ac03bcf6d62e5d0850)), closes [#366](https://github.com/camunda/camunda-8-js-sdk/issues/366)

## [8.6.21](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.20...v8.6.21) (2025-01-24)


### Bug Fixes

* **zeebe:** move polling blocked log message to new verbose level. fixes [#356](https://github.com/camunda/camunda-8-js-sdk/issues/356) ([62c1459](https://github.com/camunda/camunda-8-js-sdk/commit/62c1459afcca368a6712d75ead4d7c4f1c68dd82))

## [8.6.20](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.19...v8.6.20) (2025-01-23)


### Bug Fixes

* **zeebe:** catch exception in fail job on unhandled exception in job handler. fixes [#351](https://github.com/camunda/camunda-8-js-sdk/issues/351) ([91e7213](https://github.com/camunda/camunda-8-js-sdk/commit/91e7213a8530ff8d8a46e2f71186e929b9154bc7))
* **zeebe:** do not fail jobs that are already not found ([448575c](https://github.com/camunda/camunda-8-js-sdk/commit/448575c6489811869cc88f7e6db7b0e9a7e201ec))

## [8.6.19](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.18...v8.6.19) (2025-01-23)


### Bug Fixes

* **zeebe:** propagate 'NOT_FOUND' error on job.complete(). fixes [#351](https://github.com/camunda/camunda-8-js-sdk/issues/351) ([59ebf5d](https://github.com/camunda/camunda-8-js-sdk/commit/59ebf5d91626927619d20e0656b2ed2ec538c0e4))

## [8.6.18](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.17...v8.6.18) (2024-12-20)


### Bug Fixes

* **modeler:** update SaaS URL for Modeler ([563e866](https://github.com/camunda/camunda-8-js-sdk/commit/563e86662f93daadc71fd433fbb4bce26de240c1))

## [8.6.17](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.16...v8.6.17) (2024-12-19)


### Bug Fixes

* **zeebe:** update JS GPRC lib dependency, release stream resources on end ([89fd95c](https://github.com/camunda/camunda-8-js-sdk/commit/89fd95c5d1c0a90d37bd18a80ffd62b017f9a8a0))

## [8.6.16](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.15...v8.6.16) (2024-11-15)


### Features

* **authorization:** add bearer token authorization ([f7d1ff3](https://github.com/camunda/camunda-8-js-sdk/commit/f7d1ff30e53583a09a1fc49ba258e9af7471b2dc))

## [8.6.15](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.14...v8.6.15) (2024-10-24)


### Bug Fixes

* **modeler:** correct HTTP methods for file methods. fixes [#269](https://github.com/camunda/camunda-8-js-sdk/issues/269) ([7819baa](https://github.com/camunda/camunda-8-js-sdk/commit/7819baa83124a4e0cdf40e33e55803a64a1b6282))

## [8.6.14](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.13...v8.6.14) (2024-10-24)


### Bug Fixes

* **camunda8:** correctly parse autostart parameter of JobWorker ([cb95946](https://github.com/camunda/camunda-8-js-sdk/commit/cb95946ab989f86a5992900292db2227be0824db))
* **camunda8:** type variables in async process instance start as never ([3055734](https://github.com/camunda/camunda-8-js-sdk/commit/3055734f521341aff850b6545c8919d38d9642a6))
* **lossless-parser:** correctly parse number array ([d69729a](https://github.com/camunda/camunda-8-js-sdk/commit/d69729ad07f05649a59b9f89282dc01f87698b4f)), closes [#258](https://github.com/camunda/camunda-8-js-sdk/issues/258)
* **lossless-parser:** throw on encountering Date, Map, or Set ([bb5d8ea](https://github.com/camunda/camunda-8-js-sdk/commit/bb5d8ea666d7d6f0da9823f7ecf0a187708eab6b)), closes [#254](https://github.com/camunda/camunda-8-js-sdk/issues/254)
* **zeebe:** do not override explicit ZEEBE_GRPC_ADDRESS with default ZEEBE_ADDRESS ([cd6080f](https://github.com/camunda/camunda-8-js-sdk/commit/cd6080fcaa8073e4655f72127af30db11f9ef743)), closes [#245](https://github.com/camunda/camunda-8-js-sdk/issues/245)
* **zeebe:** throw on client if array passed as variables to CompleteJob ([40a6316](https://github.com/camunda/camunda-8-js-sdk/commit/40a63164a7588ea81fa0df16e9538fa5366dc049)), closes [#247](https://github.com/camunda/camunda-8-js-sdk/issues/247)


### Features

* **camunda8:** add C8RestClient ([8e93c92](https://github.com/camunda/camunda-8-js-sdk/commit/8e93c92bfb3684b530428f253f5de05c771e4215)), closes [#235](https://github.com/camunda/camunda-8-js-sdk/issues/235)
* **camunda8:** add modifyAuthorization method ([0d97f68](https://github.com/camunda/camunda-8-js-sdk/commit/0d97f681ad1a1c9d295f43c83f342b6eb5cfa3da))
* **camunda8:** complete deployResources feature ([8043ac9](https://github.com/camunda/camunda-8-js-sdk/commit/8043ac9afe5f6f6ec6e8bdfa90dbf40def6a0510))
* **camunda8:** implement createProcessInstanceWithResult ([4ec4fa1](https://github.com/camunda/camunda-8-js-sdk/commit/4ec4fa1b6c1554bbac04ba275da3e1bba2dbf012))
* **camunda8:** implement deleteResource over REST ([1dcb101](https://github.com/camunda/camunda-8-js-sdk/commit/1dcb1019b96788d952363d776a6976b99588d541)), closes [#251](https://github.com/camunda/camunda-8-js-sdk/issues/251)
* **camunda8:** implement deployResources REST API ([debd212](https://github.com/camunda/camunda-8-js-sdk/commit/debd2122e713e98e3180a0bf0b200a1560788b81))
* **camunda8:** implement publishMessage over REST ([057a9fe](https://github.com/camunda/camunda-8-js-sdk/commit/057a9feaf1a6e13011f130ca201947e39de54390)), closes [#250](https://github.com/camunda/camunda-8-js-sdk/issues/250)
* **camunda8:** support broadcastSignal over REST ([43f82a4](https://github.com/camunda/camunda-8-js-sdk/commit/43f82a44f69f0217003775d422c741555f1fe6b1)), closes [#248](https://github.com/camunda/camunda-8-js-sdk/issues/248)
* **camunda8:** support pluggable winston logging for C8RestClient ([d41d3f8](https://github.com/camunda/camunda-8-js-sdk/commit/d41d3f8de6afe2d8d3daff207519a52119f26cc9))
* **camunda8:** support updateElementInstanceVariables ([7de82b7](https://github.com/camunda/camunda-8-js-sdk/commit/7de82b75c9a08fe34444d549e3c9c2077a768b3e)), closes [#249](https://github.com/camunda/camunda-8-js-sdk/issues/249)
* **repo:** support passing middleware ([1b7715e](https://github.com/camunda/camunda-8-js-sdk/commit/1b7715e0e2778b058d7e0d8b67f29a27007c06af)), closes [#261](https://github.com/camunda/camunda-8-js-sdk/issues/261)
* **zeebe:** add operationReference field to gRPC methods ([2e5af66](https://github.com/camunda/camunda-8-js-sdk/commit/2e5af662f9ecc1ee23115eb4232e0633afde3efe)), closes [#237](https://github.com/camunda/camunda-8-js-sdk/issues/237)
* **zeebe:** create and cancel process instances over REST ([a49d217](https://github.com/camunda/camunda-8-js-sdk/commit/a49d217f95b9b550bedd9af79fe9d950ad31add2))
* **zeebe:** lossless parse REST variables and customheaders ([f19a252](https://github.com/camunda/camunda-8-js-sdk/commit/f19a2520778836c34a3685d584c4969380672804)), closes [#244](https://github.com/camunda/camunda-8-js-sdk/issues/244)

## [8.6.13](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.12...v8.6.13) (2024-09-26)


### Bug Fixes

* **operate:** use post request for decision definitions and decision instances endpoints ([419ae56](https://github.com/camunda/camunda-8-js-sdk/commit/419ae568327bc1451e6ea59ec3f0c340b80758f9))

## [8.6.12](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.11...v8.6.12) (2024-08-30)


### Bug Fixes

* **zeebe:** fail job if variables cannot be parsed ([495c05e](https://github.com/camunda/camunda-8-js-sdk/commit/495c05ef22254f231349dc432982aa9419e8c91d)), closes [#236](https://github.com/camunda/camunda-8-js-sdk/issues/236)

## [8.6.11](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.10...v8.6.11) (2024-08-21)


### Bug Fixes

* **oauth:** uri encode clientId and clientSecret ([dd8583a](https://github.com/camunda/camunda-8-js-sdk/commit/dd8583a87c3cabb74997649242ab574b00b76119)), closes [#230](https://github.com/camunda/camunda-8-js-sdk/issues/230)

## [8.6.10](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.9...v8.6.10) (2024-07-29)


### Bug Fixes

* **lossless-parser:** correctly handle null in objects ([b712651](https://github.com/camunda/camunda-8-js-sdk/commit/b7126518dd0ac92e592cad66e88e3d8f6611d22f)), closes [#212](https://github.com/camunda/camunda-8-js-sdk/issues/212)

## [8.6.9](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.8...v8.6.9) (2024-07-29)


### Features

* **zeebe:** add support for ZEEBE_INSECURE_CONNECTION env var ([ed14df8](https://github.com/camunda/camunda-8-js-sdk/commit/ed14df894557a248b4dc958f13fd353d3163edb2))
* **zeebe:** fix activate jobs stream ([68bb5da](https://github.com/camunda/camunda-8-js-sdk/commit/68bb5daf7cad65a68e826f13277b3da366c35851))

## [8.6.8](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.7...v8.6.8) (2024-07-12)


### Bug Fixes

* **admin:** fix members endpoint - fixes [#206](https://github.com/camunda/camunda-8-js-sdk/issues/206) ([#208](https://github.com/camunda/camunda-8-js-sdk/issues/208)) ([19c4c5c](https://github.com/camunda/camunda-8-js-sdk/commit/19c4c5c712c53441eeff108f0517389f9eaf4486)), closes [#207](https://github.com/camunda/camunda-8-js-sdk/issues/207)
* **camunda8:** respect CAMUNDA_OAUTH_STRATEGY ([#209](https://github.com/camunda/camunda-8-js-sdk/issues/209)) ([70c9954](https://github.com/camunda/camunda-8-js-sdk/commit/70c995414ac49f2ee06861c88968b93c2d6a7b95))

## [8.6.7](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.6...v8.6.7) (2024-06-21)


### Bug Fixes

* **docs:** update config for disabling authentication ([df5879f](https://github.com/camunda/camunda-8-js-sdk/commit/df5879ffb8821e2c49e8e71c5a7cedc40e53c869))

## [8.6.6](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.5...v8.6.6) (2024-06-18)


### Bug Fixes

* **optimize:** fix exportReportDefinitions REST call path ([e5f5da7](https://github.com/camunda/camunda-8-js-sdk/commit/e5f5da7bf1e5ab7752fad622d150ec3dfe3e8f47)), closes [#192](https://github.com/camunda/camunda-8-js-sdk/issues/192)

## [8.6.5](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.4...v8.6.5) (2024-06-18)


### Bug Fixes

* **zeebe:** add headers to all REST method calls ([9b99177](https://github.com/camunda/camunda-8-js-sdk/commit/9b991775536ca838d1b278f81126404373389a17))

## [8.6.4](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.3...v8.6.4) (2024-06-13)


### Bug Fixes

* **optimize:** fix labelVariables method ([b8a4c68](https://github.com/camunda/camunda-8-js-sdk/commit/b8a4c68fb42435f0e8c9af22a68cd00dfc0989b1))

## [8.6.3](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.2...v8.6.3) (2024-06-13)


### Bug Fixes

* specify the correct audience when getting an Optimize auth token ([#185](https://github.com/camunda/camunda-8-js-sdk/issues/185)) ([a852281](https://github.com/camunda/camunda-8-js-sdk/commit/a852281c7f5e902f8199282723b2d35efdaaa846))

## [8.6.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.1...v8.6.2) (2024-06-12)


### Bug Fixes

* **zeebe:** security fix for grpc-js dependency update ([#180](https://github.com/camunda/camunda-8-js-sdk/issues/180)) ([f43d956](https://github.com/camunda/camunda-8-js-sdk/commit/f43d956744e025253aa916855999371ca0cebebb))


### Features

* **zeebe:** add deployResources method ([165862f](https://github.com/camunda/camunda-8-js-sdk/commit/165862f58921c51124d0df38cb51db173c19fd00)), closes [#173](https://github.com/camunda/camunda-8-js-sdk/issues/173)
* **zeebe:** add multi-tenant support to workers ([#175](https://github.com/camunda/camunda-8-js-sdk/issues/175)) ([28450a5](https://github.com/camunda/camunda-8-js-sdk/commit/28450a50a2cbb70b5f8958e1d94c144f817a8758)), closes [#171](https://github.com/camunda/camunda-8-js-sdk/issues/171)
* **zeebe:** add updateJobTimeout method ([#172](https://github.com/camunda/camunda-8-js-sdk/issues/172)) ([5eff624](https://github.com/camunda/camunda-8-js-sdk/commit/5eff6243dbce5fd296daeedcf6191ef4c4d4b609)), closes [#171](https://github.com/camunda/camunda-8-js-sdk/issues/171)
* **zeebe:** support StreamActivatedJobs RPC ([#160](https://github.com/camunda/camunda-8-js-sdk/issues/160)) ([258296a](https://github.com/camunda/camunda-8-js-sdk/commit/258296aef6558f976dd299ea977514d58d822141)), closes [#17](https://github.com/camunda/camunda-8-js-sdk/issues/17)

## [8.6.1-alpha.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.1-alpha.1...v8.6.1-alpha.2) (2024-06-12)

### Bug Fixes

- **zeebe:** security fix for grpc-js dependency update ([#180](https://github.com/camunda/camunda-8-js-sdk/issues/180)) ([f43d956](https://github.com/camunda/camunda-8-js-sdk/commit/f43d956744e025253aa916855999371ca0cebebb))

## [8.6.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.0...v8.6.1) (2024-06-10)

## [8.6.1-alpha.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.6.0...v8.6.1-alpha.1) (2024-06-07)

### Features

- **zeebe:** add multi-tenant support to workers ([#175](https://github.com/camunda/camunda-8-js-sdk/issues/175)) ([28450a5](https://github.com/camunda/camunda-8-js-sdk/commit/28450a50a2cbb70b5f8958e1d94c144f817a8758)), closes [#171](https://github.com/camunda/camunda-8-js-sdk/issues/171)
- **zeebe:** add updateJobTimeout method ([#172](https://github.com/camunda/camunda-8-js-sdk/issues/172)) ([5eff624](https://github.com/camunda/camunda-8-js-sdk/commit/5eff6243dbce5fd296daeedcf6191ef4c4d4b609)), closes [#171](https://github.com/camunda/camunda-8-js-sdk/issues/171)
- **zeebe:** support StreamActivatedJobs RPC ([#160](https://github.com/camunda/camunda-8-js-sdk/issues/160)) ([258296a](https://github.com/camunda/camunda-8-js-sdk/commit/258296aef6558f976dd299ea977514d58d822141)), closes [#17](https://github.com/camunda/camunda-8-js-sdk/issues/17)

# [8.6.0](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.4...v8.6.0) (2024-06-05)

## [8.5.5-alpha.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.4...v8.5.5-alpha.1) (2024-06-05)

### Features

- **zeebe:** add updateJobTimeout method ([#172](https://github.com/camunda/camunda-8-js-sdk/issues/172)) ([5eff624](https://github.com/camunda/camunda-8-js-sdk/commit/5eff6243dbce5fd296daeedcf6191ef4c4d4b609)), closes [#171](https://github.com/camunda/camunda-8-js-sdk/issues/171)
- **zeebe:** support StreamActivatedJobs RPC ([#160](https://github.com/camunda/camunda-8-js-sdk/issues/160)) ([258296a](https://github.com/camunda/camunda-8-js-sdk/commit/258296aef6558f976dd299ea977514d58d822141)), closes [#17](https://github.com/camunda/camunda-8-js-sdk/issues/17)

## [8.5.4](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.3...v8.5.4) (2024-05-24)

### Bug Fixes

- **issue137:** support ZEEBE_REST_ADDRESS and ZEEBE_GRPC_ADDRESS environment variables ([#159](https://github.com/camunda/camunda-8-js-sdk/issues/159)) ([41fdca0](https://github.com/camunda/camunda-8-js-sdk/commit/41fdca0fcc9f7221c915dc82317e6609bb5106ee))
- **oauth:** correctly expire cached token ([#164](https://github.com/camunda/camunda-8-js-sdk/issues/164)) ([c86e550](https://github.com/camunda/camunda-8-js-sdk/commit/c86e550747f23205dac9fe199a38217b3a583f76)), closes [#163](https://github.com/camunda/camunda-8-js-sdk/issues/163)

### Features

- **camunda8:** support Basic Auth ([d6acdfd](https://github.com/camunda/camunda-8-js-sdk/commit/d6acdfddcef8413226e3366932df5b6bda234e47)), closes [#165](https://github.com/camunda/camunda-8-js-sdk/issues/165)
- **oauth:** add conditional loading of client key and cert for getting a token ([#161](https://github.com/camunda/camunda-8-js-sdk/issues/161)) ([f05aa8a](https://github.com/camunda/camunda-8-js-sdk/commit/f05aa8aa1670cbceb40a54b3bf4a8e40228ad2c3))
- **zeebe:** support Zeebe User Task REST API ([022607b](https://github.com/camunda/camunda-8-js-sdk/commit/022607bf77077fdacffdce7f26ce580360d54bf3)), closes [#34](https://github.com/camunda/camunda-8-js-sdk/issues/34)

## [8.5.4-alpha.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.4-alpha.1...v8.5.4-alpha.2) (2024-05-22)

### Bug Fixes

- **issue137:** support ZEEBE_REST_ADDRESS and ZEEBE_GRPC_ADDRESS environment variables ([#159](https://github.com/camunda/camunda-8-js-sdk/issues/159)) ([41fdca0](https://github.com/camunda/camunda-8-js-sdk/commit/41fdca0fcc9f7221c915dc82317e6609bb5106ee))
- **oauth:** correctly expire cached token ([#164](https://github.com/camunda/camunda-8-js-sdk/issues/164)) ([c86e550](https://github.com/camunda/camunda-8-js-sdk/commit/c86e550747f23205dac9fe199a38217b3a583f76)), closes [#163](https://github.com/camunda/camunda-8-js-sdk/issues/163)

### Features

- **zeebe:** support Zeebe User Task REST API ([022607b](https://github.com/camunda/camunda-8-js-sdk/commit/022607bf77077fdacffdce7f26ce580360d54bf3)), closes [#34](https://github.com/camunda/camunda-8-js-sdk/issues/34)

## [8.5.4-alpha.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.3...v8.5.4-alpha.1) (2024-05-15)

### Features

- **oauth:** add conditional loading of client key and cert for getting a token ([#161](https://github.com/camunda/camunda-8-js-sdk/issues/161)) ([f05aa8a](https://github.com/camunda/camunda-8-js-sdk/commit/f05aa8aa1670cbceb40a54b3bf4a8e40228ad2c3))

## [8.5.3](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.2...v8.5.3) (2024-05-08)

### Bug Fixes

- **repo:** fix example in README ([#154](https://github.com/camunda/camunda-8-js-sdk/issues/154)) ([#155](https://github.com/camunda/camunda-8-js-sdk/issues/155)) ([4fb36d7](https://github.com/camunda/camunda-8-js-sdk/commit/4fb36d726dc4dc91ed018955eb4548a5f3fe4bff)), closes [#153](https://github.com/camunda/camunda-8-js-sdk/issues/153)

## [8.5.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.1...v8.5.2) (2024-05-07)

### Bug Fixes

- **zeebe:** waitForReady deadline not miliseconds, but date ([#148](https://github.com/camunda/camunda-8-js-sdk/issues/148)) ([12db206](https://github.com/camunda/camunda-8-js-sdk/commit/12db206b71a85c8a68a838488da1572efa416d67))

### Features

- **repo:** add CAMUNDA_CUSTOM_ROOT_CERT_STRING parameter ([7451a66](https://github.com/camunda/camunda-8-js-sdk/commit/7451a669df42930405aa7b155a3f9e00be30ab55)), closes [#151](https://github.com/camunda/camunda-8-js-sdk/issues/151) [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150) [#146](https://github.com/camunda/camunda-8-js-sdk/issues/146) [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142) [#151](https://github.com/camunda/camunda-8-js-sdk/issues/151) [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150) [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142) [#151](https://github.com/camunda/camunda-8-js-sdk/issues/151) [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150) [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142) [#151](https://github.com/camunda/camunda-8-js-sdk/issues/151) [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150) [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142) [#151](https://github.com/camunda/camunda-8-js-sdk/issues/151) [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150) [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142) [#151](https://github.com/camunda/camunda-8-js-sdk/issues/151) [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150) [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142)

### Reverts

- Revert "fix(zeebe): waitForReady deadline not miliseconds, but date (#148)" (#149) ([f8c0c7d](https://github.com/camunda/camunda-8-js-sdk/commit/f8c0c7d6131b20036f0b400ddca6eb85939100d2)), closes [#148](https://github.com/camunda/camunda-8-js-sdk/issues/148) [#149](https://github.com/camunda/camunda-8-js-sdk/issues/149)

## [8.5.2-alpha.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.1...v8.5.2-alpha.1) (2024-05-07)

### Bug Fixes

- **zeebe:** fix waitForReady deadline ([#151](https://github.com/camunda/camunda-8-js-sdk/issues/151)) ([a88ea2e](https://github.com/camunda/camunda-8-js-sdk/commit/a88ea2e48ab268890dae11917ef065ef4a451cec)), closes [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150)

### Features

- **repo:** add CAMUNDA_CUSTOM_ROOT_CERT_STRING parameter ([#146](https://github.com/camunda/camunda-8-js-sdk/issues/146)) ([f828a95](https://github.com/camunda/camunda-8-js-sdk/commit/f828a95a992168a77d477ec987cd50a7c3b96112)), closes [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142) [#151](https://github.com/camunda/camunda-8-js-sdk/issues/151) [#150](https://github.com/camunda/camunda-8-js-sdk/issues/150) [#142](https://github.com/camunda/camunda-8-js-sdk/issues/142)

## [8.5.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0...v8.5.1) (2024-05-05)

### Features

- **repo:** load system certs when custom cert specified ([#144](https://github.com/camunda/camunda-8-js-sdk/issues/144)) ([8a47d5e](https://github.com/camunda/camunda-8-js-sdk/commit/8a47d5e9970dd7667d242fb696ca30150b725196)), closes [#131](https://github.com/camunda/camunda-8-js-sdk/issues/131) [#131](https://github.com/camunda/camunda-8-js-sdk/issues/131) [#131](https://github.com/camunda/camunda-8-js-sdk/issues/131) [#135](https://github.com/camunda/camunda-8-js-sdk/issues/135) [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125) [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125) [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125) [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125) [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125) [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125) [#138](https://github.com/camunda/camunda-8-js-sdk/issues/138) [#136](https://github.com/camunda/camunda-8-js-sdk/issues/136) [#136](https://github.com/camunda/camunda-8-js-sdk/issues/136) [#136](https://github.com/camunda/camunda-8-js-sdk/issues/136) [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#141](https://github.com/camunda/camunda-8-js-sdk/issues/141) [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#141](https://github.com/camunda/camunda-8-js-sdk/issues/141) [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#141](https://github.com/camunda/camunda-8-js-sdk/issues/141)

## [8.5.1-alpha.4](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.1-alpha.3...v8.5.1-alpha.4) (2024-05-03)

### Features

- **repo:** load system certs when custom cert specified ([afce0a7](https://github.com/camunda/camunda-8-js-sdk/commit/afce0a78ec81294ab4282ea1cd1e1d80d9244f71)), closes [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#139](https://github.com/camunda/camunda-8-js-sdk/issues/139) [#141](https://github.com/camunda/camunda-8-js-sdk/issues/141)

## [8.5.1-alpha.3](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.1-alpha.2...v8.5.1-alpha.3) (2024-04-29)

### Bug Fixes

- **tasklist:** correct default value of includeVariables parameter in tasklist variables search ([#136](https://github.com/camunda/camunda-8-js-sdk/issues/136)) ([23af921](https://github.com/camunda/camunda-8-js-sdk/commit/23af921769f67e77c68182f3efb2d7509560e514))

## [8.5.1-alpha.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.1-alpha.1...v8.5.1-alpha.2) (2024-04-20)

### Features

- **repo:** add status code to HTTPError type ([#135](https://github.com/camunda/camunda-8-js-sdk/issues/135)) ([cfea141](https://github.com/camunda/camunda-8-js-sdk/commit/cfea14173c4ddc005df142cc139db961a235cd53)), closes [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125) [#125](https://github.com/camunda/camunda-8-js-sdk/issues/125)

## [8.5.1-alpha.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0...v8.5.1-alpha.1) (2024-04-09)

### Features

- **repo:** add stack traces to async REST errors ([#131](https://github.com/camunda/camunda-8-js-sdk/issues/131)) ([ef8d9c6](https://github.com/camunda/camunda-8-js-sdk/commit/ef8d9c6b58a8864d66b6f8f1b008256cc9acf187))

# [8.5.0](https://github.com/camunda/camunda-8-js-sdk/compare/v8.4.1...v8.5.0) (2024-04-08)

### Bug Fixes

- **issue118:** add smoke test and type surface tests ([fe0c709](https://github.com/camunda/camunda-8-js-sdk/commit/fe0c70925cf3df610b049e776eed5bffe56ef604)), closes [#118](https://github.com/camunda/camunda-8-js-sdk/issues/118)
- **repo:** add note on "supported" ([#107](https://github.com/camunda/camunda-8-js-sdk/issues/107)) ([fc45d61](https://github.com/camunda/camunda-8-js-sdk/commit/fc45d618bc459a06fbf76bd6907511d08e1f583b)), closes [#70](https://github.com/camunda/camunda-8-js-sdk/issues/70)
- **repo:** make fix type commits release a new package ([ded83cf](https://github.com/camunda/camunda-8-js-sdk/commit/ded83cfaf437a2f62a5ef134d7616538facda614))
- **repo:** only git commit on npm publish success ([9012764](https://github.com/camunda/camunda-8-js-sdk/commit/901276451845c5dbd926af0a6563d5564d3e87b9))
- **repo:** use ts-patch to transform module mapping in output ([#112](https://github.com/camunda/camunda-8-js-sdk/issues/112)) ([7efdcf3](https://github.com/camunda/camunda-8-js-sdk/commit/7efdcf3478a0d68b4f1cbc62c1526ba7275008b0)), closes [#110](https://github.com/camunda/camunda-8-js-sdk/issues/110)

## [8.4.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.4.0...v8.4.1) (2024-04-08)

### Features

- **oauth:** support optional scope in OAuth request ([#25](https://github.com/camunda/camunda-8-js-sdk/issues/25)) ([0451b80](https://github.com/camunda/camunda-8-js-sdk/commit/0451b802594f76518830b9bdff515d67fc0231b9))
- **operate:** add multitenant support and lossless Json parsing ([#82](https://github.com/camunda/camunda-8-js-sdk/issues/82)) ([cf49a71](https://github.com/camunda/camunda-8-js-sdk/commit/cf49a717e2632af845529b3c1fde85ee1b0b347b)), closes [#78](https://github.com/camunda/camunda-8-js-sdk/issues/78) [#67](https://github.com/camunda/camunda-8-js-sdk/issues/67)
- **repo:** add enhanced debug output for http errors ([#88](https://github.com/camunda/camunda-8-js-sdk/issues/88)) ([881b039](https://github.com/camunda/camunda-8-js-sdk/commit/881b03965cc37431885a76291f7c0aa762f26227)), closes [#87](https://github.com/camunda/camunda-8-js-sdk/issues/87)
- **tasklist:** add multitenant support to tasklist ([#85](https://github.com/camunda/camunda-8-js-sdk/issues/85)) ([46bb564](https://github.com/camunda/camunda-8-js-sdk/commit/46bb564365afc3bc6758cd436490a459708128e6))
- **zeebe:** add MigrateProcessInstance ([#97](https://github.com/camunda/camunda-8-js-sdk/issues/97)) ([2a9a123](https://github.com/camunda/camunda-8-js-sdk/commit/2a9a1232b160962f86b9450edd9047a8a933068a)), closes [#49](https://github.com/camunda/camunda-8-js-sdk/issues/49)
- **zeebe:** implement deleteResource ([#73](https://github.com/camunda/camunda-8-js-sdk/issues/73)) ([0cd08b7](https://github.com/camunda/camunda-8-js-sdk/commit/0cd08b7b85d23ab44e42b36b2d9b48c1cfcb8c63))
- **zeebe:** implement lossless parsing of job payload ([#95](https://github.com/camunda/camunda-8-js-sdk/issues/95)) ([57f3ea8](https://github.com/camunda/camunda-8-js-sdk/commit/57f3ea85d4cf86256301f5f2a9bcead09c01a199)), closes [#81](https://github.com/camunda/camunda-8-js-sdk/issues/81)
- **zeebe:** normalise useragent, thread config ([#94](https://github.com/camunda/camunda-8-js-sdk/issues/94)) ([c1c4211](https://github.com/camunda/camunda-8-js-sdk/commit/c1c4211db11173c56d2410f489503ef9acf185f2))
- **zeebe:** remove deployProcess method ([#71](https://github.com/camunda/camunda-8-js-sdk/issues/71)) ([6cb98f0](https://github.com/camunda/camunda-8-js-sdk/commit/6cb98f0ff3baf643015bacfa690f4f119caf6083))

# [8.5.0-alpha.6](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0-alpha.5...v8.5.0-alpha.6) (2024-04-08)

### Bug Fixes

- **issue118:** add smoke test and type surface tests ([fe0c709](https://github.com/camunda/camunda-8-js-sdk/commit/fe0c70925cf3df610b049e776eed5bffe56ef604)), closes [#118](https://github.com/camunda/camunda-8-js-sdk/issues/118)

# [8.5.0-alpha.5](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0-alpha.4...v8.5.0-alpha.5) (2024-04-07)

### Bug Fixes

- **repo:** make fix type commits release a new package ([ded83cf](https://github.com/camunda/camunda-8-js-sdk/commit/ded83cfaf437a2f62a5ef134d7616538facda614))

# [8.5.0-alpha.4](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0-alpha.3...v8.5.0-alpha.4) (2024-04-05)

### Bug Fixes

- **repo:** use ts-patch to transform module mapping in output ([#112](https://github.com/camunda/camunda-8-js-sdk/issues/112)) ([7efdcf3](https://github.com/camunda/camunda-8-js-sdk/commit/7efdcf3478a0d68b4f1cbc62c1526ba7275008b0)), closes [#110](https://github.com/camunda/camunda-8-js-sdk/issues/110)

# [8.5.0-alpha.3](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0-alpha.2...v8.5.0-alpha.3) (2024-04-05)

### Bug Fixes

- **repo:** only git commit on npm publish success ([9012764](https://github.com/camunda/camunda-8-js-sdk/commit/901276451845c5dbd926af0a6563d5564d3e87b9))

# [8.5.0-alpha.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0-alpha.1...v8.5.0-alpha.2) (2024-04-05)

### Bug Fixes

- **repo:** add note on "supported" ([#107](https://github.com/camunda/camunda-8-js-sdk/issues/107)) ([fc45d61](https://github.com/camunda/camunda-8-js-sdk/commit/fc45d618bc459a06fbf76bd6907511d08e1f583b)), closes [#70](https://github.com/camunda/camunda-8-js-sdk/issues/70)

# [8.5.0-alpha.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.4.0...v8.5.0-alpha.1) (2024-04-04)

### Features

- **oauth:** support optional scope in OAuth request ([#25](https://github.com/camunda/camunda-8-js-sdk/issues/25)) ([0451b80](https://github.com/camunda/camunda-8-js-sdk/commit/0451b802594f76518830b9bdff515d67fc0231b9))
- **operate:** add multitenant support and lossless Json parsing ([#82](https://github.com/camunda/camunda-8-js-sdk/issues/82)) ([cf49a71](https://github.com/camunda/camunda-8-js-sdk/commit/cf49a717e2632af845529b3c1fde85ee1b0b347b)), closes [#78](https://github.com/camunda/camunda-8-js-sdk/issues/78) [#67](https://github.com/camunda/camunda-8-js-sdk/issues/67)
- **repo:** add enhanced debug output for http errors ([#88](https://github.com/camunda/camunda-8-js-sdk/issues/88)) ([881b039](https://github.com/camunda/camunda-8-js-sdk/commit/881b03965cc37431885a76291f7c0aa762f26227)), closes [#87](https://github.com/camunda/camunda-8-js-sdk/issues/87)
- **tasklist:** add multitenant support to tasklist ([#85](https://github.com/camunda/camunda-8-js-sdk/issues/85)) ([46bb564](https://github.com/camunda/camunda-8-js-sdk/commit/46bb564365afc3bc6758cd436490a459708128e6))
- **zeebe:** add MigrateProcessInstance ([#97](https://github.com/camunda/camunda-8-js-sdk/issues/97)) ([2a9a123](https://github.com/camunda/camunda-8-js-sdk/commit/2a9a1232b160962f86b9450edd9047a8a933068a)), closes [#49](https://github.com/camunda/camunda-8-js-sdk/issues/49)
- **zeebe:** implement deleteResource ([#73](https://github.com/camunda/camunda-8-js-sdk/issues/73)) ([0cd08b7](https://github.com/camunda/camunda-8-js-sdk/commit/0cd08b7b85d23ab44e42b36b2d9b48c1cfcb8c63))
- **zeebe:** implement lossless parsing of job payload ([#95](https://github.com/camunda/camunda-8-js-sdk/issues/95)) ([57f3ea8](https://github.com/camunda/camunda-8-js-sdk/commit/57f3ea85d4cf86256301f5f2a9bcead09c01a199)), closes [#81](https://github.com/camunda/camunda-8-js-sdk/issues/81)
- **zeebe:** normalise useragent, thread config ([#94](https://github.com/camunda/camunda-8-js-sdk/issues/94)) ([c1c4211](https://github.com/camunda/camunda-8-js-sdk/commit/c1c4211db11173c56d2410f489503ef9acf185f2))
- **zeebe:** remove deployProcess method ([#71](https://github.com/camunda/camunda-8-js-sdk/issues/71)) ([6cb98f0](https://github.com/camunda/camunda-8-js-sdk/commit/6cb98f0ff3baf643015bacfa690f4f119caf6083))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 8.4.0 (2024-02-01)

### Bug Fixes

- REST getForm returns a flattened shape of the form compared to GraphQL ([58ec6d1](https://github.com/camunda/camunda-8-js-sdk/commit/58ec6d1de08e39cb4699326b67ebbf6a398fb30f))

### Features

- configure specs to import configuration from .env file ([00804d1](https://github.com/camunda/camunda-8-js-sdk/commit/00804d132c0e1840846a5af9eee26351f9580c74))
- **tasklist:** enable multiple clusters via constructor options ([#16](https://github.com/camunda/camunda-8-js-sdk/issues/16)) ([fb12e25](https://github.com/camunda/camunda-8-js-sdk/commit/fb12e258321e6bba03d11d38119c740f0e242773))
