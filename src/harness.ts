import type { SkillEvidenceReport } from "./contracts.js";

export interface HarnessIdentity {
  id: string;
  version: string;
}

export interface HarnessRunRequest {
  caseId: string;
  trial: number;
  prompt: string;
  workspaceId: string;
  skillEvidence: SkillEvidenceReport;
  model?: string;
  configuration?: Readonly<Record<string, unknown>>;
}

export interface HarnessRunEvidence {
  schemaVersion: "skillbench.harness-run/v1";
  caseId: string;
  trial: number;
  harness: HarnessIdentity;
  sourceSha256: string;
  outcome: "pass" | "fail" | "error" | "skipped";
  startedAt: string;
  finishedAt: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  evidenceUri?: string;
  details?: Readonly<Record<string, unknown>>;
}

export interface HarnessAdapter {
  readonly identity: HarnessIdentity;
  run(request: HarnessRunRequest): Promise<HarnessRunEvidence>;
}
