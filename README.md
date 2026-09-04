# SkillBench

**Contract testing and regression evidence for agent skills.**

Agent skills increasingly move between Codex, Claude Code, OpenCode, DSH and other hosts. A `SKILL.md` can look valid while its install path, identity, discovery behavior or host compatibility quietly regresses. SkillBench makes those claims testable and versioned.

> Status: early foundation. The deterministic evidence kernel is implemented on the foundation branch; real-harness adapters are the next milestone.

## What it does

```text
SKILL.md
  -> deterministic conformance checks
  -> SHA-256 source provenance
  -> skillbench.evidence/v1
  -> compare against a baseline
  -> fail CI on incompatible regressions
```

The core path does not require a model API key. Future adapters will attach execution evidence from real agent harnesses; compatibility will not be claimed from static inspection alone.

## Development quickstart

```bash
npm install
npm run check
npm test
npm run build

node dist/src/cli.js validate path/to/SKILL.md > evidence.json
node dist/src/cli.js compare baseline.json evidence.json
```

## Why another skill project?

Existing projects already do useful with-skill/without-skill model evaluation. SkillBench targets a narrower missing layer: **portable contracts, provenance and regression CI across skill and harness versions**. See [`docs/LANDSCAPE.md`](docs/LANDSCAPE.md) for the competitive boundary and [`docs/PRODUCT.md`](docs/PRODUCT.md) for the product contract.

## v0.1 direction

- versioned evidence envelopes;
- deterministic conformance and source fingerprinting;
- baseline/regression comparison;
- real-harness evidence adapters;
- compatibility matrices that distinguish observed evidence from inferred support;
- CI artifacts consumable by `agent-harness-index`.

## Non-goals

SkillBench is not a skill registry, installer, popularity ranking, generic LLM benchmark, or a wrapper that converts an LLM judge score into a compatibility claim.

Apache-2.0 licensed.
