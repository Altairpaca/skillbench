import { createHash } from "node:crypto";

export const HOST_COMPATIBILITY_SCHEMA_VERSION = "skillbench.host-compatibility/v1" as const;

export type HostInstallMode = "copy" | "symlink" | "registry" | "plugin";
export type HostInstallScope = "project" | "user";
export type HostCompatibilityOutcome = "pass" | "fail" | "error" | "skipped";
export type HostCheckStatus = "pass" | "fail" | "error" | "skipped";

export interface HostCompatibilityCheck {
  id: string;
  status: HostCheckStatus;
  evidence?: string;
}

export interface HostCompatibilityRecord {
  schemaVersion: typeof HOST_COMPATIBILITY_SCHEMA_VERSION;
  skillSourceSha256: string;
  host: { id: string; version: string };
  installMode: HostInstallMode;
  scope: HostInstallScope;
  outcome: HostCompatibilityOutcome;
  startedAt: string;
  finishedAt: string;
  checks: readonly HostCompatibilityCheck[];
  evidenceUri?: string;
}

export interface HostCompatibilityDiff {
  schemaVersion: "skillbench.host-compatibility-diff/v1";
  regressions: readonly string[];
  fixes: readonly string[];
  unchangedFailures: readonly string[];
  newCells: readonly string[];
  missingCells: readonly string[];
}

const SHA256_RE = /^[0-9a-f]{64}$/;
const OFFSET_TIMESTAMP_RE = /(?:Z|[+-]\d{2}:\d{2})$/;
const INSTALL_MODES = new Set<HostInstallMode>(["copy", "symlink", "registry", "plugin"]);
const INSTALL_SCOPES = new Set<HostInstallScope>(["project", "user"]);
const OUTCOMES = new Set<HostCompatibilityOutcome>(["pass", "fail", "error", "skipped"]);
const CHECK_STATUSES = new Set<HostCheckStatus>(["pass", "fail", "error", "skipped"]);

function nonEmpty(value: string, field: string): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} must be non-empty`);
  return normalized;
}

function timestamp(value: string, field: string): number {
  if (typeof value !== "string" || !OFFSET_TIMESTAMP_RE.test(value)) {
    throw new Error(`${field} must include an explicit timezone offset`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid timestamp`);
  return parsed;
}

function cellKey(record: HostCompatibilityRecord): string {
  return [record.host.id, record.host.version, record.installMode, record.scope].join("|");
}

function checkMap(record: HostCompatibilityRecord): Map<string, HostCheckStatus> {
  return new Map(record.checks.map((check) => [check.id, check.status]));
}

function isFailure(status: HostCheckStatus | undefined): boolean {
  return status === "fail" || status === "error";
}

export function validateHostCompatibility(record: HostCompatibilityRecord): HostCompatibilityRecord {
  if (!record || typeof record !== "object") throw new Error("host compatibility record must be an object");
  if (record.schemaVersion !== HOST_COMPATIBILITY_SCHEMA_VERSION) {
    throw new Error(`schemaVersion must equal ${HOST_COMPATIBILITY_SCHEMA_VERSION}`);
  }
  if (typeof record.skillSourceSha256 !== "string" || !SHA256_RE.test(record.skillSourceSha256)) {
    throw new Error("skillSourceSha256 must be lowercase SHA-256 hex");
  }
  if (!record.host || typeof record.host !== "object") throw new Error("host must be an object");
  nonEmpty(record.host.id, "host.id");
  nonEmpty(record.host.version, "host.version");
  if (!INSTALL_MODES.has(record.installMode)) throw new Error("installMode is invalid");
  if (!INSTALL_SCOPES.has(record.scope)) throw new Error("scope is invalid");
  if (!OUTCOMES.has(record.outcome)) throw new Error("outcome is invalid");
  const started = timestamp(record.startedAt, "startedAt");
  const finished = timestamp(record.finishedAt, "finishedAt");
  if (finished < started) throw new Error("finishedAt cannot precede startedAt");
  if (!Array.isArray(record.checks) || record.checks.length === 0) throw new Error("checks must be non-empty");
  const ids = new Set<string>();
  for (const check of record.checks) {
    if (!check || typeof check !== "object") throw new Error("checks must contain objects");
    const id = nonEmpty(check.id, "check.id");
    if (ids.has(id)) throw new Error(`duplicate check id: ${id}`);
    ids.add(id);
    if (!CHECK_STATUSES.has(check.status)) throw new Error(`check ${id} has invalid status`);
    if (check.evidence !== undefined) nonEmpty(check.evidence, "check.evidence");
  }
  if (record.evidenceUri !== undefined) nonEmpty(record.evidenceUri, "evidenceUri");
  return record;
}

export function hostCompatibilityFingerprint(record: HostCompatibilityRecord): string {
  validateHostCompatibility(record);
  const canonical = JSON.stringify({
    schemaVersion: record.schemaVersion,
    skillSourceSha256: record.skillSourceSha256,
    host: { id: record.host.id, version: record.host.version },
    installMode: record.installMode,
    scope: record.scope,
    outcome: record.outcome,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    checks: [...record.checks]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((check) => ({ id: check.id, status: check.status, evidence: check.evidence ?? null })),
    evidenceUri: record.evidenceUri ?? null,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function compareHostCompatibility(
  baseline: readonly HostCompatibilityRecord[],
  current: readonly HostCompatibilityRecord[],
): HostCompatibilityDiff {
  const before = new Map<string, HostCompatibilityRecord>();
  const after = new Map<string, HostCompatibilityRecord>();
  for (const record of baseline) {
    validateHostCompatibility(record);
    const key = cellKey(record);
    if (before.has(key)) throw new Error(`duplicate baseline host cell: ${key}`);
    before.set(key, record);
  }
  for (const record of current) {
    validateHostCompatibility(record);
    const key = cellKey(record);
    if (after.has(key)) throw new Error(`duplicate current host cell: ${key}`);
    after.set(key, record);
  }

  const regressions: string[] = [];
  const fixes: string[] = [];
  const unchangedFailures: string[] = [];
  const newCells = [...after.keys()].filter((key) => !before.has(key)).sort();
  const missingCells = [...before.keys()].filter((key) => !after.has(key)).sort();

  for (const [key, previous] of before) {
    const next = after.get(key);
    if (!next) continue;
    const previousChecks = checkMap(previous);
    const nextChecks = checkMap(next);
    const ids = new Set([...previousChecks.keys(), ...nextChecks.keys()]);
    for (const id of [...ids].sort()) {
      const wasFailure = isFailure(previousChecks.get(id));
      const isNowFailure = isFailure(nextChecks.get(id));
      const label = `${key}|${id}`;
      if (!wasFailure && isNowFailure) regressions.push(label);
      else if (wasFailure && !isNowFailure) fixes.push(label);
      else if (wasFailure && isNowFailure) unchangedFailures.push(label);
    }
  }

  return {
    schemaVersion: "skillbench.host-compatibility-diff/v1",
    regressions,
    fixes,
    unchangedFailures,
    newCells,
    missingCells,
  };
}
