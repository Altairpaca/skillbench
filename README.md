# SkillBench Contracts

**Contract testing, host-compatibility records and regression evidence for agent skills.**

Agent skills move between Codex, Claude Code, OpenCode and other hosts through different copy, symlink, registry and plugin mechanisms. A valid `SKILL.md` does not prove that discovery/install/update behavior remains compatible. SkillBench Contracts turns those boundaries into versioned evidence.

Implemented surfaces include deterministic conformance, policy gates, content-addressed evidence bundles, portable harness observations, and `skillbench.host-compatibility/v1` records bound to exact host/version/install-mode/scope cells.

Deleted checks are missing evidence rather than fixes; host upgrades are new/missing cells rather than silent comparisons; contradictory outcomes are rejected. Real-run agent benchmarks remain complementary rather than the identity of this project.

```bash
skillbench compat-validate host-record.json
skillbench compat-compare baseline-hosts.json current-hosts.json
```

See `docs/HOST_COMPATIBILITY.md`, `docs/PRODUCT.md`, and `docs/LANDSCAPE.md`.
