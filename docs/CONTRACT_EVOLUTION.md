# SkillBench Contract Evolution

## Purpose

SkillBench treats agent skill compatibility as a versioned contract rather than a one-time installation test.

A compatibility claim must identify:

- host and host version
- installation mechanism
- scope of installation
- skill package identity
- validation checks executed
- evidence bundle reference

## Contract Rules

### Missing evidence is not success

An absent check result means unknown. It cannot be interpreted as compatible.

### Host upgrades create new evaluation cells

A changed host version, installation mode, or execution scope requires a new compatibility observation.

### Contradictory observations require investigation

Conflicting evidence for the same contract cell must be surfaced instead of silently selecting one result.

## Future Extensions

This document defines semantic rules. Machine-readable schemas should evolve separately and remain backward compatible where possible.
