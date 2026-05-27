import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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

const PDF = {
  bg: "#0b0b0c", surf: "#1e1e22", fg: "#e4e4e5",
  sub: "#9e9fa0", mute: "#5f6060", acc: "#5f6dcd",
  pass: "#3dd68c", warn: "#e5a00d", fail: "#e5534b",
} as const;

export async function downloadRiskReportPDF(
  report: RiskReport,
  readiness?: LaunchReadiness | null,
) {
  const M = 16, W = 210;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = M;

  function Hdr(title: string) {
    doc.setFillColor(PDF.surf);
    doc.rect(M, y, W - M * 2, 9, "F");
    doc.setFontSize(8); doc.setTextColor(PDF.mute);
    doc.text(title.toUpperCase(), M + 3, y + 6.5);
    y += 14;
  }

  function Meta(label: string, value: string) {
    doc.setFontSize(9); doc.setTextColor(PDF.mute);
    doc.text(label, M, y);
    doc.setTextColor(PDF.fg);
    doc.text(value, M + 38, y);
    y += 6;
  }

  doc.setFillColor(PDF.bg); doc.rect(0, 0, W, 40, "F");
  doc.setFontSize(20); doc.setTextColor(PDF.fg);
  doc.text("Promo Preflight", M, 18);
  doc.setFontSize(9); doc.setTextColor(PDF.sub);
  doc.text("Risk Report", M, 28);
  y = 44;

  Hdr("Campaign");
  Meta("Campaign", sanitizeLine(report.campaignName, 60));
  Meta("Report ID", sanitizeLine(report.reportId, 50));
  Meta("Date", report.generatedAt.slice(0, 19).replace("T", " "));
  const vc = report.overallStatus === "PASS" ? PDF.pass
    : report.overallStatus === "WARN" ? PDF.warn : PDF.fail;
  doc.setFontSize(13); doc.setTextColor(vc);
  doc.text(report.overallStatus, M + 38, y); y += 10;

  Hdr("Summary");
  const bs = [
    { l: "Pass", v: report.counts.pass, c: PDF.pass },
    { l: "Warn", v: report.counts.warn, c: PDF.warn },
    { l: "Fail", v: report.counts.fail, c: PDF.fail },
  ];
  let bx = M;
  for (const b of bs) {
    doc.setFillColor(PDF.surf); doc.rect(bx, y, 44, 13, "F");
    doc.setFontSize(8); doc.setTextColor(PDF.mute); doc.text(b.l, bx + 3, y + 5);
    doc.setFontSize(14); doc.setTextColor(b.c); doc.text(String(b.v), bx + 3, y + 11);
    bx += 47;
  }
  y += 18;

  Hdr("Findings");
  const rows = getIssueRows(report);

  if (rows.length === 0) {
    doc.setFontSize(10); doc.setTextColor(PDF.pass);
    doc.text("All checks passed.", M, y);
  } else {
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [["Check", "Severity", "Issue", "Owner"]],
      body: rows.map((r) => [
        sanitizeLine(r.check.publicName, 35),
        r.issue.severity,
        sanitizeLine(r.issue.detectedIssue, 55),
        formatOwnerRole(getIssueOwner(r)),
      ]),
      theme: "plain",
      headStyles: { fillColor: PDF.surf, textColor: PDF.mute, fontSize: 8 },
      bodyStyles: { fillColor: PDF.bg, textColor: PDF.sub, fontSize: 9 },
      alternateRowStyles: { fillColor: "#121216" },
      styles: { lineColor: [255, 255, 255, 6], lineWidth: 0.2 },
      didParseCell: (hook: any) => {
        if (hook.section === "body" && hook.column.index === 1) {
          const s = String(hook.cell.raw);
          hook.cell.styles.textColor =
            s === "CRITICAL" || s === "HIGH" ? PDF.fail
            : s === "MEDIUM" ? PDF.warn : PDF.pass;
        }
      },
    });
  }

  if (readiness) {
    Hdr("Launch Readiness");
    Meta("State", readiness.state);
    for (const b of readiness.blockers.slice(0, 5)) {
      doc.setFontSize(8); doc.setTextColor(PDF.fail);
      doc.text("●", M + 2, y + 1);
      doc.setTextColor(PDF.sub);
      doc.text(sanitizeLine(b.description, 90), M + 8, y + 1);
      y += 5;
    }
  }

  const tp = doc.getNumberOfPages();
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(PDF.mute);
    doc.text(
      `Promo Preflight  ·  ${sanitizeLine(report.campaignName, 35)}  ·  ${i}/${tp}`,
      M, doc.internal.pageSize.getHeight() - 8,
    );
  }

  const d = new Date().toISOString().slice(0, 10);
  const n = report.campaignName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "report";
  doc.save(`preflight-${n}-${d}.pdf`);
}

