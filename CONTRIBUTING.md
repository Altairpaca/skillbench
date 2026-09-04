# Contributing to SkillBench

SkillBench accepts changes that make agent-skill compatibility claims more reproducible, portable and reviewable. The repository deliberately separates deterministic contract logic from host-specific execution evidence.

## Contribution classes

### Deterministic core

Examples: parsers, checks, gate semantics, schemas, hashing, regression logic and fixture transformations.

Requirements:

- add deterministic tests that run in GitHub Actions;
- state the invariant being added or changed;
- preserve stable check IDs once published unless a migration is documented;
- do not require model credentials or a local agent runtime to test core behavior.

### Host evidence

Examples: Codex/Claude/OpenCode/DSH behavior, installation paths, symlink semantics or runtime-specific compatibility.

Requirements:

- identify the exact host/runtime version actually exercised;
- distinguish observed support, observed failure and unavailable/not-tested states;
- include sanitized reproduction evidence tied to source SHAs;
- never turn a mocked run into a compatibility claim;
- move deterministic protocol/serialization logic discovered during the work back into normal CI.

## Pull request contract

A PR should answer:

1. **Problem** — what concrete failure, ambiguity or missing invariant does this address?
2. **Scope** — what changes, and what explicitly does not?
3. **Acceptance** — which deterministic assertions prove completion?
4. **Evidence** — which source SHA, fixture or external observation supports the change?
5. **Compatibility** — does this change a public evidence/check/gate contract?

## Product boundaries

SkillBench is not a skill registry, installer, popularity ranking or generic LLM benchmark. Proposals that mainly belong to those categories should explain why they cannot remain an integration rather than expanding the core.

## Security and secrets

Do not commit API keys, OAuth material, cookies, account identifiers or raw subscription/billing payloads. Sanitized evidence should retain only the fields needed to reproduce a compatibility claim.

Apache-2.0 applies to contributions unless explicitly stated otherwise.
