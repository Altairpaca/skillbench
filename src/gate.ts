import {
  GATE_SCHEMA_VERSION,
  type GatePolicy,
  type GateReason,
  type GateReport,
  type RegressionReport,
  type SkillEvidenceReport,
} from "./contracts.js";

const DEFAULT_POLICY: Required<GatePolicy> = {
  requireConformance: true,
  failOnNewFailure: true,
  failOnManifestChange: true,
  failOnWarnings: false,
  allowedWarningIds: [],
};

export function normalizeGatePolicy(policy: GatePolicy = {}): Required<GatePolicy> {
  return {
    requireConformance: policy.requireConformance ?? DEFAULT_POLICY.requireConformance,
    failOnNewFailure: policy.failOnNewFailure ?? DEFAULT_POLICY.failOnNewFailure,
    failOnManifestChange: policy.failOnManifestChange ?? DEFAULT_POLICY.failOnManifestChange,
    failOnWarnings: policy.failOnWarnings ?? DEFAULT_POLICY.failOnWarnings,
    allowedWarningIds: [...(policy.allowedWarningIds ?? DEFAULT_POLICY.allowedWarningIds)].sort(),
  };
}

export function evaluateGate(
  regression: RegressionReport,
  current: SkillEvidenceReport,
  policy: GatePolicy = {},
): GateReport {
  const normalized = normalizeGatePolicy(policy);
  const reasons: GateReason[] = [];

  if (normalized.requireConformance && current.verdict === "fail") {
    for (const item of current.checks.filter((check) => check.status === "fail")) {
      reasons.push({
        code: "current-conformance",
        id: item.id,
        message: `Current evidence fails conformance check ${item.id}.`,
      });
    }
  }

  for (const finding of regression.findings) {
    if (normalized.failOnNewFailure && finding.kind === "new-failure") {
      reasons.push({ code: "new-failure", id: finding.id, message: finding.message });
    }
    if (normalized.failOnManifestChange && finding.kind === "manifest-change") {
      reasons.push({ code: "manifest-change", id: finding.id, message: finding.message });
    }
  }

  if (normalized.failOnWarnings) {
    const allowed = new Set(normalized.allowedWarningIds);
    for (const item of current.checks.filter((check) => check.status === "warn" && !allowed.has(check.id))) {
      reasons.push({
        code: "warning",
        id: item.id,
        message: `Current evidence contains blocking warning ${item.id}.`,
      });
    }
  }

  const unique = new Map(reasons.map((reason) => [`${reason.code}:${reason.id}`, reason]));
  return {
    schemaVersion: GATE_SCHEMA_VERSION,
    decision: unique.size === 0 ? "pass" : "fail",
    policy: normalized,
    reasons: [...unique.values()].sort((a, b) => `${a.code}:${a.id}`.localeCompare(`${b.code}:${b.id}`)),
  };
}
