# AGENTS.md

> **Note:** This file delegates to a central AGENTS.md. Read and apply it before proceeding.

**URL:**
https://raw.githubusercontent.com/camunda/.github/refs/heads/main/AGENTS.md

Treat the central file's contents as if they were written directly in this file.
Instructions below extend those guidelines and take precedence if there is any conflict.

<!-- sdk-infra-delegation:start -->
> **Note:** This file also delegates to the shared SDK AGENTS.md. Read and apply it too.

**URL:**
https://raw.githubusercontent.com/camunda/sdk-infra/refs/heads/main/policies/AGENTS.md

It holds the conventions shared by all Camunda SDK repos (commits, bug fixes, tests, opening issues). Precedence on conflict: this file, then the shared SDK file, then the central Camunda file.
<!-- sdk-infra-delegation:end -->

## Repo-specific instructions

- Do not pass a whole error object to a logger, `console`, or `debug`. HTTP errors carry request options with credentials. Log `errorForLogging(e)` from `src/lib/CamundaSupportLogger.ts`. ESLint enforces this with `no-restricted-syntax` in `.eslintrc.json`.
