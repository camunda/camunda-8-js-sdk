<h1 align="center">Maintainer Guide – Camunda 8 JavaScript SDK</h1>

Operational documentation for maintainers of `@camunda8/sdk`. End-user documentation lives in [README.md](README.md); contributor onboarding (forking, commit conventions, running tests locally) lives in [CONTRIBUTING.md](CONTRIBUTING.md).

This document focuses on **how CI works**, **how releases happen**, and **how to operate the branch model**.

---

## 1. Branch Model

| Branch                              | Type                | npm dist-tag             | Trigger              |
| ----------------------------------- | ------------------- | ------------------------ | -------------------- |
| `main`                              | alpha pre-releases  | `alpha`                  | merge to `main`      |
| `stable/<major>.<minor>` (current)  | stable releases     | `latest`                 | merge to that branch |
| `stable/<major>.<minor>` (older)    | maintenance         | `<major>.<minor>-stable` | merge to that branch |

The "current" stable line is selected at release time by the GitHub repo variable `CAMUNDA_SDK_CURRENT_STABLE_MINOR` (e.g. `8.8`). The branch matching that value publishes to `latest`; every other `stable/*` branch publishes to its own maintenance dist-tag.

At time of writing, `stable/8.8` is the current stable line (publishes to `latest`) and `main` carries `8.9.0-alpha.*` (publishes to `alpha`).

The branch resolution logic lives in [release.config.js](release.config.js) (`stableMinorFromBranch`, `envCurrentStableMinor`, `dedupeBranches`). The logic mirrors `orchestration-cluster-api-js` so the two SDKs stay aligned.

### Promoting a new stable line

When a new Camunda minor (e.g. `8.9`) is ready to be promoted to `latest`:

1. Cut the branch from `main`:
   ```bash
   git checkout main
   git checkout -b stable/8.9
   git push -u origin stable/8.9
   ```
2. Update the GitHub **repository variable** (Settings → Secrets and variables → Actions → Variables) `CAMUNDA_SDK_CURRENT_STABLE_MINOR` from `8.8` to `8.9`.
3. The next merge to `stable/8.9` will publish to npm dist-tag `latest`. The previous current line (`stable/8.8`) automatically falls back to maintenance dist-tag `8.8-stable` on its next release.
4. Update [.github/workflows/integration-test-matrix-trigger.yaml](.github/workflows/integration-test-matrix-trigger.yaml) to add a daily compatibility-test trigger for the new branch (uncomment / duplicate the `trigger-stable-8-9` block).
5. Update [.github/dependabot.yml](.github/dependabot.yml) `target-branch` entries if the previous stable line should be replaced as a dependabot target.

No git tag manipulation is required — semantic-release reads existing tags and computes the next version per branch independently.

---

## 2. CI Workflows

All workflows live under [.github/workflows/](.github/workflows/).

| Workflow                                  | Trigger                                                  | Purpose                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                                  | push to feature branches, all PRs                        | Fast feedback for contributors. Unit tests + 8.8 SM integration. Heavier 8.7 jobs are PR-only and gated by environment. |
| `release.yml`                             | push to `main` or `stable/**`, manual dispatch           | Full integration suite **plus** semantic-release publish step.                                                       |
| `commitlint.yml`                          | PR                                                       | Enforces conventional commits.                                                                                       |
| `code-scanning.yml`                       | scheduled / push                                         | CodeQL.                                                                                                              |
| `backport.yml`                            | PR closed, `/backport` comment                           | Creates backport PRs (e.g. `main` → `stable/8.8`) via `korthout/backport-action`.                                    |
| `integration-test-matrix.yml`             | scheduled (02:00 UTC), manual dispatch                   | Cross-version client × server compatibility matrix. Runs **on a stable branch** and tests every released SDK version against every server version ≥ current minor. |
| `integration-test-matrix-trigger.yaml`    | scheduled (02:00 UTC)                                    | Fans out the matrix run to each active stable branch (uses `gh workflow run --ref stable/<x.y>`).                    |

### CI vs. Release: why feature branches and `main`/`stable/**` are separated

`ci.yml` listens on `push` for everything **except** `main` and `stable/**`, plus all `pull_request` events. `release.yml` listens on `push` to `main` and `stable/**`. This avoids running the same jobs twice on the same SHA when a PR is merged.

The release workflow re-runs the same gating jobs as `ci.yml`, then layers on:

