# [8.5.0-alpha.2](https://github.com/camunda/camunda-8-js-sdk/compare/v8.5.0-alpha.1...v8.5.0-alpha.2) (2024-04-05)


### Bug Fixes

* **repo:** add note on "supported" ([#107](https://github.com/camunda/camunda-8-js-sdk/issues/107)) ([fc45d61](https://github.com/camunda/camunda-8-js-sdk/commit/fc45d618bc459a06fbf76bd6907511d08e1f583b)), closes [#70](https://github.com/camunda/camunda-8-js-sdk/issues/70)

# [8.5.0-alpha.1](https://github.com/camunda/camunda-8-js-sdk/compare/v8.4.0...v8.5.0-alpha.1) (2024-04-04)


### Features

* **oauth:** support optional scope in OAuth request ([#25](https://github.com/camunda/camunda-8-js-sdk/issues/25)) ([0451b80](https://github.com/camunda/camunda-8-js-sdk/commit/0451b802594f76518830b9bdff515d67fc0231b9))
* **operate:** add multitenant support and lossless Json parsing ([#82](https://github.com/camunda/camunda-8-js-sdk/issues/82)) ([cf49a71](https://github.com/camunda/camunda-8-js-sdk/commit/cf49a717e2632af845529b3c1fde85ee1b0b347b)), closes [#78](https://github.com/camunda/camunda-8-js-sdk/issues/78) [#67](https://github.com/camunda/camunda-8-js-sdk/issues/67)
* **repo:** add enhanced debug output for http errors ([#88](https://github.com/camunda/camunda-8-js-sdk/issues/88)) ([881b039](https://github.com/camunda/camunda-8-js-sdk/commit/881b03965cc37431885a76291f7c0aa762f26227)), closes [#87](https://github.com/camunda/camunda-8-js-sdk/issues/87)
* **tasklist:** add multitenant support to tasklist ([#85](https://github.com/camunda/camunda-8-js-sdk/issues/85)) ([46bb564](https://github.com/camunda/camunda-8-js-sdk/commit/46bb564365afc3bc6758cd436490a459708128e6))
* **zeebe:** add MigrateProcessInstance ([#97](https://github.com/camunda/camunda-8-js-sdk/issues/97)) ([2a9a123](https://github.com/camunda/camunda-8-js-sdk/commit/2a9a1232b160962f86b9450edd9047a8a933068a)), closes [#49](https://github.com/camunda/camunda-8-js-sdk/issues/49)
* **zeebe:** implement deleteResource ([#73](https://github.com/camunda/camunda-8-js-sdk/issues/73)) ([0cd08b7](https://github.com/camunda/camunda-8-js-sdk/commit/0cd08b7b85d23ab44e42b36b2d9b48c1cfcb8c63))
* **zeebe:** implement lossless parsing of job payload ([#95](https://github.com/camunda/camunda-8-js-sdk/issues/95)) ([57f3ea8](https://github.com/camunda/camunda-8-js-sdk/commit/57f3ea85d4cf86256301f5f2a9bcead09c01a199)), closes [#81](https://github.com/camunda/camunda-8-js-sdk/issues/81)
* **zeebe:** normalise useragent, thread config ([#94](https://github.com/camunda/camunda-8-js-sdk/issues/94)) ([c1c4211](https://github.com/camunda/camunda-8-js-sdk/commit/c1c4211db11173c56d2410f489503ef9acf185f2))
* **zeebe:** remove deployProcess method ([#71](https://github.com/camunda/camunda-8-js-sdk/issues/71)) ([6cb98f0](https://github.com/camunda/camunda-8-js-sdk/commit/6cb98f0ff3baf643015bacfa690f4f119caf6083))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 8.4.0 (2024-02-01)

### Bug Fixes

- REST getForm returns a flattened shape of the form compared to GraphQL ([58ec6d1](https://github.com/camunda/camunda-8-js-sdk/commit/58ec6d1de08e39cb4699326b67ebbf6a398fb30f))

### Features

- configure specs to import configuration from .env file ([00804d1](https://github.com/camunda/camunda-8-js-sdk/commit/00804d132c0e1840846a5af9eee26351f9580c74))
- **tasklist:** enable multiple clusters via constructor options ([#16](https://github.com/camunda/camunda-8-js-sdk/issues/16)) ([fb12e25](https://github.com/camunda/camunda-8-js-sdk/commit/fb12e258321e6bba03d11d38119c740f0e242773))
