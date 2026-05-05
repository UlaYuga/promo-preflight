import {
  ExportPayloadSchema,
  type CheckIssue,
  type CheckResult,
  type CheckSeverity,
  type ExportPayloadInput,
  type LaunchReadiness,
  type OwnerRole,
  type RiskReport
} from "@/schemas/index";

type IssueRow = {
  check: CheckResult;
  issue: CheckIssue;
};

const severityOrder: Record<CheckSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

const ownerFallbackByCheckId: Record<string, OwnerRole> = {
  channel_consistency: "crm",
  terms_robustness: "legal",
  offer_math_sanity: "product",
  jurisdictional_risk_signals: "risk",
  localization_qa: "localization",
  launch_ownership: "product",
  link_qa: "analytics",
  format_qa: "crm"
};

export function formatExportPayload(payload: ExportPayloadInput) {
  const validatedPayload = ExportPayloadSchema.parse(payload);

  if (validatedPayload.format === "markdown") {
    return formatMarkdownExport(validatedPayload);
  }

  return formatSlackReadyExport(validatedPayload);
}

export function formatMarkdownExport(payload: ExportPayloadInput) {
  const { report, readiness } = ExportPayloadSchema.parse({
    ...payload,
    format: "markdown"
  });
  const issueRows = getIssueRows(report);
  const lines = [
    `# Promo Preflight Risk Report: ${sanitizeLine(report.campaignName)}`,
    "",
    "## Metadata",
    `- Campaign: ${sanitizeLine(report.campaignName)}`,
    `- Report ID: ${sanitizeLine(report.reportId)}`,
    `- Generated: ${sanitizeLine(report.generatedAt)}`,
    `- Overall status: ${report.overallStatus}`,
    `- Counts: ${formatCounts(report)}`,
    "",
    "## Check Summaries",
    ...report.checkResults.map(
      (check) =>
        `- ${sanitizeLine(check.publicName)} (${check.status}): ${sanitizeLine(
          check.summary,
          220
        )}`
    ),
    "",
    "## Issues"
  ];

  if (issueRows.length === 0) {
    lines.push("- No actionable issues.");
  } else {
    for (const severity of Object.keys(severityOrder) as CheckSeverity[]) {
      const rows = issueRows.filter((row) => row.issue.severity === severity);

      if (rows.length === 0) {
        continue;
      }

      lines.push("", `### ${severity}`);

      for (const { check, issue } of rows) {
        lines.push(
          `- ${sanitizeLine(issue.detectedIssue, 240)}`,
          `  - Source check: ${sanitizeLine(check.publicName)} (${sanitizeLine(
            check.checkId
          )})`,
          `  - Owner: ${formatOwnerRole(getIssueOwner(check, issue))}`,
          `  - Blocker: ${issue.blocker ? "Yes" : "No"}`,
          `  - Suggested fix: ${sanitizeLine(issue.suggestedFix, 260)}`,
          `  - Evidence snippets: ${formatEvidence(issue)}`
        );
      }
    }
  }

  lines.push("", ...formatMarkdownReadiness(readiness));

  return trimExport(lines);
}

export function formatSlackReadyExport(payload: ExportPayloadInput) {
  const { report, readiness } = ExportPayloadSchema.parse({
    ...payload,
    format: "slack"
  });
  const issueRows = getIssueRows(report);
  const ownerGroups = groupIssuesByOwner(issueRows);
  const lines = [
    `Promo Preflight handoff: ${sanitizeLine(report.campaignName)}`,
    `Status: ${report.overallStatus} | ${formatCounts(report)}`,
    `Report: ${sanitizeLine(report.reportId)} | Generated: ${sanitizeLine(
      report.generatedAt
    )}`
  ];

  if (readiness) {
    lines.push(
      `Readiness: ${readiness.state} | Blockers: ${readiness.blockers.length} | Dependencies: ${readiness.dependencies.length}`
    );
  }

  lines.push("", "Owner handoff");

  if (ownerGroups.length === 0) {
    lines.push("- No owner actions generated from the current Risk Report.");
  } else {
    for (const group of ownerGroups) {
      lines.push("", `${formatOwnerRole(group.owner)}`);

      for (const { check, issue } of group.rows) {
        lines.push(
          `- [${issue.severity}${issue.blocker ? " blocker" : ""}] ${sanitizeLine(
            issue.detectedIssue,
            220
          )}`,
          `  Check: ${sanitizeLine(check.publicName)}`,
          `  Suggested fix: ${sanitizeLine(issue.suggestedFix, 240)}`,
          `  Evidence: ${formatEvidence(issue)}`,
          `  Blocker flag: ${issue.blocker ? "yes" : "no"}`
        );
      }
    }
  }

  if (readiness) {
    lines.push("", ...formatSlackReadiness(readiness));
  }

  return trimExport(lines);
}

function getIssueRows(report: RiskReport): IssueRow[] {
  return report.checkResults
    .flatMap((check) => check.issues.map((issue) => ({ check, issue })))
    .sort((a, b) => {
      const severityDiff =
        severityOrder[a.issue.severity] - severityOrder[b.issue.severity];

      if (severityDiff !== 0) {
        return severityDiff;
      }

      const blockerDiff = Number(b.issue.blocker) - Number(a.issue.blocker);

      if (blockerDiff !== 0) {
        return blockerDiff;
      }

      return a.check.publicName.localeCompare(b.check.publicName);
    });
}

