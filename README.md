# SkillBench Contracts

**Contract testing, host-compatibility records and regression evidence for agent skills.**

Agent skills move between Codex, Claude Code, OpenCode and other hosts through different copy, symlink, registry and plugin mechanisms. A valid `SKILL.md` does not prove that discovery/install/update behavior remains compatible. SkillBench Contracts turns those boundaries into versioned evidence.

Implemented surfaces include deterministic conformance, policy gates, content-addressed evidence bundles, portable harness observations, and `skillbench.host-compatibility/v1` records bound to exact host/version/install-mode/scope cells.

Deleted checks are missing evidence rather than fixes; host upgrades are new/missing cells rather than silent comparisons; contradictory outcomes are rejected. Real-run agent benchmarks remain complementary rather than the identity of this project.

```bash
skillbench compat-validate host-record.json
skillbench compat-compare baseline-hosts.json current-hosts.json
```

## GitHub Action (pre-release)

A repository can now use SkillBench as a pull-request gate without reproducing the CLI setup:

```yaml
- uses: Altairpaca/skillbench@main # Pre-release channel; pin a release tag or commit SHA once published.
  with:
    skill-path: path/to/SKILL.md
    upload-artifact: "true"
```

The action builds the checked-out SkillBench revision, validates the requested `SKILL.md`, fails the job when conformance fails, and uploads the JSON report as short-lived evidence. It does not claim that a skill works on a host merely because the static contract passes; real host compatibility remains a separate evidence surface.

See `examples/github-action.yml`, `docs/HOST_COMPATIBILITY.md`, `docs/PRODUCT.md`, and `docs/LANDSCAPE.md`.
