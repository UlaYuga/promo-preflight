import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { LaunchReadiness, RiskReport } from "@/schemas/index";

const C = {
  bg: "#0b0b0c", surf: "#1e1e22", fg: "#e4e4e5",
  sub: "#9e9fa0", mute: "#5f6060", acc: "#5f6dcd",
  pass: "#3dd68c", warn: "#e5a00d", fail: "#e5534b",
} as const;

function sanitize(value: string, max = 180): string {
  const n = value.replace(/\s+/g, " ").trim();
  return n.length <= max ? n : `${n.slice(0, max - 1)}…`;
}

function ownerLabel(role: string): string {
  return role === "crm" ? "CRM" : role.charAt(0).toUpperCase() + role.slice(1);
}

function severityHex(severity: string): string {
  if (severity === "CRITICAL" || severity === "HIGH") return C.fail;
  if (severity === "MEDIUM") return C.warn;
  return C.pass;
}

function verdictHex(status: string): string {
  if (status === "GO" || status === "PASS") return C.pass;
  if (status === "WARN") return C.warn;
  return C.fail;
}

export async function downloadRiskReportPDF(
  report: RiskReport,
  readiness?: LaunchReadiness | null,
) {
  const MARGIN = 16;
  const PAGE_W = 210;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Helper: section header bar
  function hdr(title: string) {
    doc.setFillColor(C.surf);
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 9, "F");
    doc.setFontSize(8);
    doc.setTextColor(C.mute);
    doc.text(title.toUpperCase(), MARGIN + 3, y + 6.5);
    y += 14;
  }

  // Helper: label + value pair
  function meta(label: string, value: string) {
    doc.setFontSize(9);
    doc.setTextColor(C.mute);
    doc.text(label, MARGIN, y);
    doc.setTextColor(C.fg);
    doc.text(value, MARGIN + 38, y);
    y += 6;
  }

  // ═══ TITLE ═══
  doc.setFillColor(C.bg);
  doc.rect(0, 0, PAGE_W, 38, "F");
  doc.setFontSize(20);
  doc.setTextColor(C.fg);
  doc.text("Promo Preflight", MARGIN, 18);
  doc.setFontSize(9);
  doc.setTextColor(C.sub);
  doc.text("Risk Report", MARGIN, 27);
  y = 44;

  // ═══ CAMPAIGN ═══
  hdr("Campaign");
  meta("Campaign", sanitize(report.campaignName, 60));
  meta("Report ID", sanitize(report.reportId, 50));
  meta("Date", report.generatedAt.slice(0, 19).replace("T", " "));
  const verdictColor = verdictHex(report.overallStatus);
  doc.setFontSize(13);
  doc.setTextColor(verdictColor);
  doc.text(report.overallStatus, MARGIN + 38, y);
  y += 10;

  // ═══ SUMMARY BADGES ═══
  y += 4;
  hdr("Summary");
  const badges = [
    { label: "Pass", value: report.counts.pass, color: C.pass },
    { label: "Warn", value: report.counts.warn, color: C.warn },
    { label: "Fail", value: report.counts.fail, color: C.fail },
  ];
  let colX = MARGIN;
  for (const b of badges) {
    doc.setFillColor(C.surf);
    doc.rect(colX, y, 44, 13, "F");
    doc.setFontSize(8);
    doc.setTextColor(C.mute);
    doc.text(b.label, colX + 3, y + 5);
    doc.setFontSize(14);
    doc.setTextColor(b.color);
    doc.text(String(b.value), colX + 3, y + 11);
    colX += 47;
  }
  y += 18;

  // ═══ FINDINGS TABLE ═══
  hdr("Findings");
  // Collect all issues across all check results
  const allIssues = report.checkResults.flatMap((check) =>
    check.issues.map((issue) => ({ check, issue })),
  );

  if (allIssues.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(C.pass);
    doc.text("All checks passed. No issues found.", MARGIN, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Check", "Severity", "Issue", "Owner"]],
      body: allIssues.map((row) => [
        sanitize(row.check.publicName, 35),
        row.issue.severity,
        sanitize(row.issue.detectedIssue, 55),
        ownerLabel(row.issue.ownerSuggestion ?? "product"),
      ]),
      theme: "plain",
      headStyles: { fillColor: C.surf, textColor: C.mute, fontSize: 8 },
      bodyStyles: { fillColor: C.bg, textColor: C.sub, fontSize: 9 },
      alternateRowStyles: { fillColor: "#121216" },
      styles: { lineColor: [255, 255, 255, 0.07] as unknown as [number, number, number], lineWidth: 0.2 },
      didParseCell: (hook: { section: string; column: { index: number }; cell: { raw: unknown; styles: { textColor: string } } }) => {
        if (hook.section === "body" && hook.column.index === 1) {
          hook.cell.styles.textColor = severityHex(String(hook.cell.raw));
        }
      },
    // jspdf-autotable type limitations require cast for color arrays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ═══ LAUNCH READINESS ═══
  if (readiness) {
    hdr("Launch Readiness");
    meta("State", readiness.state);
    for (const blocker of readiness.blockers.slice(0, 6)) {
      doc.setFontSize(8);
      doc.setTextColor(C.fail);
      doc.text("●", MARGIN + 2, y + 1);
      doc.setTextColor(C.sub);
      doc.text(sanitize(blocker.title, 90), MARGIN + 8, y + 1);
      y += 5;
    }
  }

  // ═══ FOOTER ═══
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(C.mute);
    doc.text(
      `Promo Preflight  ·  ${sanitize(report.campaignName, 35)}  ·  ${i}/${pages}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 8,
    );
  }

  // ═══ SAVE ═══
  const today = new Date().toISOString().slice(0, 10);
  const safeName = report.campaignName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "report";
  doc.save(`preflight-${safeName}-${today}.pdf`);
}
