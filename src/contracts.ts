export const EVIDENCE_SCHEMA_VERSION = "skillbench.evidence/v1" as const;
export const REGRESSION_SCHEMA_VERSION = "skillbench.regression/v1" as const;
export const GATE_SCHEMA_VERSION = "skillbench.gate/v1" as const;
export const BUNDLE_SCHEMA_VERSION = "skillbench.bundle/v1" as const;

export type CheckStatus = "pass" | "fail" | "warn";

export interface SkillCheck {
  id: string;
  status: CheckStatus;
  message: string;
}

export interface SkillEvidenceReport {
  schemaVersion: typeof EVIDENCE_SCHEMA_VERSION;
  source: {
    path: string;
    sha256: string;
  };
  manifest: {
    name?: string;
    description?: string;
  };
  checks: SkillCheck[];
  verdict: "pass" | "fail";
}

export interface RegressionFinding {
  kind: "new-failure" | "resolved-failure" | "manifest-change";
  id: string;
  message: string;
}

export interface RegressionReport {
  schemaVersion: typeof REGRESSION_SCHEMA_VERSION;
  compatible: boolean;
  findings: RegressionFinding[];
}

export interface GatePolicy {
  /** Require the current skill to pass all conformance checks, even if the baseline already failed. */
  requireConformance?: boolean;
  /** Fail when the regression report contains a newly failing check. */
  failOnNewFailure?: boolean;
  /** Fail when a stable manifest field changes. */
  failOnManifestChange?: boolean;
  /** Treat current warnings as blocking unless explicitly allowed. */
  failOnWarnings?: boolean;
  /** Warning check IDs exempted from failOnWarnings. */
  allowedWarningIds?: string[];
}

export interface GateReason {
  code: "current-conformance" | "new-failure" | "manifest-change" | "warning";
  id: string;
  message: string;
}

export interface GateReport {
  schemaVersion: typeof GATE_SCHEMA_VERSION;
  decision: "pass" | "fail";
  policy: Required<GatePolicy>;
  reasons: GateReason[];
}

export interface EvidenceBundleEntry {
  name: string;
  sha256: string;
  payload: unknown;
}

export interface EvidenceBundle {
  schemaVersion: typeof BUNDLE_SCHEMA_VERSION;
  entries: EvidenceBundleEntry[];
  bundleSha256: string;
}

export interface BundleVerification {
  valid: boolean;
  errors: string[];
}
