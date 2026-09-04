# SkillBench

**Contract testing and regression evidence for agent skills.**

Agent skills increasingly move between Codex, Claude Code, OpenCode, DSH and other hosts. A `SKILL.md` can look valid while its identity, discovery behavior or host compatibility quietly regresses. SkillBench makes those claims testable and versioned.

> Status: early v0.2 foundation. Deterministic conformance, regression gates and content-addressed evidence bundles are implemented. Real-harness adapters remain evidence-collection work, not prerequisites for the core CI path.

## Core flow

```text
SKILL.md
  -> deterministic conformance checks
  -> SHA-256 source provenance
  -> skillbench.evidence/v1
  -> compare against a baseline
  -> policy gate
  -> content-addressed evidence bundle
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
```

## CI semantics

`compare` answers whether the current report introduced an incompatible regression relative to the baseline. `gate` answers whether the current state is acceptable under repository policy. The distinction matters: a baseline and current report can contain the same old failure, which is regression-compatible but still unfit to merge when `requireConformance` is enabled.

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

## Why another skill project?

Existing projects already do useful with-skill/without-skill model evaluation. SkillBench targets a narrower missing layer: **portable contracts, provenance and regression CI across skill and harness versions**. See [`docs/LANDSCAPE.md`](docs/LANDSCAPE.md), [`docs/PRODUCT.md`](docs/PRODUCT.md), and [`docs/V0.2.md`](docs/V0.2.md).

## Non-goals

SkillBench is not a skill registry, installer, popularity ranking, generic LLM benchmark, or a wrapper that converts an LLM judge score into a compatibility claim.

Apache-2.0 licensed.
