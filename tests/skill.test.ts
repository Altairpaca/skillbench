import assert from "node:assert/strict";
import test from "node:test";
import { compareEvidence, validateSkill } from "../src/skill.js";

test("valid skill produces deterministic passing evidence", () => {
  const source = `---\nname: release-notes\ndescription: Write release notes from a diff.\n---\n\n# Instructions\nSummarize user-visible changes.\n`;
  const first = validateSkill(source);
  const second = validateSkill(source);

  assert.equal(first.verdict, "pass");
  assert.equal(first.source.sha256, second.source.sha256);
  assert.equal(first.manifest.name, "release-notes");
});

test("missing description is a conformance failure", () => {
  const report = validateSkill(`---\nname: release-notes\n---\n\nDo work.\n`);
  assert.equal(report.verdict, "fail");
  assert.equal(report.checks.find((item) => item.id === "SB004")?.status, "fail");
});

test("new failures make a regression incompatible", () => {
  const base = validateSkill(`---\nname: release-notes\ndescription: Good.\n---\n\nDo work.\n`);
  const current = validateSkill(`---\nname: release-notes\n---\n\nDo work.\n`);
  const regression = compareEvidence(base, current);

  assert.equal(regression.compatible, false);
  assert.ok(regression.findings.some((item) => item.kind === "new-failure" && item.id === "SB004"));
});

test("skill rename is treated as an incompatible contract change", () => {
  const base = validateSkill(`---\nname: old-name\ndescription: Good.\n---\n\nDo work.\n`);
  const current = validateSkill(`---\nname: new-name\ndescription: Good.\n---\n\nDo work.\n`);
  const regression = compareEvidence(base, current);

  assert.equal(regression.compatible, false);
  assert.ok(regression.findings.some((item) => item.id === "manifest.name"));
});
