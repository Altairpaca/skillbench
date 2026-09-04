export const EVIDENCE_SCHEMA_VERSION = "skillbench.evidence/v1" as const;

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
  schemaVersion: "skillbench.regression/v1";
  compatible: boolean;
  findings: RegressionFinding[];
}
