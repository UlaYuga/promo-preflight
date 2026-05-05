import {
  CheckResultSchema,
  type CampaignBundle,
  type CheckResult,
  type CheckSeverity,
  type CheckStatus
} from "../../schemas/index";
import { CHECK_DEFINITION_BY_ID, type CheckId } from "./definitions";
import type { IssueDraft } from "./types";

const OFFLINE_MODEL_USED = "offline-deterministic:v1";

export function buildCheckResult(
  checkId: CheckId,
  issues: IssueDraft[],
  options: {
    passSummary: string;
    issueSummary: string;
    notApplicableSummary?: string;
    deterministicSignals: Record<string, unknown>;
    notApplicable?: boolean;
    confidence?: number;
  }
): CheckResult {
  const definition = CHECK_DEFINITION_BY_ID[checkId];
  const status = options.notApplicable
    ? "NOT_APPLICABLE"
    : statusFromIssues(issues);
  const result = {
    checkId,
    publicName: definition.publicName,
    status,
    severity: severityFromIssues(issues),
    summary: summaryForStatus(status, issues, options),
    issues: issues.map((issue, index) => ({
      issueId: `${checkId.toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
      checkId,
      ...issue
    })),
    suggestedFixCount: issues.length,
    confidence:
      issues.length > 0 ? minIssueConfidence(issues) : (options.confidence ?? 0.9),
    modelUsed: OFFLINE_MODEL_USED,
    deterministicSignals: {
      route: definition.route,
      ...options.deterministicSignals
    }
  };

  return CheckResultSchema.parse(result);
}

export function countResults(checkResults: CheckResult[]) {
  return {
    pass: checkResults.filter((result) => result.status === "PASS").length,
    warn: checkResults.filter((result) => result.status === "WARN").length,
    fail: checkResults.filter((result) => result.status === "FAIL").length,
    notApplicable: checkResults.filter(
      (result) => result.status === "NOT_APPLICABLE"
    ).length,
    criticalBlockers: checkResults.flatMap((result) => result.issues).filter(
      (issue) => issue.blocker && issue.severity === "CRITICAL"
    ).length
  };
}

export function getOverallStatus(
  counts: ReturnType<typeof countResults>
): CheckStatus {
  if (counts.fail > 0) {
    return "FAIL";
  }

  if (counts.warn > 0) {
    return "WARN";
  }

  return "PASS";
}

export function createReportId(bundle: CampaignBundle) {
  const base = `${bundle.metadata.campaignName}:${bundle.metadata.launchDate ?? ""}`;
  let hash = 0;

  for (const char of base) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return `offline-report-${hash.toString(16).padStart(8, "0")}`;
}

function statusFromIssues(issues: IssueDraft[]): CheckStatus {
  if (issues.some((issue) => issue.blocker || issue.severity === "CRITICAL")) {
    return "FAIL";
  }

  if (issues.length > 0) {
    return "WARN";
  }

  return "PASS";
}

function severityFromIssues(issues: IssueDraft[]): CheckSeverity | undefined {
  const order: CheckSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  return issues.reduce<CheckSeverity | undefined>((highest, issue) => {
    if (!highest) {
      return issue.severity;
    }

    return order.indexOf(issue.severity) > order.indexOf(highest)
      ? issue.severity
      : highest;
  }, undefined);
}

function minIssueConfidence(issues: IssueDraft[]) {
  return Math.min(...issues.map((issue) => issue.confidence));
}

function summaryForStatus(
  status: CheckStatus,
  issues: IssueDraft[],
  options: {
    passSummary: string;
    issueSummary: string;
    notApplicableSummary?: string;
  }
) {
  if (status === "NOT_APPLICABLE") {
    return options.notApplicableSummary ?? "This check is not applicable.";
  }

  return issues.length > 0 ? options.issueSummary : options.passSummary;
}