- `local_integration` (8.7 SM, requires `selfhosted` env + `DOCKER_PASSWORD`)
- `local_multitenancy_integration` (8.7 SM-MT, same)
- `saas_integration` (8.7 SaaS, requires `integration` env)
- `saas_integration_8_8` (8.8 SaaS, requires `integration-8.8` env)

All of those are **required** before the `tag-and-publish` job runs. There is no path that publishes to npm without the full integration suite passing.

### SaaS concurrency

SaaS test clusters are shared across branches. To prevent a `main` release and a `stable/8.8` release from interleaving requests against the same cluster, each SaaS job declares a `concurrency` group keyed to its cluster (`saas-integration-8.7`, `saas-integration-8.8`) with `cancel-in-progress: false`. Concurrent triggers queue rather than abort.

---

## 3. Release Pipeline

Releases are produced by [semantic-release](https://github.com/semantic-release/semantic-release) inside the `tag-and-publish` job at the end of [release.yml](.github/workflows/release.yml). The job runs in the GitHub `publish` environment (any environment-level approval gates apply here).

### What semantic-release does

1. Reads commits since the last release tag on the current branch.
2. Computes the next version from commit types (see [release.config.js](release.config.js) `releaseRules`).
3. Updates `package.json`, generates `CHANGELOG.md`, commits with `chore(release): <version> [skip ci]`, tags `v<version>`.
4. Publishes to npm with the dist-tag derived from the branch.
5. Creates a GitHub Release with auto-generated notes.
6. Posts a "Released in `<tag>`" comment on PRs included in the release.

### Commit type → version bump

| Commit type     | Bump  | Notes                                                  |
| --------------- | ----- | ------------------------------------------------------ |
| `feat`          | patch | Mutated semver: features within a minor cycle = patch  |
| `fix`           | patch |                                                        |
| `perf`          | patch |                                                        |
| `revert`        | patch |                                                        |
| `release`       | patch |                                                        |
| `BREAKING CHANGE` footer | patch | Also a patch — bumps are tied to the Camunda server line, not breaking changes in the SDK itself |
| `server`        | minor | Use when bumping to a new Camunda 8 minor (e.g. 8.8 → 8.9) |
| `server-major`  | major | Use when bumping to a new Camunda 8 major              |
| anything else (`chore`, `docs`, `test`, `ci`, `build`, `refactor`, `style`) | none | No release |

This mutated semver is intentional: the SDK's version tracks the Camunda 8 server minor line, not its own API surface. To force a release of accumulated `chore`-only work, push a commit (or empty commit) with type `release`.

### npm authentication: Trusted Publishing (OIDC)

Publishing uses npm **Trusted Publishing** via GitHub Actions OIDC. Consequences:

- The workflow requests `id-token: write` and **does not** read `NPM_TOKEN`. The `NODE_AUTH_TOKEN=""` in front of the `npx semantic-release` invocation is deliberate — it ensures any stale token in the environment is ignored.
- `NPM_CONFIG_PROVENANCE: true` is set, so published tarballs include npm provenance attestations.
- For publishing to succeed, `@camunda8/sdk` must be configured on npmjs.com to **trust this repository and the `release.yml` workflow**.
- If publishing fails with auth errors (`ENEEDAUTH`, `E401`), check the npm Trusted Publishing configuration **before** introducing an `NPM_TOKEN` secret. Adding a token undermines the OIDC posture and should be a last resort.

### Stable line dist-tag derivation at publish time

The `Export stable line config` step in `tag-and-publish` writes `CAMUNDA_SDK_CURRENT_STABLE_MINOR` from the repo variable into the job env. `release.config.js` then dynamically constructs the `branches` array based on the current branch (`GITHUB_REF_NAME`) and that env var. Effects:

- On `main`: only the `main` (alpha) branch entry is active.
- On `stable/<current>`: both `main` and `stable/<current>` (channel: `latest`) are present.
- On `stable/<other>`: a maintenance entry is appended for that branch (channel: `<x.y>-stable`).

A consequence: if you push to a `stable/*` branch **without** `CAMUNDA_SDK_CURRENT_STABLE_MINOR` being set correctly, semantic-release may either refuse to publish or publish to the wrong dist-tag. Always verify the repo variable before promoting a new stable line.

### Documentation deployment

After a successful release on `main`, the same job builds TypeDoc output (`npm run docs`) and deploys it to the `gh-pages` branch via `JamesIves/github-pages-deploy-action`. Releases on `stable/**` do not redeploy docs.

---

## 4. Compatibility Matrix

[integration-test-matrix.yml](.github/workflows/integration-test-matrix.yml) runs nightly on each active stable branch (driven by `integration-test-matrix-trigger.yaml`). It:

1. Derives the current minor from the **latest stable git tag** on the branch (intentionally not from `package.json`, which may already be at a pre-release version).
2. Enumerates SDK client versions ≥ that minor from local git tags.
3. Enumerates Camunda server versions ≥ that minor from `camunda/camunda` git tags via `git ls-remote` (no clone).
4. Runs the full client × server matrix, with caching to avoid retesting known-good combinations.

Manual dispatch supports pinning a `client_version`, a `server_version`, and `skip_cache` to force a full re-run.

When promoting a new stable line, **add a trigger entry** in `integration-test-matrix-trigger.yaml` so the new branch is exercised nightly. Failure to do so means the new line silently loses compatibility coverage.

---

## 5. Hotfix / Maintenance Workflow

To ship a fix to a stable line:

1. Land the fix on `main` via a normal PR (so `alpha` users get it immediately).
2. Add the appropriate `backport-stable/<x.y>` label on the merged PR (or comment `/backport stable/<x.y>`). [backport.yml](.github/workflows/backport.yml) creates the backport PR automatically; conflicts are committed as draft commits per the `experimental.conflict_resolution` setting.
3. Merge the backport PR to `stable/<x.y>`. The Release workflow then runs the full integration suite and publishes to npm.

Always land on `main` first unless the fix is genuinely stable-only (e.g. it touches code that no longer exists on `main`). Stable-only fixes should be opened directly against the `stable/<x.y>` branch.

---

## 6. Required Secrets and Environments

| Name                                         | Scope                          | Used by                                        |
| -------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `DOCKER_PASSWORD`                            | env: `selfhosted`              | 8.7 self-managed integration jobs (login to `registry.camunda.cloud`) |
| `ZEEBE_*`, `CAMUNDA_*`, `CAMUNDA_CONSOLE_*`  | env: `integration`             | 8.7 SaaS integration                           |
| `ZEEBE_*`, `CAMUNDA_*`, `CAMUNDA_CONSOLE_*`  | env: `integration-8.8`         | 8.8 SaaS integration                           |
| (none — OIDC)                                | env: `publish`                 | npm publish via Trusted Publishing             |
| `BACKPORT_ACTION_PAT`                        | repo                           | `backport.yml` (PAT with write access for cross-branch pushes) |
| `CAMUNDA_SDK_CURRENT_STABLE_MINOR` (variable, not secret) | repo            | `release.yml` → `release.config.js`            |

Fork PRs cannot read environment secrets, so the heavier jobs (`local_integration`, `local_multitenancy_integration`, both SaaS jobs) skip on fork PRs by virtue of the environment lookup failing or, in `ci.yml`, by an explicit `if: github.event_name == 'pull_request' && github.actor != 'dependabot[bot]'` guard plus the environment scoping. Fork contributors get unit tests + the public 8.8 docker stack.

---

## 7. Common Operational Tasks

### Force a release with no eligible commits

Push an empty commit with type `release`:

```bash
git commit --allow-empty -m "release: ship pending chore work"
git push
```

### Re-run a failed release

Re-run the `tag-and-publish` job from the Actions UI. semantic-release is idempotent: it will skip publishing if the version was already published, or resume from the next pending version.

### Diagnose "wrong dist-tag" issues

1. Check `CAMUNDA_SDK_CURRENT_STABLE_MINOR` in repo variables.
2. Inspect the workflow log for the line `Export stable line config` to confirm the value reached the job.
3. Confirm the branch you pushed to matches the configured current stable minor (or is `main`, or is an older stable line).

### Diagnose "publish failed: no auth"

Do **not** add an `NPM_TOKEN` secret. Verify on npmjs.com that `@camunda8/sdk` lists this repo + `release.yml` as a Trusted Publisher.

---

## 8. Cross-references

- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor-facing version of the branching/release summary
- [release.config.js](release.config.js) — semantic-release configuration (branches, dist-tags, releaseRules)
- [.github/workflows/release.yml](.github/workflows/release.yml) — full release pipeline
- [.github/workflows/ci.yml](.github/workflows/ci.yml) — PR / feature-branch CI
- [.github/workflows/integration-test-matrix.yml](.github/workflows/integration-test-matrix.yml) — nightly compatibility matrix
- [.github/workflows/backport.yml](.github/workflows/backport.yml) — automated backports
