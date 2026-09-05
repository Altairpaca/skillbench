# Host compatibility evidence

SkillBench Contracts separates static skill conformance from host/install behavior. A valid `SKILL.md` does not prove that a host discovers, installs or updates the skill correctly.

## Portable record

`skillbench.host-compatibility/v1` binds one observation to:

- exact skill source SHA-256;
- host identity and host version;
- install mode (`copy`, `symlink`, `registry`, `plugin`);
- install scope (`project`, `user`);
- offset-aware timestamps;
- stable check IDs and statuses;
- optional public evidence URI.

The record is content-addressable with `hostCompatibilityFingerprint()`.

## Regression comparison

Compatibility comparison is deliberately strict:

- only identical host/version/install-mode/scope cells are compared;
- host upgrades become a missing old cell + new cell, not a silent regression comparison;
- only checks present on both sides can be labelled regressions or fixes;
- a deleted check is `missingChecks`, never a fix;
- a newly introduced check is `newChecks`, never a regression;
- missing cells/checks are evidence gaps and make the CLI gate fail;
- contradictory record outcome/check statuses are rejected.

This prevents a project from improving its apparent compatibility by deleting a failing check or silently changing the host version under test.

## CLI

```bash
skillbench compat-validate host-record.json
skillbench compat-compare baseline-hosts.json current-hosts.json
```

`compat-compare` returns non-zero when it observes a regression, missing check or missing compatibility cell.

## Evidence boundary

This schema records compatibility evidence; it does not execute Codex, Claude Code, OpenCode, DSH or other hosts by itself. Real host observations must still be collected from the actual runtime and may then be checked into CI as sanitized portable evidence.

Unknown support remains unknown. Stars, registry presence and documentation claims are not host-compatibility evidence.
