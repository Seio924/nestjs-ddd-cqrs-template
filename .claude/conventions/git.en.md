> 🌐 [한국어](./git.md) · **English**

# Git Strategy

## Branch model

| Branch | Role | Branch from → merge into |
|---|---|---|
| `main` | Always deployable | — |
| `feature/*` | Feature development | main → main |
| `fix/*` | Bug fixes | main → main |
| `refactor/*` `chore/*` `docs/*` `test/*` | Other work | main → main |

- Branch name: `<type>/<short-description-kebab>` (e.g., `feature/article-publish`, `fix/lint-error`).
- Once a team or staging server exists, you can extend to Git Flow by adding `develop` (integration) + `release/*`.

## Commit convention (Conventional Commits)

```
<type>(<scope>)<!>: <summary>

<body (optional): what · why>

<footer (optional): BREAKING CHANGE: ... / Closes #123>
```

- **Summary**: imperative mood, no trailing period, around 50 characters.
- **scope** (optional): domain/area (`article`, `auth`).

| type | Meaning | SemVer |
|---|---|---|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `perf` | Performance improvement | PATCH |
| `refactor` | Structural improvement with no behavior change | — |
| `docs` `test` `chore` `style` `ci` `build` | Docs/tests/chores, etc. | — |

- **Breaking = MAJOR**: `type!:` or the footer `BREAKING CHANGE: <description>`.

## Merge strategy

- **feature/fix → main: Squash merge.** Collapse to one commit per PR to keep history clean.
- Even though the commits will be squashed, **during review the commit is the unit of reading**. Follow `type(scope): summary` within the PR too, and keep each commit in a build-passing, lint-passing state.

## PR-unit principle (🔴 important)

**1 PR = 1 logical change.** Aim for small, focused PRs (better for review, rollback, and changelog).

- ✅ Good: a PR containing only "the article publish feature" → `feat(article): ...`
- ❌ Bad: mixing a new feature + an unrelated bug fix + refactoring.
- When judgment is unclear: "Would writing this change as **a single line** in the changelog be accurate?" → if not, split it.

## PR flow

1. Branch off from `main`.
2. Work → push → PR (base `main`).
3. The PR title also follows the commit convention format (`type(scope): summary`).
4. After CI (lint+test+build) passes, **Squash merge**.

## Version management (optional)

- When releases become necessary, you can add automatic bumping + CHANGELOG based on conventional commits using **SemVer** + a tool like [release-please](https://github.com/googleapis/release-please).
- Start the API URL version with the global prefix `/v1`, and run `/v2` in parallel only when the contract **breaks**.
