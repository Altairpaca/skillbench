# Landscape and differentiation

Snapshot: 2026-09-04.

The agent-skill ecosystem already has capable evaluators. SkillBench should not duplicate them.

## Existing approaches

- [`tardigrde/agent-skill-eval`](https://github.com/tardigrde/agent-skill-eval) runs real Claude Code, Codex and OpenCode harnesses, compares with-skill vs without-skill behavior, repeats trials and reports pass@k, cost and wall-clock time.
- [`TiesPetersen/SkillBenchmark`](https://github.com/TiesPetersen/SkillBenchmark) measures uplift with repeated trials, blind LLM judging and confidence intervals.
- [`aws-samples/sample-agent-skill-eval`](https://github.com/aws-samples/sample-agent-skill-eval) demonstrates a broad skill-evaluation workflow spanning safety, quality, reliability and cost efficiency.
- [`vercel-labs/skills`](https://github.com/vercel-labs/skills) is a major distribution surface. Its issue tracker shows recurring compatibility and lifecycle failures: per-agent variants, missing agent-specific links, stale sources after repository renames, lock/update behavior and requests for pre-install quality signals.

## Gap SkillBench targets

SkillBench focuses on **portable contract evidence and regression CI across versions**, not on producing another subjective quality score.

The intended composition is:

```text
SKILL.md
  -> deterministic contract evidence
  -> fixture/run evidence from one or more real harness adapters
  -> version/harness regression comparison
  -> provenance-preserving CI artifact
  -> optional public aggregation by agent-harness-index
```

The differentiating requirements are:

1. stable machine-readable evidence envelopes;
2. exact source and environment provenance;
3. explicit distinction between static claims and executed compatibility claims;
4. regression comparison across skill revisions and harness revisions;
5. CI-first operation with a credential-free deterministic core;
6. no assumption that one installed build is valid for every agent.

## Product boundary with agent-harness-index

SkillBench owns **per-skill verification artifacts and regressions**.

`agent-harness-index` owns **longitudinal aggregation and comparison across models, harnesses, configurations and tasks**.

Keeping these separate prevents the evaluator from becoming a leaderboard and lets benchmark data evolve independently from the skill contract format.
