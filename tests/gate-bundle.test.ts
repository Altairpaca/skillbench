import assert from "node:assert/strict";
import test from "node:test";
import { createEvidenceBundle, verifyEvidenceBundle } from "../src/bundle.js";
import { evaluateGate } from "../src/gate.js";
import { compareEvidence, validateSkill } from "../src/skill.js";

const good = `---\nname: release-notes\ndescription: Write release notes.\n---\n\nDo work.\n`;
const warning = `---\nname: ReleaseNotes\ndescription: Write release notes.\n---\n\nDo work.\n`;

test("default gate requires current conformance", () => {
  const base = validateSkill(`---\nname: release-notes\n---\n\nDo work.\n`);
  const current = validateSkill(`---\nname: release-notes\n---\n\nDo work.\n`);
  const gate = evaluateGate(compareEvidence(base, current), current);
  assert.equal(gate.decision, "fail");
  assert.ok(gate.reasons.some((reason) => reason.code === "current-conformance" && reason.id === "SB004"));
});

test("warning policy can block and explicitly allow warning ids", () => {
  const base = validateSkill(warning);
  const current = validateSkill(warning);
  const regression = compareEvidence(base, current);

  assert.equal(evaluateGate(regression, current, { failOnWarnings: true }).decision, "fail");
  assert.equal(
    evaluateGate(regression, current, { failOnWarnings: true, allowedWarningIds: ["SBP001"] }).decision,
    "pass",
  );
});

test("evidence bundles are order-stable and content addressed", () => {
  const report = validateSkill(good);
  const left = createEvidenceBundle({ report, metadata: { z: 1, a: 2 } });
  const right = createEvidenceBundle({ metadata: { a: 2, z: 1 }, report });

  assert.equal(left.bundleSha256, right.bundleSha256);
  assert.deepEqual(left.entries.map((entry) => entry.name), ["metadata", "report"]);
  assert.deepEqual(verifyEvidenceBundle(left), { valid: true, errors: [] });
});

test("bundle verification detects payload tampering", () => {
  const bundle = createEvidenceBundle({ report: validateSkill(good) });
  const tampered = structuredClone(bundle);
  tampered.entries[0]!.payload = { changed: true };
  const verification = verifyEvidenceBundle(tampered);

  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes("entry digest mismatch: report"));
  assert.ok(verification.errors.includes("bundle digest mismatch"));
});

test("canonical evidence hashing rejects values JSON cannot represent faithfully", () => {
  assert.throws(() => createEvidenceBundle({ bad: { missing: undefined } }), /cannot contain undefined/);
  assert.throws(() => createEvidenceBundle({ bad: Number.NaN }), /non-finite numbers/);
});
