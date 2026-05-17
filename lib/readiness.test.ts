import { describe, expect, it } from "vitest";
import {
  formatOwnerRole,
  generateLaunchReadiness,
  getRequiredChecklistItems,
  type ReadinessInputOwner
} from "./readiness";
import type { CheckIssue, CheckResult, RiskReport } from "../schemas/index";
import type { OwnerRole } from "../domain/model/Campaign";

function makeIssue(
  overrides: Partial<CheckIssue> & {
    issueId: string;
    checkId: string;
  }
): CheckIssue {
  return {
    issueId: overrides.issueId,
    checkId: overrides.checkId,
    severity: overrides.severity ?? "HIGH",
    blocker: overrides.blocker ?? true,
    detectedIssue: overrides.detectedIssue ?? `Detected ${overrides.issueId}`,
    evidence: overrides.evidence ?? [{ field: "termsText", snippet: "sample" }],
    suggestedFix: overrides.suggestedFix ?? `Fix ${overrides.issueId}`,
    ownerSuggestion: overrides.ownerSuggestion,
    confidence: overrides.confidence ?? 0.9
  };
}

function makeCheck({
  checkId,
  status = "PASS",
  issues = [],
  publicName = checkId,
  confidence = 0.9,
  parsingError
}: {
  checkId: string;
  status?: CheckResult["status"];
  issues?: CheckIssue[];
  publicName?: string;
  confidence?: number;
  parsingError?: string;
}): CheckResult {
  return {
    checkId,
    publicName,
    status,
    severity: issues[0]?.severity,
    summary: `${publicName} summary`,
    issues,
    suggestedFixCount: issues.length,
    confidence,
    parsingError
  };
}

function makeCounts(checkResults: CheckResult[]): RiskReport["counts"] {
  const pass = checkResults.filter((result) => result.status === "PASS").length;
  const warn = checkResults.filter((result) => result.status === "WARN").length;
  const fail = checkResults.filter((result) => result.status === "FAIL").length;
  const notApplicable = checkResults.filter(
    (result) => result.status === "NOT_APPLICABLE"
  ).length;
  const criticalBlockers = checkResults
    .flatMap((result) => result.issues)
    .filter((issue) => issue.severity === "CRITICAL").length;

  return { pass, warn, fail, notApplicable, criticalBlockers };
}

function makeReport({
  reportId = "report-1",
  campaignName = "Campaign Alpha",
  generatedAt = "2026-05-17T08:00:00.000Z",
  checkResults
}: {
  reportId?: string;
  campaignName?: string;
  generatedAt?: string;
  checkResults: CheckResult[];
}): RiskReport {
  const counts = makeCounts(checkResults);
  const overallStatus =
    counts.fail > 0 ? "FAIL" : counts.warn > 0 ? "WARN" : "PASS";

  return {
    reportId,
    campaignName,
    generatedAt,
    overallStatus,
    counts,
    checkResults
  };
}

function owner(
  role: OwnerRole,
  status: ReadinessInputOwner["status"],
  name?: string
): ReadinessInputOwner {
  return {
    role,
    status,
    name
  };
}

