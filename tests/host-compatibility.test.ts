import assert from "node:assert/strict";
import test from "node:test";

import {
  compareHostCompatibility,
  HOST_COMPATIBILITY_SCHEMA_VERSION,
  summarizeHostCompatibility,
  type HostCompatibilityRecord,
} from "../src/host-compatibility.js";

function record(overrides: Partial<HostCompatibilityRecord> = {}): HostCompatibilityRecord {
  return {
    schemaVersion: HOST_COMPATIBILITY_SCHEMA_VERSION,
    skillName: "example-skill",
    skillSourceSha256: "a".repeat(64),
    host: "codex",
    hostVersion: "1.2.3",
    installMode: "native",
    checks: [
      { id: "discover", status: "pass" },
      { id: "trigger", status: "pass" },
      { id: "output", status: "pass" },
    ],
    recordedAt: "2026-09-05T00:00:00Z",
    ...overrides,
  };
}

test("summarizes compatibility without treating skipped as success", () => {
  const summary = summarizeHostCompatibility(record({
    checks: [
      { id: "discover", status: "pass" },
      { id: "trigger", status: "skipped" },
    ],
  }));
  assert.equal(summary.passed, 1);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.compatible, true);
  assert.match(summary.recordSha256, /^[0-9a-f]{64}$/);
});

test("detects regressions, recoveries, and missing checks", () => {
  const baseline = record({ checks: [
    { id: "discover", status: "pass" },
    { id: "trigger", status: "fail" },
    { id: "output", status: "pass" },
  ] });
  const current = record({
    hostVersion: "1.2.4",
    recordedAt: "2026-09-05T01:00:00+00:00",
    checks: [
      { id: "discover", status: "error" },
      { id: "trigger", status: "pass" },
    ],
  });
  assert.deepEqual(compareHostCompatibility(baseline, current), {
    regressions: ["discover", "output:missing"],
    recovered: ["trigger"],
  });
});

test("refuses comparisons across skill source digests", () => {
  assert.throws(
    () => compareHostCompatibility(record(), record({ skillSourceSha256: "b".repeat(64) })),
    /skillSourceSha256 must match/,
  );
});

test("requires offset-aware timestamps and unique check ids", () => {
  assert.throws(
    () => summarizeHostCompatibility(record({ recordedAt: "2026-09-05T00:00:00" })),
    /offset-aware/,
  );
  assert.throws(
    () => summarizeHostCompatibility(record({ checks: [
      { id: "discover", status: "pass" },
      { id: "discover", status: "pass" },
    ] })),
    /duplicate check id/,
  );
});
