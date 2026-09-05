# SkillBench Contracts

**Contract testing, host-compatibility records and regression evidence for agent skills.**

Agent skills increasingly move between Codex, Claude Code, OpenCode, DSH and other hosts. A `SKILL.md` can look valid while its identity, discovery behavior, installer behavior or host compatibility quietly regresses. SkillBench Contracts makes those claims testable and versioned.

> Status: early foundation. Deterministic conformance, regression gates, content-addressed evidence bundles and portable host-compatibility contracts are implemented. Real-harness execution remains evidence collection, not the identity of this project.

## Core flows

```text
SKILL.md
  -> deterministic conformance checks
  -> SHA-256 source provenance
  -> skillbench.evidence/v1
  -> compare against a baseline
  -> policy gate
  -> content-addressed evidence bundle
```

```text
skill source digest
  + host/version
  + install mode/scope
  + deterministic checks
  -> skillbench.host-compatibility/v1
  -> baseline/current cell comparison
  -> regressions / fixes / missing evidence
```

The core path does not require a model API key. Host-specific execution evidence can be attached later without weakening the distinction between observed compatibility and inferred support.

## Development quickstart

```bash
npm install
npm run check
npm test
npm run build

node dist/src/cli.js validate path/to/SKILL.md > current.json
node dist/src/cli.js compare baseline.json current.json
node dist/src/cli.js gate baseline.json current.json policy.json
node dist/src/cli.js bundle current=current.json regression=regression.json > bundle.json
node dist/src/cli.js verify-bundle bundle.json
node dist/src/cli.js compat-validate host-record.json
node dist/src/cli.js compat-compare baseline-hosts.json current-hosts.json
```

## Host-compatibility semantics

A compatibility cell is bound to `host + host version + install mode + scope`. Different host versions are not silently treated as the same experiment. Deleted checks are reported as missing evidence rather than as fixes; new checks are reported separately from regressions. Contradictory summary outcomes and check statuses are rejected.

`compat-compare` exits non-zero for regressions, missing checks or missing cells. Unknown evidence never becomes a passing compatibility claim.

## CI semantics

`compare` answers whether the current skill report introduced an incompatible regression relative to the baseline. `gate` answers whether the current state is acceptable under repository policy. The distinction matters: a baseline and current report can contain the same old failure, which is regression-compatible but still unfit to merge when `requireConformance` is enabled.

Default gate policy:

```json
{
  "requireConformance": true,
  "failOnNewFailure": true,
  "failOnManifestChange": true,
  "failOnWarnings": false,
  "allowedWarningIds": []
}
```

## Evidence bundles

`skillbench.bundle/v1` sorts named evidence entries, hashes each payload using canonical JSON, then hashes the full entry set. Bundles are tamper-evident transport artifacts; SHA-256 integrity is not an identity signature or trust assertion.

## Positioning

Real-run agent/skill benchmark projects already measure with-skill versus without-skill model performance. This project deliberately targets a different layer: **portable skill contracts, source provenance, host/install compatibility and regression CI**. It is not intended to compete as a generic Codex benchmark or pass@k runner.

See [`docs/HOST_COMPATIBILITY.md`](docs/HOST_COMPATIBILITY.md), [`docs/LANDSCAPE.md`](docs/LANDSCAPE.md), [`docs/PRODUCT.md`](docs/PRODUCT.md), and [`docs/V0.2.md`](docs/V0.2.md).

## Non-goals

SkillBench Contracts is not a skill registry, installer, popularity ranking, generic LLM benchmark, or a wrapper that converts an LLM judge score into a compatibility claim.

Apache-2.0 licensed.