const C = {
  bg: "#0b0b0c", surf: "#1e1e22", fg: "#e4e4e5",
  sub: "#9e9fa0", mute: "#5f6060", acc: "#5f6dcd",
  pass: "#3dd68c", warn: "#e5a00d", fail: "#e5534b",
} as const;

export async function downloadRiskReportPDF(
  report: RiskReport,
  readiness?: LaunchReadiness | null,
) {
  const M = 16, W = 210, doc = new jsPDF({ unit: "mm", format: "a4" }); let y = M;

  function H(t: string) { doc.setFillColor(C.surf); doc.rect(M, y, W - M * 2, 9, "F"); doc.setFontSize(8); doc.setTextColor(C.mute); doc.text(t.toUpperCase(), M + 3, y + 6.5); y += 14; }
  function L(l: string, v: string) { doc.setFontSize(9); doc.setTextColor(C.mute); doc.text(l, M, y); doc.setTextColor(C.fg); doc.text(v, M + 38, y); y += 6; }
  function sc(s: string) { return s === "CRITICAL" || s === "HIGH" ? C.fail : s === "MEDIUM" ? C.warn : C.pass; }

  doc.setFillColor(C.bg); doc.rect(0, 0, W, 40, "F");
  doc.setFontSize(20); doc.setTextColor(C.fg); doc.text("Promo Preflight", M, 18);
  doc.setFontSize(9); doc.setTextColor(C.sub); doc.text("Risk Report", M, 28); y = 44;

  H("Campaign");
  L("Campaign", sanitizeLine(report.campaignName, 60));
  L("Report ID", sanitizeLine(report.reportId, 50));
  L("Date", report.generatedAt.slice(0, 19).replace("T", " "));
  const vc = report.overallStatus === "PASS" ? C.pass : report.overallStatus === "WARN" ? C.warn : C.fail;
  doc.setFontSize(13); doc.setTextColor(vc); doc.text(report.overallStatus, M + 38, y); y += 10;

  y += 4; H("Summary");
  const bs = [{ l: "Pass", v: report.counts.pass, c: C.pass }, { l: "Warn", v: report.counts.warn, c: C.warn }, { l: "Fail", v: report.counts.fail, c: C.fail }];
  let bx = M;
  for (const b of bs) { doc.setFillColor(C.surf); doc.rect(bx, y, 44, 13, "F"); doc.setFontSize(8); doc.setTextColor(C.mute); doc.text(b.l, bx + 3, y + 5); doc.setFontSize(14); doc.setTextColor(b.c); doc.text(String(b.v), bx + 3, y + 11); bx += 47; }
  y += 18;

  H("Findings");
  const rows = getIssueRows(report);
  if (rows.length === 0) { doc.setFontSize(10); doc.setTextColor(C.pass); doc.text("All checks passed.", M, y); y += 8; }
  else {
    autoTable(doc, { startY: y, margin: { left: M, right: M }, head: [["Check", "Severity", "Issue", "Owner"]],
      body: rows.map(r => [sanitizeLine(r.check.publicName, 35), r.issue.severity, sanitizeLine(r.issue.detectedIssue, 55), formatOwnerRole(getIssueOwner(r))]),
      theme: "plain", headStyles: { fillColor: C.surf, textColor: C.mute, fontSize: 8 },
      bodyStyles: { fillColor: C.bg, textColor: C.sub, fontSize: 9 }, alternateRowStyles: { fillColor: "#121216" },
      styles: { lineColor: [255,255,255,6], lineWidth: 0.2 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (readiness) { H("Launch Readiness"); L("State", readiness.state);
    for (const b of readiness.blockers.slice(0, 5)) { doc.setFontSize(8); doc.setTextColor(C.fail); doc.text("●", M + 2, y + 1); doc.setTextColor(C.sub); doc.text(sanitizeLine(b.description, 90), M + 8, y + 1); y += 5; } }

  const tp = doc.getNumberOfPages();
  for (let i = 1; i <= tp; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(C.mute); doc.text(`Promo Preflight  ·  ${sanitizeLine(report.campaignName, 35)}  ·  ${i}/${tp}`, M, doc.internal.pageSize.getHeight() - 8); }
  const d = new Date().toISOString().slice(0, 10), n = report.campaignName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "report";
  doc.save(`preflight-${n}-${d}.pdf`);
}
