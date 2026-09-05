import assert from "node:assert/strict";
import test from "node:test";

import {
  compareHostCompatibility,
  hostCompatibilityFingerprint,
  validateHostCompatibility,
  type HostCompatibilityRecord,
} from "../src/index.js";

const SHA = "a".repeat(64);

function record(overrides: Partial<HostCompatibilityRecord> = {}): HostCompatibilityRecord {
  return {
    schemaVersion: "skillbench.host-compatibility/v1",
    skillSourceSha256: SHA,
    host: { id: "codex", version: "1.2.3" },
    installMode: "copy",
    scope: "project",
    outcome: "pass",
    startedAt: "2026-09-05T00:00:00Z",
    finishedAt: "2026-09-05T00:00:01Z",
    checks: [
      { id: "install", status: "pass" },
      { id: "discover", status: "pass" },
    ],
    ...overrides,
  };
}

test("validates portable host compatibility evidence", () => {
  const value = record();
  assert.equal(validateHostCompatibility(value), value);
  assert.match(hostCompatibilityFingerprint(value), /^[0-9a-f]{64}$/);
});

test("rejects duplicate checks, bad digests, and naive timestamps", () => {
  assert.throws(() => validateHostCompatibility(record({ skillSourceSha256: "bad" })), /SHA-256/);
  assert.throws(
    () => validateHostCompatibility(record({ checks: [{ id: "install", status: "pass" }, { id: "install", status: "fail" }] })),
    /duplicate check id/,
  );
  assert.throws(() => validateHostCompatibility(record({ startedAt: "2026-09-05T00:00:00" })), /timezone offset/);
});

test("reports regressions, fixes, old failures, new cells, and missing cells separately", () => {
  const baseline = [
    record({ checks: [{ id: "install", status: "pass" }, { id: "discover", status: "fail" }] }),
    record({ host: { id: "claude", version: "2.0.0" } }),
  ];
  const current = [
    record({ checks: [{ id: "install", status: "fail" }, { id: "discover", status: "pass" }] }),
    record({ host: { id: "cursor", version: "3.0.0" } }),
  ];
  const diff = compareHostCompatibility(baseline, current);
  assert.deepEqual(diff.regressions, ["codex|1.2.3|copy|project|install"]);
  assert.deepEqual(diff.fixes, ["codex|1.2.3|copy|project|discover"]);
  assert.deepEqual(diff.newCells, ["cursor|3.0.0|copy|project"]);
  assert.deepEqual(diff.missingCells, ["claude|2.0.0|copy|project"]);
});

test("host version changes are not silently treated as comparable", () => {
  const diff = compareHostCompatibility(
    [record({ host: { id: "codex", version: "1.2.3" } })],
    [record({ host: { id: "codex", version: "1.3.0" } })],
  );
  assert.deepEqual(diff.regressions, []);
  assert.deepEqual(diff.newCells, ["codex|1.3.0|copy|project"]);
  assert.deepEqual(diff.missingCells, ["codex|1.2.3|copy|project"]);
});
