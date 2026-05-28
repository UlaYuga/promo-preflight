import type { LaunchReadiness, RiskReport } from "@/schemas/index";

const C = {
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
  border: "rgba(255,255,255,0.07)",
};

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function s(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function ownerLabel(role: string): string {
  return role === "crm" ? "CRM" : role.charAt(0).toUpperCase() + role.slice(1);
}

function sevClass(severity: string): string {
  if (severity === "CRITICAL" || severity === "HIGH") return "critical";
  if (severity === "MEDIUM") return "medium";
  return "low";
}

function verdictClass(status: string): string {
  if (status === "GO" || status === "PASS") return "pass";
  if (status === "WARN") return "warn";
  return "fail";
}

function verdictLabel(status: string): string {
  if (status === "PASS") return "GO";
  return status;
}

export function downloadRiskReportPDF(
  report: RiskReport,
  readiness?: LaunchReadiness | null,
) {
  const allIssues = report.checkResults.flatMap((ch) =>
    ch.issues.map((issue) => ({ check: ch, issue })),
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Preflight — ${esc(s(report.campaignName, 40))}</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: ${C.bg}; --surf: ${C.surf}; --ovl: ${C.ovl};
    --fg: ${C.fg}; --sub: ${C.sub}; --mute: ${C.mute}; --acc: ${C.acc};
    --pass: ${C.pass}; --warn: ${C.warn}; --fail: ${C.fail}; --info: ${C.info};
    --border: ${C.border};
  }

  body {
    background: var(--bg);
    color: var(--fg);
    font-family: "Inter Tight", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .mono {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--mute);
  }

  /* ── Header ── */
  .hdr {
    padding-bottom: 6mm;
    margin-bottom: 6mm;
    border-bottom: 2px solid var(--acc);
  }
  .hdr h1 { font-size: 20pt; font-weight: 700; color: var(--fg); }
  .hdr .sub { font-size: 8.5pt; color: var(--sub); margin-top: 1.5mm; }

  /* ── Cards ── */
  .card {
    background: var(--surf);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 5mm;
    margin-bottom: 5mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .card-title { margin-bottom: 3mm; }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center; gap: 2mm;
    padding: 1mm 3mm; border-radius: 2px;
    font-size: 7.5pt; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .badge-pass { background: rgba(61,214,140,0.12); color: var(--pass); border: 1px solid rgba(61,214,140,0.25); }
  .badge-warn { background: rgba(229,160,13,0.12); color: var(--warn); border: 1px solid rgba(229,160,13,0.25); }
  .badge-fail { background: rgba(229,83,75,0.12); color: var(--fail); border: 1px solid rgba(229,83,75,0.25); }

  .sev {
    display: inline-block; padding: 0.5mm 2.5mm; border-radius: 2px;
    font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
  }
  .sev-critical { background: rgba(229,83,75,0.15); color: var(--fail); border: 1px solid rgba(229,83,75,0.3); }
  .sev-medium { background: rgba(229,160,13,0.15); color: var(--warn); border: 1px solid rgba(229,160,13,0.3); }
  .sev-low { background: rgba(77,156,244,0.12); color: var(--info); border: 1px solid rgba(77,156,244,0.2); }

  .owner-pill {
    display: inline-block; padding: 0.5mm 2.5mm; border-radius: 2px;
    font-size: 7pt; font-weight: 600; letter-spacing: 0.04em;
    background: var(--ovl); color: var(--sub); border: 1px solid var(--border);
  }

  /* ── Summary ── */
  .sum { display: flex; gap: 4mm; }
  .sum-it { flex: 1; background: var(--surf); border: 1px solid var(--border); border-radius: 3px; padding: 4mm; text-align: center; }
  .sum-it .l { font-size: 7pt; color: var(--mute); text-transform: uppercase; letter-spacing: 0.1em; }
  .sum-it .v { font-size: 17pt; font-weight: 700; margin-top: 2mm; }

  /* ── Meta ── */
  .meta { display: flex; gap: 6mm; flex-wrap: wrap; }
  .meta-it { flex: 1; min-width: 30mm; }
  .meta-it .l { font-size: 7pt; color: var(--mute); text-transform: uppercase; letter-spacing: 0.1em; }
  .meta-it .v { font-size: 10pt; color: var(--fg); margin-top: 1mm; }

  /* ── Issue ── */
  .issue {
    display: flex; gap: 3mm; align-items: flex-start;
    padding: 3.5mm 0; border-bottom: 1px solid var(--border);
  }
  .issue:last-child { border-bottom: none; }
  .issue .sev-col { width: 20mm; flex-shrink: 0; }
  .issue .body-col { flex: 1; min-width: 0; }
  .issue .body-col .t { font-size: 10pt; font-weight: 600; color: var(--fg); margin-bottom: 1.5mm; }
  .issue .body-col .d { font-size: 8.5pt; color: var(--sub); line-height: 1.55; margin-bottom: 1mm; }
  .issue .body-col .d b { color: var(--mute); font-weight: 500; }
  .issue .owner-col { width: 22mm; flex-shrink: 0; text-align: right; padding-top: 1mm; }

  /* ── Verdict ── */
  .verdict {
    padding: 5mm; border-radius: 4px; margin-bottom: 5mm;
    text-align: center;
  }
  .verdict.pass { background: rgba(61,214,140,0.08); border: 1px solid rgba(61,214,140,0.2); }
  .verdict.warn { background: rgba(229,160,13,0.08); border: 1px solid rgba(229,160,13,0.2); }
  .verdict.fail { background: rgba(229,83,75,0.08); border: 1px solid rgba(229,83,75,0.2); }
  .verdict .vt { font-size: 13pt; font-weight: 700; }

  /* ── Footer ── */
  .ft {
    margin-top: 8mm; padding-top: 3mm;
    border-top: 1px solid var(--border);
    font-size: 7pt; color: var(--mute);
    display: flex; justify-content: space-between;
  }

  /* ── Section ── */
  .sec-title { font-size: 11pt; font-weight: 600; color: var(--fg); margin-bottom: 3mm; }
  .spacer { height: 5mm; }
</style>
</head>
<body>
<script>
  // Auto-trigger print when loaded in the popup
  window.onload = function() {
    setTimeout(function() { window.print(); }, 400);
  };
  window.onafterprint = function() { window.close(); };
</script>

<!-- Header -->
<div class="hdr">
  <h1>Promo Preflight</h1>
  <div class="sub">Risk Report · ${esc(report.generatedAt.slice(0, 19).replace("T", " "))}</div>
</div>

<!-- Verdict -->
<div class="verdict ${verdictClass(report.overallStatus)}">
  <span class="vt" style="color: var(--${report.overallStatus === 'PASS' ? 'pass' : report.overallStatus === 'WARN' ? 'warn' : 'fail'})">
    ${verdictLabel(report.overallStatus)}
  </span>
</div>

<!-- Campaign Card -->
<div class="card">
  <div class="card-title mono">Campaign</div>
  <div class="meta">
    <div class="meta-it"><div class="l">Campaign</div><div class="v">${esc(s(report.campaignName, 80))}</div></div>
    <div class="meta-it"><div class="l">Report ID</div><div class="v mono" style="text-transform:none;font-size:8pt">${esc(s(report.reportId, 50))}</div></div>
  </div>
</div>

<!-- Summary Card -->
<div class="card">
  <div class="card-title mono">Summary</div>
  <div class="sum">
    <div class="sum-it"><div class="l">Passed</div><div class="v" style="color:var(--pass)">${report.counts.pass}</div></div>
    <div class="sum-it"><div class="l">Warnings</div><div class="v" style="color:var(--warn)">${report.counts.warn}</div></div>
    <div class="sum-it"><div class="l">Failed</div><div class="v" style="color:var(--fail)">${report.counts.fail}</div></div>
  </div>
</div>

<!-- Findings -->
<div class="card">
  <div class="card-title mono">Findings</div>
  ${allIssues.length === 0
    ? '<div style="color:var(--pass);font-size:10pt;padding:4mm 0">All checks passed. No issues found.</div>'
    : allIssues.map((row) => `
    <div class="issue">
      <div class="sev-col">
        <span class="sev sev-${sevClass(row.issue.severity)}">${row.issue.severity}</span>
        <div class="mono" style="font-size:6.5pt;margin-top:1mm">${esc(s(row.check.publicName, 25))}</div>
      </div>
      <div class="body-col">
        <div class="t">${esc(s(row.issue.detectedIssue, 120))}</div>
        ${row.issue.evidence ? `<div class="d"><b>Evidence</b> ${esc(s(typeof row.issue.evidence === 'string' ? row.issue.evidence : JSON.stringify(row.issue.evidence), 200))}</div>` : ''}
        ${row.issue.suggestedFix ? `<div class="d"><b>Fix</b> ${esc(s(row.issue.suggestedFix, 200))}</div>` : ''}
      </div>
      <div class="owner-col">
        <span class="owner-pill">${ownerLabel(row.issue.ownerSuggestion ?? "product")}</span>
        ${row.issue.blocker ? '<div style="font-size:7pt;color:var(--fail);margin-top:1mm;font-weight:600">BLOCKER</div>' : ''}
      </div>
    </div>
  `).join('')}
</div>

<!-- Readiness -->
${readiness ? `
<div class="card">
  <div class="card-title mono">Launch Readiness</div>
  <div class="meta" style="margin-bottom:3mm">
    <div class="meta-it"><div class="l">State</div><div class="v" style="color:${readiness.state === 'READY' ? 'var(--pass)' : readiness.state === 'BLOCKED' ? 'var(--fail)' : 'var(--warn)'}">${readiness.state}</div></div>
    <div class="meta-it"><div class="l">Blockers</div><div class="v" style="color:${readiness.blockers.length > 0 ? 'var(--fail)' : 'var(--pass)'}">${readiness.blockers.length}</div></div>
  </div>
  ${readiness.blockers.length > 0 ? readiness.blockers.slice(0, 8).map(b => `
    <div style="font-size:8.5pt;color:var(--sub);padding:1.5mm 0;border-bottom:1px solid var(--border)">
      <span style="color:var(--fail);font-weight:600">●</span> ${esc(s(b.title, 150))}
    </div>
  `).join('') : ''}
</div>
` : ''}

<!-- Footer -->
<div class="ft">
  <span>Promo Preflight · ${esc(s(report.campaignName, 30))}</span>
  <span>${esc(report.reportId)}</span>
</div>

</body>
</html>`;

  // Open in a new window and trigger print
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    // Fallback: download as HTML
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preflight-${report.campaignName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)}-${report.generatedAt.slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  w.document.write(html);
  w.document.close();
}
