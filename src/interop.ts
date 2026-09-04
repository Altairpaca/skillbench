import { canonicalJson } from "./bundle.js";
import type { HarnessIdentity, HarnessRunEvidence } from "./harness.js";

export const HARNESS_OBSERVATION_SCHEMA_VERSION = "skillbench.harness-observation/v1" as const;

export interface BenchmarkIdentity {
  id: string;
  version?: string;
}

export interface ModelIdentity {
  id: string;
  version?: string;
}

export interface HarnessObservation {
  schemaVersion: typeof HARNESS_OBSERVATION_SCHEMA_VERSION;
  runId: string;
  benchmark: BenchmarkIdentity;
  caseId: string;
  trial: number;
  harness: HarnessIdentity;
  model: ModelIdentity;
  skillSourceSha256: string;
  outcome: HarnessRunEvidence["outcome"];
  startedAt: string;
  finishedAt: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  evidenceUri?: string;
  configuration: Readonly<Record<string, unknown>>;
  environment: Readonly<Record<string, unknown>>;
}

export interface HarnessObservationInput {
  runId: string;
  benchmark: BenchmarkIdentity;
  run: HarnessRunEvidence;
  modelVersion?: string;
  configuration?: Readonly<Record<string, unknown>>;
  environment?: Readonly<Record<string, unknown>>;
}

function requireNonEmpty(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value;
}

function requireSha256(value: string, field: string): string {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error(`${field} must be a 64-character SHA-256 hex digest`);
  return value.toLowerCase();
}

function requireNonNegativeInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${field} must be a non-negative safe integer`);
  return value;
}

function requireNonNegativeFinite(value: number | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative finite number`);
  return value;
}

function requireOffsetAwareTimestamp(value: string, field: string): number {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error(`${field} must include an explicit timezone offset or Z`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid timestamp`);
  return parsed;
}

function validateJsonObject(value: Readonly<Record<string, unknown>>, field: string): void {
  try {
    canonicalJson(value);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${field} must be canonical JSON: ${message}`);
  }
}

export function createHarnessObservation(input: HarnessObservationInput): HarnessObservation {
  const runId = requireNonEmpty(input.runId, "runId");
  const benchmarkId = requireNonEmpty(input.benchmark.id, "benchmark.id");
  const benchmarkVersion = input.benchmark.version === undefined
    ? undefined
    : requireNonEmpty(input.benchmark.version, "benchmark.version");
  const caseId = requireNonEmpty(input.run.caseId, "run.caseId");
  const harnessId = requireNonEmpty(input.run.harness.id, "run.harness.id");
  const harnessVersion = requireNonEmpty(input.run.harness.version, "run.harness.version");
  const modelId = input.run.model === undefined ? undefined : requireNonEmpty(input.run.model, "run.model");
  if (modelId === undefined) throw new Error("run.model is required for portable harness observations");
  const modelVersion = input.modelVersion === undefined ? undefined : requireNonEmpty(input.modelVersion, "modelVersion");
  const trial = requireNonNegativeInteger(input.run.trial, "run.trial");
  if (trial === undefined) throw new Error("run.trial is required");

  const startedAtMs = requireOffsetAwareTimestamp(input.run.startedAt, "run.startedAt");
  const finishedAtMs = requireOffsetAwareTimestamp(input.run.finishedAt, "run.finishedAt");
  if (finishedAtMs < startedAtMs) throw new Error("run.finishedAt must not precede run.startedAt");

  const configuration = input.configuration ?? {};
  const environment = input.environment ?? {};
  validateJsonObject(configuration, "configuration");
  validateJsonObject(environment, "environment");

  const inputTokens = requireNonNegativeInteger(input.run.inputTokens, "run.inputTokens");
  const outputTokens = requireNonNegativeInteger(input.run.outputTokens, "run.outputTokens");
  const costUsd = requireNonNegativeFinite(input.run.costUsd, "run.costUsd");
  const evidenceUri = input.run.evidenceUri === undefined ? undefined : requireNonEmpty(input.run.evidenceUri, "run.evidenceUri");

  return {
    schemaVersion: HARNESS_OBSERVATION_SCHEMA_VERSION,
    runId,
    benchmark: {
      id: benchmarkId,
      ...(benchmarkVersion === undefined ? {} : { version: benchmarkVersion }),
    },
    caseId,
    trial,
    harness: { id: harnessId, version: harnessVersion },
    model: {
      id: modelId,
      ...(modelVersion === undefined ? {} : { version: modelVersion }),
    },
    skillSourceSha256: requireSha256(input.run.sourceSha256, "run.sourceSha256"),
    outcome: input.run.outcome,
    startedAt: input.run.startedAt,
    finishedAt: input.run.finishedAt,
    latencyMs: finishedAtMs - startedAtMs,
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(costUsd === undefined ? {} : { costUsd }),
    ...(evidenceUri === undefined ? {} : { evidenceUri }),
    configuration,
    environment,
  };
}

export function isScoreableHarnessObservation(observation: HarnessObservation): boolean {
  return observation.outcome === "pass" || observation.outcome === "fail";
}
