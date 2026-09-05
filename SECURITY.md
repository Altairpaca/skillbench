# Security Policy

## Scope

SkillBench stores compatibility evidence and contract metadata. It must not store private host state, credentials, API tokens, browser sessions, or local agent runtime data.

## Reporting

For security-sensitive issues, please open a private GitHub security advisory when available or contact the repository owner through GitHub profile channels.

## Repository boundary

The following are local-only artifacts and must remain excluded:

- host credentials and tokens
- generated evidence containing private data
- local agent/session state
- downloaded browser state
- unredacted environment files

Compatibility records should contain reproducible metadata and redacted observations rather than secrets or personal data.