describe("generateLaunchReadiness", () => {
  it("returns READY when there are no warnings/failures and no dependencies", () => {
    const report = makeReport({
      checkResults: [makeCheck({ checkId: "link_qa" })]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });

    expect(readiness.state).toBe("READY");
    expect(readiness.blockers).toEqual([]);
    expect(readiness.dependencies).toEqual([]);
  });

  it("returns READY_WITH_WARNINGS when only warning issues exist", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "link_qa",
          status: "WARN",
          issues: [
            makeIssue({
              issueId: "warn-1",
              checkId: "link_qa",
              severity: "MEDIUM",
              blocker: false,
              ownerSuggestion: "analytics"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });

    expect(readiness.state).toBe("READY_WITH_WARNINGS");
    expect(readiness.blockers).toEqual([]);
    expect(readiness.dependencies).toHaveLength(1);
    expect(readiness.dependencies[0].status).toBe("open");
  });

  it("returns BLOCKED when at least one open HIGH blocker exists", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "terms_robustness",
          status: "FAIL",
          publicName: "Terms robustness",
          issues: [
            makeIssue({
              issueId: "fail-1",
              checkId: "terms_robustness",
              severity: "HIGH",
              ownerSuggestion: "legal"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({
      report,
      owners: [owner("legal", "pending", "Alice Legal")]
    });

    expect(readiness.state).toBe("BLOCKED");
    expect(readiness.blockers).toHaveLength(1);
    expect(readiness.blockers[0].severity).toBe("HIGH");
  });

  it("returns NEEDS_REVIEW when failures are present but only LOW severity blockers", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "format_qa",
          status: "FAIL",
          issues: [
            makeIssue({
              issueId: "fail-low",
              checkId: "format_qa",
              severity: "LOW",
              ownerSuggestion: "crm"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });

    expect(readiness.state).toBe("NEEDS_REVIEW");
    expect(readiness.blockers.map((blocker) => blocker.severity)).toEqual(["LOW"]);
  });

  it("forces NEEDS_REVIEW when parsing error exists even with zero blockers", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "channel_consistency",
          parsingError: "cannot parse assets"
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });
    expect(readiness.state).toBe("NEEDS_REVIEW");
  });

  it("forces NEEDS_REVIEW when core checks have low confidence", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "localization_qa",
          confidence: 0.5
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });
    expect(readiness.state).toBe("NEEDS_REVIEW");
  });

  it("does not force NEEDS_REVIEW for low confidence on non-core checks", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "offer_math_sanity",
          confidence: 0.5
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });
    expect(readiness.state).toBe("READY");
  });

  it("adds missing legal owner blocker and upgrades LOW issue severity to MEDIUM", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "terms_robustness",
          status: "FAIL",
          publicName: "Terms robustness",
          issues: [
            makeIssue({
              issueId: "legal-low",
              checkId: "terms_robustness",
              severity: "LOW",
              ownerSuggestion: "legal"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });
    const missingOwnerBlocker = readiness.blockers.find((blocker) =>
      blocker.blockerId.includes("missing-legal")
    );

    expect(readiness.blockers).toHaveLength(2);
    expect(missingOwnerBlocker?.severity).toBe("MEDIUM");
    expect(missingOwnerBlocker?.requiredAction).toContain("Assign a Legal owner");
  });

  it("does not add missing legal/risk owner blockers when named owners exist", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "terms_robustness",
          status: "FAIL",
          issues: [
            makeIssue({
              issueId: "legal-high",
              checkId: "terms_robustness",
              severity: "HIGH",
              ownerSuggestion: "legal"
            })
          ]
        }),
        makeCheck({
          checkId: "jurisdictional_risk_signals",
          status: "FAIL",
          issues: [
            makeIssue({
              issueId: "risk-high",
              checkId: "jurisdictional_risk_signals",
              severity: "HIGH",
              ownerSuggestion: "risk"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({
      report,
      owners: [
        owner("legal", "pending", "Alice Legal"),
        owner("risk", "pending", "Bob Risk")
      ]
    });

    expect(readiness.blockers).toHaveLength(2);
    expect(
      readiness.blockers.some((blocker) => blocker.blockerId.includes("missing-legal"))
    ).toBe(false);
    expect(
      readiness.blockers.some((blocker) => blocker.blockerId.includes("missing-risk"))
    ).toBe(false);
  });

  it("marks warning dependencies as resolved when owner status is approved", () => {
    const report = makeReport({
      checkResults: [
        makeCheck({
          checkId: "link_qa",
          status: "WARN",
          publicName: "Link QA",
          issues: [
            makeIssue({
              issueId: "warn-analytics",
              checkId: "link_qa",
              severity: "MEDIUM",
              blocker: false,
              ownerSuggestion: "analytics"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({
      report,
      owners: [owner("analytics", "approved", "Analyst")]
    });

    expect(readiness.dependencies).toHaveLength(1);
    expect(readiness.dependencies[0].status).toBe("resolved");
    expect(readiness.dependencies[0].ownerRole).toBe("analytics");
  });

  it("calculates blocker due dates by severity offsets", () => {
    const report = makeReport({
      generatedAt: "2026-05-01T12:00:00.000Z",
      checkResults: [
        makeCheck({
          checkId: "critical_check",
          status: "FAIL",
          issues: [
            makeIssue({
              issueId: "crit",
              checkId: "critical_check",
              severity: "CRITICAL",
              ownerSuggestion: "product"
            })
          ]
        }),
        makeCheck({
          checkId: "medium_check",
          status: "FAIL",
          issues: [
            makeIssue({
              issueId: "med",
              checkId: "medium_check",
              severity: "MEDIUM",
              ownerSuggestion: "crm"
            })
          ]
        }),
        makeCheck({
          checkId: "low_check",
          status: "FAIL",
          issues: [
            makeIssue({
              issueId: "low",
              checkId: "low_check",
              severity: "LOW",
              ownerSuggestion: "localization"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });
    const byCheck = new Map(
      readiness.blockers.map((blocker) => [blocker.sourceCheckId, blocker.dueDate])
    );

    expect(byCheck.get("critical_check")).toBe("2026-05-02");
    expect(byCheck.get("medium_check")).toBe("2026-05-03");
    expect(byCheck.get("low_check")).toBe("2026-05-04");
  });

  it("returns undefined due dates when generatedAt is invalid", () => {
    const report = makeReport({
      generatedAt: "not-a-date",
      checkResults: [
        makeCheck({
          checkId: "format_qa",
          status: "FAIL",
          issues: [
            makeIssue({
              issueId: "invalid-date",
              checkId: "format_qa",
              severity: "HIGH",
              ownerSuggestion: "crm"
            })
          ]
        })
      ]
    });

    const readiness = generateLaunchReadiness({ report, owners: [] });
    expect(readiness.blockers[0].dueDate).toBeUndefined();
  });

  it("returns checklist all true when all owners are approved and there are no issues", () => {
    const report = makeReport({
      checkResults: [makeCheck({ checkId: "channel_consistency" })]
    });
    const owners: ReadinessInputOwner[] = [
      owner("product", "approved", "Product"),
      owner("crm", "approved", "CRM"),
      owner("legal", "approved", "Legal"),
      owner("risk", "approved", "Risk"),
      owner("localization", "approved", "Localization"),
      owner("analytics", "approved", "Analytics")
    ];

    const readiness = generateLaunchReadiness({ report, owners });

    expect(Object.values(readiness.checklist).every(Boolean)).toBe(true);
  });
});

describe("readiness helpers", () => {
  it("returns the expected required checklist labels", () => {
    expect(getRequiredChecklistItems()).toEqual([
      "Legal reviewed",
      "Risk reviewed",
      "Localization reviewed",
      "CRM assets aligned",
      "Links tested",
      "Analytics/UTM checked",
      "Promo terms finalized"
    ]);
  });

  it("formats owner roles for product, crm, and generic roles", () => {
    expect(formatOwnerRole("product")).toBe("Project / Delivery");
    expect(formatOwnerRole("crm")).toBe("CRM");
    expect(formatOwnerRole("legal")).toBe("Legal");
  });
});
