import {
  LaunchReadinessSchema,
  RiskReportSchema,
  type Blocker,
  type CheckIssue,
  type CheckResult,
  type CheckSeverity,
  type Dependency,
  type LaunchReadiness,
  type OwnerRole,
  type OwnerStatus,
  type ReadinessOwner,
  type ReadinessState,
  type RiskReport,
  type CampaignBundle
} from "../schemas/index";

export type ReadinessInputOwner = CampaignBundle["owners"][number];

type IssueRow = {
  check: CheckResult;
  issue: CheckIssue;
};

const ownerRoles: OwnerRole[] = [
  "product",
  "crm",
  "legal",
  "risk",
  "localization",
  "analytics"
];

const requiredChecklistItems = [
  "Legal reviewed",
  "Risk reviewed",
  "Localization reviewed",
  "CRM assets aligned",
  "Links tested",
  "Analytics/UTM checked",
  "Promo terms finalized"
];

const coreCheckIds = new Set([
  "channel_consistency",
  "terms_robustness",
  "jurisdictional_risk_signals",
  "localization_qa"
]);

const defaultOwnerByCheckId: Record<string, OwnerRole> = {
  channel_consistency: "crm",
  terms_robustness: "legal",
  offer_math_sanity: "product",
  jurisdictional_risk_signals: "risk",
  localization_qa: "localization",
  launch_ownership: "product",
  link_qa: "analytics",
  format_qa: "crm"
};

const lowConfidenceThreshold = 0.75;

export function generateLaunchReadiness({
  report,
  owners = []
}: Readonly<{
  report: RiskReport;
  owners?: ReadinessInputOwner[];
}>): LaunchReadiness {
  const validatedReport = RiskReportSchema.parse(report);
  const ownersByRole = createOwnerMap(owners);
  const issueRows = getActionableIssueRows(validatedReport);
  const failRows = issueRows.filter(({ check }) => check.status === "FAIL");
  const warnRows = issueRows.filter(({ check }) => check.status === "WARN");
  const legalRiskOwnerBlockers = getLegalRiskOwnerBlockers(
    validatedReport,
    issueRows,
    ownersByRole
  );
  const blockers = [
    ...failRows.map(({ check, issue }, index) =>
      issueToBlocker(validatedReport, check, issue, index)
    ),
    ...legalRiskOwnerBlockers
  ];
  const dependencies = warnRows.map(({ check, issue }, index) =>
    issueToDependency(check, issue, ownersByRole, index)
  );
  const ownersMatrix = createOwnerMatrix({
    report: validatedReport,
    ownersByRole,
    issueRows,
    blockers
  });
  const state = determineReadinessState(validatedReport, blockers);
  const checklist = createChecklist(ownersMatrix, blockers, dependencies);

  return LaunchReadinessSchema.parse({
    readinessId: createReadinessId(validatedReport.reportId),
    campaignName: validatedReport.campaignName,
    state,
    owners: ownersMatrix,
    blockers,
    dependencies,
    checklist
  });
}

export function getRequiredChecklistItems() {
  return requiredChecklistItems;
}

