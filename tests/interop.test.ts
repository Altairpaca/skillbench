import assert from "node:assert/strict";
import test from "node:test";
import type { HarnessRunEvidence } from "../src/harness.js";
import { createHarnessObservation, isScoreableHarnessObservation } from "../src/interop.js";

function run(overrides: Partial<HarnessRunEvidence> = {}): HarnessRunEvidence {
  return {
    schemaVersion: "skillbench.harness-run/v1",
    caseId: "case-1",
    trial: 0,
    harness: { id: "fixture-harness", version: "1.2.3" },
    sourceSha256: "a".repeat(64),
    outcome: "pass",
    startedAt: "2026-09-04T00:00:00.000Z",
    finishedAt: "2026-09-04T00:00:01.250Z",
    model: "fixture-model",
    inputTokens: 100,
    outputTokens: 20,
    costUsd: 0.01,
    ...overrides,
  };
}

test("portable observation preserves benchmark/model/harness provenance", () => {
  const observation = createHarnessObservation({
    runId: "run-001",
    benchmark: { id: "fixture-bench", version: "2026-09" },
    modelVersion: "2026-08-31",
    run: run(),
    configuration: { reasoning: "high", skillEnabled: true },
    environment: { os: "linux", arch: "x64" },
  });

  assert.equal(observation.schemaVersion, "skillbench.harness-observation/v1");
  assert.equal(observation.latencyMs, 1250);
  assert.deepEqual(observation.model, { id: "fixture-model", version: "2026-08-31" });
  assert.deepEqual(observation.harness, { id: "fixture-harness", version: "1.2.3" });
  assert.equal(observation.skillSourceSha256, "a".repeat(64));
  assert.equal(isScoreableHarnessObservation(observation), true);
});

test("error and skipped outcomes remain explicitly non-scoreable", () => {
  const error = createHarnessObservation({ runId: "run-error", benchmark: { id: "fixture-bench" }, run: run({ outcome: "error" }) });
  const skipped = createHarnessObservation({ runId: "run-skipped", benchmark: { id: "fixture-bench" }, run: run({ outcome: "skipped" }) });
  assert.equal(isScoreableHarnessObservation(error), false);
  assert.equal(isScoreableHarnessObservation(skipped), false);
});

test("portable observation requires a model identity", () => {
  const { model: _model, ...withoutModel } = run();
  assert.throws(
    () => createHarnessObservation({ runId: "run-001", benchmark: { id: "fixture-bench" }, run: withoutModel }),
    /run\.model is required/,
  );
});

test("portable observation rejects invalid timing and non-json configuration", () => {
  assert.throws(
    () => createHarnessObservation({
      runId: "run-001",
      benchmark: { id: "fixture-bench" },
      run: run({ finishedAt: "2026-09-03T23:59:59Z" }),
    }),
    /finishedAt must not precede startedAt/,
  );

  assert.throws(
    () => createHarnessObservation({
      runId: "run-001",
      benchmark: { id: "fixture-bench" },
      run: run(),
      configuration: { bad: new Date("2026-09-04T00:00:00Z") },
    }),
    /configuration must be canonical JSON/,
  );
});