function groupIssuesByOwner(issueRows: IssueRow[]) {
  const groups = new Map<OwnerRole, IssueRow[]>();

  for (const row of issueRows) {
    const owner = getIssueOwner(row.check, row.issue);
    groups.set(owner, [...(groups.get(owner) ?? []), row]);
  }

  return Array.from(groups.entries())
    .map(([owner, rows]) => ({ owner, rows }))
    .sort((a, b) => formatOwnerRole(a.owner).localeCompare(formatOwnerRole(b.owner)));
}

function getIssueOwner(check: CheckResult, issue: CheckIssue): OwnerRole {
  return issue.ownerSuggestion ?? ownerFallbackByCheckId[check.checkId] ?? "product";
}

function formatMarkdownReadiness(readiness?: LaunchReadiness) {
  if (!readiness) {
    return ["## Launch Readiness", "- Not included for this export."];
  }

  const lines = [
    "## Launch Readiness",
    `- State: ${readiness.state}`,
    `- Blockers: ${readiness.blockers.length}`,
    `- Dependencies: ${readiness.dependencies.length}`,
    "",
    "### Readiness Blockers"
  ];

  if (readiness.blockers.length === 0) {
    lines.push("- No readiness blockers.");
  } else {
    for (const blocker of readiness.blockers) {
      lines.push(
        `- ${sanitizeLine(blocker.title, 220)}`,
        `  - Severity: ${blocker.severity}`,
        `  - Owner: ${
          blocker.ownerRole ? formatOwnerRole(blocker.ownerRole) : "Unassigned"
        }`,
        `  - Source check: ${sanitizeLine(blocker.sourceCheckId)}`,
        `  - Required action: ${sanitizeLine(blocker.requiredAction, 240)}`,
        `  - Status: ${blocker.status}`
      );
    }
  }

  if (readiness.dependencies.length > 0) {
    lines.push("", "### Dependencies");

    for (const dependency of readiness.dependencies) {
      lines.push(
        `- ${sanitizeLine(dependency.dependency, 220)}`,
        `  - Owner: ${
          dependency.ownerRole
            ? formatOwnerRole(dependency.ownerRole)
            : "Unassigned"
        }`,
        `  - Depends on: ${sanitizeLine(dependency.dependsOn ?? "Risk Report")}`,
        `  - Status: ${dependency.status}`,
        `  - Notes: ${sanitizeLine(
          dependency.notes ?? "Owner review required.",
          220
        )}`
      );
    }
  }

  return lines;
}

function formatSlackReadiness(readiness: LaunchReadiness) {
  const lines = ["Readiness blockers"];

  if (readiness.blockers.length === 0) {
    lines.push("- None.");
  } else {
    for (const blocker of readiness.blockers) {
      lines.push(
        `- [${blocker.severity}] ${sanitizeLine(blocker.title, 200)}`,
        `  Owner: ${
          blocker.ownerRole ? formatOwnerRole(blocker.ownerRole) : "Unassigned"
        } | Check: ${sanitizeLine(blocker.sourceCheckId)} | Status: ${
          blocker.status
        }`,
        `  Action: ${sanitizeLine(blocker.requiredAction, 220)}`
      );
    }
  }

  if (readiness.dependencies.length > 0) {
    lines.push("", "Readiness dependencies");

    for (const dependency of readiness.dependencies) {
      lines.push(
        `- ${sanitizeLine(dependency.dependency, 200)}`,
        `  Owner: ${
          dependency.ownerRole
            ? formatOwnerRole(dependency.ownerRole)
            : "Unassigned"
        } | Status: ${dependency.status} | Notes: ${sanitizeLine(
          dependency.notes ?? "Owner review required.",
          200
        )}`
      );
    }
  }

  return lines;
}

function formatEvidence(issue: CheckIssue) {
  if (issue.evidence.length === 0) {
    return "None provided.";
  }

  return issue.evidence
    .slice(0, 3)
    .map((item) => {
      const field = formatEvidenceField(item.field);
      const snippet = sanitizeEvidenceSnippet(item.field, item.snippet);

      return `${field}: "${snippet}"`;
    })
    .join("; ");
}

function formatEvidenceField(field: string) {
  if (field.toLowerCase() === "termstext") {
    return "T&C source";
  }

  return sanitizeLine(field, 80);
}

function sanitizeEvidenceSnippet(field: string, snippet: string) {
  const normalizedField = field.toLowerCase();

  if (normalizedField === "termstext") {
    const sanitizedSnippet = sanitizeLine(snippet, 32);

    if (sanitizedSnippet.length < snippet.trim().length) {
      return sanitizedSnippet;
    }

    return `${sanitizedSnippet.slice(0, Math.max(1, sanitizedSnippet.length - 1))}...`;
  }

  return sanitizeLine(snippet, 160);
}

function formatCounts(report: RiskReport) {
  return `PASS ${report.counts.pass}, WARN ${report.counts.warn}, FAIL ${report.counts.fail}, N/A ${report.counts.notApplicable}, critical blockers ${report.counts.criticalBlockers}`;
}

function formatOwnerRole(role: OwnerRole) {
  if (role === "crm") {
    return "CRM";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function sanitizeLine(value: string, maxLength = 180) {
  const normalized = value
    .replace(/```/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}...`;
}

function trimExport(lines: string[]) {
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}
