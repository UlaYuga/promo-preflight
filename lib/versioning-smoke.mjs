import {
  diffVersions,
  extractBlockersFromReport,
  extractFactsFromReport
} from "./versioning.ts";

function blocker(stableKey, title = stableKey) {
  return {
    stableKey,
    checkId: "terms_robustness",
    title,
    severity: "HIGH",
    ownerRole: "legal"
  };
}

function version(n, blockers) {
  return {
    id: `version-${n}`,
    campaignId: "campaign-smoke",
    n,
    createdAt: `2026-05-03T00:00:0${n}.000Z`,
    extractedFacts: {
      reportId: `report-${n}`,
      generatedAt: `2026-05-03T00:00:0${n}.000Z`,
      campaignName: "Versioning smoke",
      overallStatus: "FAIL",
      counts: {
        pass: 0,
        warn: 0,
        fail: 1,
        criticalBlockers: blockers.length
      },
      checks: [
        {
          checkId: "terms_robustness",
          status: "FAIL",
          severity: "HIGH"
        }
      ]
    },
    blockers,
    readinessState: "BLOCKED"
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const v1 = version(1, [blocker("A"), blocker("B")]);
const v2 = version(2, [blocker("B"), blocker("C")]);
const v3 = version(3, [blocker("A"), blocker("C"), blocker("D")]);

const diff = diffVersions(v2, v3, [v1]);
const statuses = Object.fromEntries(
  diff.map((entry) => [entry.stableKey, entry.diffStatus])
);

assert(statuses.A === "reopened", "Expected A to be reopened.");
assert(statuses.B === "resolved", "Expected B to be resolved.");
assert(statuses.C === "still_open", "Expected C to be still_open.");
assert(statuses.D === "new", "Expected D to be new.");

const rawMarker = "RAW_TERMS_SHOULD_NOT_PERSIST";
const report = {
  reportId: "report-no-raw",
  campaignName: "No raw storage smoke",
  overallStatus: "FAIL",
  generatedAt: "2026-05-03T00:00:00.000Z",
  termsText: rawMarker,
  counts: {
    pass: 0,
    warn: 0,
    fail: 1,
    notApplicable: 0,
    criticalBlockers: 1
  },
  checkResults: [
    {
      checkId: "terms_robustness",
      publicName: "Terms robustness",
      status: "FAIL",
      severity: "HIGH",
      summary: "Missing required terms.",
      issues: [
        {
          issueId: "issue-1",
          checkId: "terms_robustness",
          severity: "HIGH",
          blocker: true,
          detectedIssue: "Missing max bet clause.",
          evidence: [{ field: "termsText", snippet: rawMarker }],
          suggestedFix: `Add missing terms. Do not store ${rawMarker}.`,
          ownerSuggestion: "legal",
          confidence: 1
        }
      ],
      suggestedFixCount: 1,
      confidence: 1
    }
  ]
};

const storedFacts = extractFactsFromReport(report);
const storedBlockers = extractBlockersFromReport(report);
const storedJson = JSON.stringify({ storedFacts, storedBlockers });

assert(!storedJson.includes("termsText"), "Versioning facts stored termsText.");
assert(!storedJson.includes(rawMarker), "Versioning facts stored raw input.");

console.log("Versioning smoke check passed.");
