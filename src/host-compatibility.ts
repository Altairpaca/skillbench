import { sha256Json } from "./bundle.js";

export const HOST_COMPATIBILITY_SCHEMA_VERSION = "skillbench.host-compatibility/v1" as const;

export type HostInstallMode = "native" | "copy" | "symlink" | "generated";
export type HostCompatibilityStatus = "pass" | "fail" | "error" | "skipped";

export interface HostCompatibilityCheck {
  id: string;
  status: HostCompatibilityStatus;
  message?: string;
}

export interface HostCompatibilityRecord {
  schemaVersion: typeof HOST_COMPATIBILITY_SCHEMA_VERSION;
  skillName: string;
  skillSourceSha256: string;
  host: string;
  hostVersion: string;
  installMode: HostInstallMode;
  checks: readonly HostCompatibilityCheck[];
  evidenceUri?: string;
  recordedAt: string;
}

export interface HostCompatibilitySummary {
  host: string;
  hostVersion: string;
  installMode: HostInstallMode;
  passed: number;
  failed: number;
  errored: number;
  skipped: number;
  compatible: boolean;
  recordSha256: string;
}

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function assertSha256(value: string, label: string): void {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error(`${label} must be a SHA-256 hex digest`);
}

function assertOffsetAwareTimestamp(value: string): void {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/u.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error("recordedAt must be an offset-aware timestamp");
  }
}

export function validateHostCompatibilityRecord(record: HostCompatibilityRecord): HostCompatibilityRecord {
  if (record.schemaVersion !== HOST_COMPATIBILITY_SCHEMA_VERSION) {
    throw new Error(`schemaVersion must equal ${HOST_COMPATIBILITY_SCHEMA_VERSION}`);
  }
  assertNonEmpty(record.skillName, "skillName");
  assertSha256(record.skillSourceSha256, "skillSourceSha256");
  assertNonEmpty(record.host, "host");
  assertNonEmpty(record.hostVersion, "hostVersion");
  assertOffsetAwareTimestamp(record.recordedAt);
  if (record.checks.length === 0) throw new Error("checks must not be empty");

  const ids = new Set<string>();
  for (const check of record.checks) {
    assertNonEmpty(check.id, "check.id");
    if (ids.has(check.id)) throw new Error(`duplicate check id: ${check.id}`);
    ids.add(check.id);
  }
  return record;
}

export function summarizeHostCompatibility(record: HostCompatibilityRecord): HostCompatibilitySummary {
  validateHostCompatibilityRecord(record);
  const counts = { pass: 0, fail: 0, error: 0, skipped: 0 };
  for (const check of record.checks) counts[check.status] += 1;
  return {
    host: record.host,
    hostVersion: record.hostVersion,
    installMode: record.installMode,
    passed: counts.pass,
    failed: counts.fail,
    errored: counts.error,
    skipped: counts.skipped,
    compatible: counts.fail === 0 && counts.error === 0 && counts.pass > 0,
    recordSha256: sha256Json(record),
  };
}

export function compareHostCompatibility(
  baseline: HostCompatibilityRecord,
  current: HostCompatibilityRecord,
): { regressions: readonly string[]; recovered: readonly string[] } {
  validateHostCompatibilityRecord(baseline);
  validateHostCompatibilityRecord(current);
  for (const field of ["skillName", "skillSourceSha256", "host", "installMode"] as const) {
    if (baseline[field] !== current[field]) throw new Error(`${field} must match for compatibility comparison`);
  }

  const baselineById = new Map(baseline.checks.map((check) => [check.id, check.status]));
  const currentById = new Map(current.checks.map((check) => [check.id, check.status]));
  const regressions: string[] = [];
  const recovered: string[] = [];
  const bad = new Set<HostCompatibilityStatus>(["fail", "error"]);

  for (const [id, baselineStatus] of baselineById) {
    const currentStatus = currentById.get(id);
    if (currentStatus === undefined) {
      regressions.push(`${id}:missing`);
      continue;
    }
    if (!bad.has(baselineStatus) && bad.has(currentStatus)) regressions.push(id);
    if (bad.has(baselineStatus) && currentStatus === "pass") recovered.push(id);
  }
  return { regressions, recovered };
}