export function formatOwnerRole(role: OwnerRole) {
  if (role === "product") {
    return "Project / Delivery";
  }

  if (role === "crm") {
    return "CRM";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getActionableIssueRows(report: RiskReport): IssueRow[] {
  return report.checkResults
    .filter((check) => check.status === "FAIL" || check.status === "WARN")
    .flatMap((check) => check.issues.map((issue) => ({ check, issue })));
}

function createOwnerMap(owners: ReadinessInputOwner[]) {
  return new Map(
    owners
      .filter((owner) => ownerRoles.includes(owner.role))
      .map((owner) => [owner.role, owner])
  );
}

function issueToBlocker(
  report: RiskReport,
  check: CheckResult,
  issue: CheckIssue,
  index: number
): Blocker {
  return {
    blockerId: `${createReadinessId(report.reportId)}-blocker-${index + 1}`,
    title: truncateActionText(issue.detectedIssue, 180),
    sourceCheckId: check.checkId,
    severity: issue.severity,
    ownerRole: getIssueOwnerRole(check, issue),
    requiredAction: truncateActionText(issue.suggestedFix, 260),
    status: "open",
    dueDate: getDueDate(report.generatedAt, issue.severity)
  };
}

function issueToDependency(
  check: CheckResult,
  issue: CheckIssue,
  ownersByRole: Map<OwnerRole, ReadinessInputOwner>,
  index: number
): Dependency {
  const ownerRole = getIssueOwnerRole(check, issue);
  const owner = ownersByRole.get(ownerRole);

  return {
    dependencyId: `${check.checkId}-review-${index + 1}`,
    dependency: `Review: ${truncateActionText(issue.detectedIssue, 160)}`,
    dependsOn: check.publicName,
    ownerRole,
    status: owner?.status === "approved" ? "resolved" : "open",
    notes: truncateActionText(issue.suggestedFix, 220)
  };
}

function getLegalRiskOwnerBlockers(
  report: RiskReport,
  issueRows: IssueRow[],
  ownersByRole: Map<OwnerRole, ReadinessInputOwner>
): Blocker[] {
  const blockers: Blocker[] = [];

  for (const { check, issue } of issueRows) {
    const ownerRole = getIssueOwnerRole(check, issue);

    if (ownerRole !== "legal" && ownerRole !== "risk") {
      continue;
    }

    const owner = ownersByRole.get(ownerRole);
    const hasOwnerName = Boolean(owner?.name?.trim());

    if (hasOwnerName) {
      continue;
    }

    blockers.push({
      blockerId: `${createReadinessId(report.reportId)}-${issue.issueId}-missing-${ownerRole}`,
      title: `Missing ${formatOwnerRole(ownerRole)} owner for ${check.publicName}`,
      sourceCheckId: check.checkId,
      severity: issue.severity === "LOW" ? "MEDIUM" : issue.severity,
      ownerRole,
      requiredAction: `Assign a ${formatOwnerRole(ownerRole)} owner before the final package.`,
      status: "open",
      dueDate: getDueDate(report.generatedAt, issue.severity)
    });
  }

  return blockers;
}

function createOwnerMatrix({
  report,
  ownersByRole,
  issueRows,
  blockers
}: Readonly<{
  report: RiskReport;
  ownersByRole: Map<OwnerRole, ReadinessInputOwner>;
  issueRows: IssueRow[];
  blockers: Blocker[];
}>): ReadinessOwner[] {
  return ownerRoles.map((role) => {
    const owner = ownersByRole.get(role);
    const linkedIssueIds = Array.from(
      new Set(
        issueRows
          .filter(({ check, issue }) => getIssueOwnerRole(check, issue) === role)
          .map(({ issue }) => issue.issueId)
      )
    );
    const hasLinkedBlocker = blockers.some((blocker) => blocker.ownerRole === role);
    const status = getReadinessOwnerStatus(
      owner?.status,
      linkedIssueIds.length,
      hasLinkedBlocker
    );

    return {
      role,
      name: owner?.name?.trim() || formatOwnerRole(role),
      status,
      linkedIssueIds,
      dueDate: owner?.dueDate ?? getOwnerDueDate(report.generatedAt, status, role),
      notes:
        owner?.notes ??
        getOwnerNotes(status, linkedIssueIds.length, hasLinkedBlocker)
    };
  });
}

function getReadinessOwnerStatus(
  currentStatus: OwnerStatus | undefined,
  linkedIssueCount: number,
  hasLinkedBlocker: boolean
): OwnerStatus {
  if (currentStatus === "blocked" || hasLinkedBlocker) {
    return "blocked";
  }

  if (currentStatus === "approved" && linkedIssueCount === 0) {
    return "approved";
  }

  if (linkedIssueCount > 0 || currentStatus === "pending") {
    return "pending";
  }

  return currentStatus ?? "not_required";
}

function getIssueOwnerRole(check: CheckResult, issue: CheckIssue): OwnerRole {
  return issue.ownerSuggestion ?? defaultOwnerByCheckId[check.checkId] ?? "product";
}

function determineReadinessState(
  report: RiskReport,
  blockers: Blocker[]
): ReadinessState {
  if (hasParsingErrorOrLowCoreConfidence(report)) {
    return "NEEDS_REVIEW";
  }

  if (
    blockers.some(
      (blocker) =>
        blocker.status === "open" &&
        (blocker.severity === "CRITICAL" || blocker.severity === "HIGH")
    )
  ) {
    return "BLOCKED";
  }

  if (report.counts.fail === 0 && report.counts.warn > 0) {
    return "READY_WITH_WARNINGS";
  }

  if (report.counts.fail === 0 && report.counts.warn === 0) {
    return "READY";
  }

  return "NEEDS_REVIEW";
}

function hasParsingErrorOrLowCoreConfidence(report: RiskReport) {
  return report.checkResults.some(
    (check) =>
      Boolean(check.parsingError) ||
      (coreCheckIds.has(check.checkId) &&
        check.confidence < lowConfidenceThreshold)
  );
}

function createChecklist(
  owners: ReadinessOwner[],
  blockers: Blocker[],
  dependencies: Dependency[]
) {
  const hasBlockerForOwner = (role: OwnerRole) =>
    blockers.some((blocker) => blocker.ownerRole === role);
  const hasDependencyForOwner = (role: OwnerRole) =>
    dependencies.some((dependency) => dependency.ownerRole === role);
  const ownerStatus = (role: OwnerRole) =>
    owners.find((owner) => owner.role === role)?.status;

  return {
    "Legal reviewed":
      ownerStatus("legal") === "approved" && !hasBlockerForOwner("legal"),
    "Risk reviewed":
      ownerStatus("risk") === "approved" && !hasBlockerForOwner("risk"),
    "Localization reviewed":
      ownerStatus("localization") === "approved" &&
      !hasDependencyForOwner("localization"),
    "CRM assets aligned":
      !hasBlockerForOwner("crm") && !hasDependencyForOwner("crm"),
    "Links tested":
      !dependencies.some((dependency) => dependency.ownerRole === "analytics"),
    "Analytics/UTM checked":
      ownerStatus("analytics") === "approved" &&
      !hasDependencyForOwner("analytics"),
    "Promo terms finalized":
      !blockers.some((blocker) => blocker.sourceCheckId === "terms_robustness")
  };
}

function getOwnerDueDate(
  generatedAt: string,
  status: OwnerStatus,
  role: OwnerRole
) {
  if (status === "approved" || status === "not_required") {
    return undefined;
  }

  return getDueDate(
    generatedAt,
    role === "legal" || role === "risk" ? "HIGH" : "MEDIUM"
  );
}

function getOwnerNotes(
  status: OwnerStatus,
  linkedIssueCount: number,
  hasLinkedBlocker: boolean
) {
  if (hasLinkedBlocker) {
    return "Resolve linked blockers before go/no-go review.";
  }

  if (linkedIssueCount > 0) {
    return "Review linked issues and confirm the final package path.";
  }

  if (status === "approved") {
    return "No linked readiness action.";
  }

  if (status === "not_required") {
    return "No action generated from the current Risk Report.";
  }

  return "Confirm owner status before the final package.";
}

function getDueDate(generatedAt: string, severity: CheckSeverity) {
  const date = new Date(generatedAt);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const daysBySeverity: Record<CheckSeverity, number> = {
    CRITICAL: 1,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3
  };

  date.setUTCDate(date.getUTCDate() + daysBySeverity[severity]);

  return date.toISOString().slice(0, 10);
}

function createReadinessId(reportId: string) {
  return `readiness-${reportId}`;
}

function truncateActionText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}
