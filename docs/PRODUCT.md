# Product contract

## Problem

Agent skills are executable instructions distributed across rapidly changing harnesses. A skill can remain syntactically present while becoming undiscoverable, installing into the wrong location, changing identity, or regressing under a new harness version. Those failures are difficult to catch with repository stars or one-off qualitative evals.

## Scope

SkillBench is the contract-testing layer for agent skills. It produces deterministic, machine-readable evidence that can be stored in CI and compared across revisions, harnesses and harness versions.

The v0.1 kernel deliberately starts below model evaluation:

1. validate a skill's portable structural contract;
2. fingerprint the exact source under test;
3. emit a versioned evidence report;
4. compare reports and fail CI on incompatible regressions.

Future adapters may attach real-harness execution evidence from Codex, Claude Code, OpenCode, DSH and other hosts without changing the core evidence envelope.

## Non-goals

- another skill registry or installer;
- a popularity ranking;
- a generic LLM benchmark;
- an LLM-as-judge-only quality score;
- a replacement for harness-specific test suites;
- silently claiming compatibility without execution evidence.

## Design principles

- **Evidence before score.** Preserve source hash, checks and environment before aggregating a grade.
- **Deterministic core.** CI should not require model credentials to validate contracts.
- **Versioned contracts.** Evidence formats must be explicit and migratable.
- **Baseline first.** A change is evaluated against a known prior state, not an anecdote.
- **Host claims require host evidence.** Cross-harness compatibility is only asserted after the real host runs the fixture.

## v0.1 acceptance criteria

- `skillbench validate SKILL.md` emits `skillbench.evidence/v1` JSON and returns non-zero on structural failure.
- identical source produces the same SHA-256 fingerprint and check results.
- `skillbench compare base.json current.json` identifies newly introduced failures and manifest identity changes.
- unit tests execute on supported Node versions in GitHub Actions.
- no network or model credential is required by the core verification path.
