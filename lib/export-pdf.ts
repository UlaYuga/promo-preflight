import { jsPDF } from "jspdf";
import type { LaunchReadiness, RiskReport } from "@/schemas/index";

// Project design tokens
const $ = {
  bg: "#0b0b0c",
  surf: "#1e1e22",
  ovl: "#26262b",
  fg: "#e4e4e5",
  sub: "#9e9fa0",
  mute: "#5f6060",
  acc: "#5f6dcd",
  pass: "#3dd68c",
  warn: "#e5a00d",
  fail: "#e5534b",
  info: "#4d9cf4",
  border: 0.07, // white alpha for drawColor
} as const;

const M = 14; // page margin
const W = 210; // A4 width
const CW = W - M * 2; // content width

function s(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function ownerLabel(role: string): string {
  return role === "crm" ? "CRM" : role.charAt(0).toUpperCase() + role.slice(1);
}

function sevColor(severity: string): string {
  if (severity === "CRITICAL" || severity === "HIGH") return $.fail;
  if (severity === "MEDIUM") return $.warn;
  return $.info;
}

function verdictColor(status: string): string {
  if (status === "GO" || status === "PASS") return $.pass;
  if (status === "WARN") return $.warn;
  return $.fail;
}

export async function downloadRiskReportPDF(
  report: RiskReport,
  readiness?: LaunchReadiness | null,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  // ── helpers ──
  function bg() {
    doc.setFillColor($.bg);
    doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), "F");
  }

  function card(h: number): number {
    const top = y;
    doc.setFillColor($.surf);
    doc.setDrawColor(255, 255, 255, $.border);
    doc.roundedRect(M, y, CW, h, 1.5, 1.5, "FD");
    return top;
  }

  function hdr(label: string, top: number): number {
    doc.setFontSize(7);
    doc.setTextColor($.mute);
    doc.text(label.toUpperCase(), M + 5, top + 6, { maxWidth: CW - 10 });
    return top + 12;
  }

  function mono(text: string, x: number, yy: number, size = 7, color: string = $.mute) {
    doc.setFont("Courier", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(text, x, yy);
  }

  function body(text: string, x: number, yy: number, size = 9, color: string = $.fg) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(text, x, yy);
  }

  function bodyBold(text: string, x: number, yy: number, size = 10, color: string = $.fg) {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(text, x, yy);
  }

  function badge(label: string, value: number, color: string, x: number, yy: number, w = 38, h = 13) {
    doc.setFillColor($.surf);
    doc.setDrawColor(255, 255, 255, $.border);
    doc.roundedRect(x, yy, w, h, 1, 1, "FD");
    mono(label, x + 3, yy + 5, 6, $.mute);
    bodyBold(String(value), x + 3, yy + 11, 12, color);
  }

  function sevBadge(severity: string, x: number, yy: number) {
    const c = sevColor(severity);
    doc.setDrawColor(
      parseInt(c.slice(1, 3), 16),
      parseInt(c.slice(3, 5), 16),
      parseInt(c.slice(5, 7), 16),
      0.25,
    );
    doc.setFillColor(
      parseInt(c.slice(1, 3), 16),
      parseInt(c.slice(3, 5), 16),
      parseInt(c.slice(5, 7), 16),
      0.1,
    );
    const w = doc.getTextWidth(severity) + 8;
    doc.roundedRect(x, yy - 4, w, 6, 1, 1, "FD");
    mono(severity, x + 4, yy + 0.5, 6, c);
  }

  // ═══════════════════════════════════════════════
  // PAGE 1 — TITLE HEADER
  // ═══════════════════════════════════════════════
  bg();
  y = 16;
  bodyBold("Promo Preflight", M, y, 18, $.fg);
  y += 8;
  body("Risk Report", M, y, 8, $.sub);
  y += 16;

  // ═══════ CAMPAIGN CARD ═══════
  const cTop = card(38);
  y = hdr("Campaign", cTop);
  bodyBold(s(report.campaignName, 60), M + 5, y, 13, $.fg);
  y += 8;
  body(s(report.reportId, 50), M + 5, y, 8, $.sub);
  y += 5;
  body(report.generatedAt.slice(0, 19).replace("T", " "), M + 5, y, 8, $.mute);
  y += 5;
  bodyBold(report.overallStatus, M + 5, y, 12, verdictColor(report.overallStatus));
  y = cTop + 38 + 8;

  // ═══════ SUMMARY CARD ═══════
  const sTop = card(24);
  y = hdr("Summary", sTop);
  badge("Pass", report.counts.pass, $.pass, M + 5, y, 34, 13);
  badge("Warn", report.counts.warn, $.warn, M + 42, y, 34, 13);
  badge("Fail", report.counts.fail, $.fail, M + 79, y, 34, 13);
  badge("Critical", report.counts.criticalBlockers, $.fail, M + 116, y, 34, 13);
  y = sTop + 24 + 8;

  // ═══════ FINDINGS CARD ═══════
  const allIssues = report.checkResults.flatMap((c) =>
    c.issues.map((i) => ({ check: c, issue: i })),
  );

  const rowH = 14;
  const tableH = Math.min(allIssues.length * rowH + 24, 140);
  const fTop = card(tableH + (allIssues.length === 0 ? 16 : 0));
  y = hdr("Findings", fTop);

  if (allIssues.length === 0) {
    body("All checks passed. No issues found.", M + 5, y, 10, $.pass);
    y = fTop + 24 + 20;
  } else {
    // Table header
    mono("CHECK", M + 5, y, 6, $.mute);
    mono("SEV", M + 52, y, 6, $.mute);
    mono("ISSUE", M + 68, y, 6, $.mute);
    mono("OWNER", M + 145, y, 6, $.mute);
    y += 4;
    doc.setDrawColor(255, 255, 255, $.border);
    doc.line(M + 5, y, M + CW - 5, y);
    y += 4;

    for (const row of allIssues) {
      if (y - fTop > tableH) break;
      body(s(row.check.publicName, 28), M + 5, y, 8, $.fg);
      sevBadge(row.issue.severity, M + 52, y - 1);
      body(s(row.issue.detectedIssue, 48), M + 68, y, 8, $.sub);
      mono(ownerLabel(row.issue.ownerSuggestion ?? "product"), M + 145, y, 7, $.mute);
      y += rowH;
    }
    y = fTop + tableH + 8;
  }

  // ═══════ LAUNCH READINESS CARD ═══════
  if (readiness && readiness.blockers.length > 0) {
    if (y + 60 > doc.internal.pageSize.getHeight() - M) {
      doc.addPage();
      bg();
      y = M;
    }
    const lTop = card(18 + Math.min(readiness.blockers.length, 4) * 8);
    y = hdr("Readiness", lTop);
    body(`${readiness.state}  ·  ${readiness.blockers.length} blockers`, M + 5, y, 9, verdictColor(readiness.state));
    y += 6;
    for (const b of readiness.blockers.slice(0, 4)) {
      body("•", M + 8, y, 8, $.fail);
      body(s(b.title, 90), M + 14, y, 8, $.sub);
      y += 8;
    }
    y = lTop + 18 + Math.min(readiness.blockers.length, 4) * 8 + 8;
  }

  // ═══════ FOOTER ═══════
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor($.mute);
    doc.text(
      `Promo Preflight  ·  ${s(report.campaignName, 35)}  ·  ${i}/${pages}`,
      M,
      doc.internal.pageSize.getHeight() - 6,
    );
    // Top accent line
    doc.setDrawColor(
      parseInt($.acc.slice(1, 3), 16),
      parseInt($.acc.slice(3, 5), 16),
      parseInt($.acc.slice(5, 7), 16),
      0.4,
    );
    doc.setLineWidth(0.4);
    doc.line(M, 10, W - M, 10);
  }

  // ═══════ SAVE ═══════
  const today = new Date().toISOString().slice(0, 10);
  const safeName = report.campaignName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "report";
  doc.save(`preflight-${safeName}-${today}.pdf`);
}
