import {
  PROMO_PREFLIGHT_CAMPAIGNS_KEY,
  PROMO_PREFLIGHT_VERSIONS_KEY
} from "./demo-storage";
import {
  CampaignRecordSchema,
  CampaignVersionSchema,
  ExtractedFactsSchema,
  VersionBlockerSchema,
  type CampaignRecord,
  type CampaignVersion,
  type VersionBlocker,
  type VersionDiffEntry
} from "../schemas/versioning";
import type { RiskReport } from "../schemas/index";
import { sanitizeOwnerOverrides } from "./owners/resolver";
import type { OwnerOverrides } from "../schemas/owners";

const MAX_VERSIONS_PER_CAMPAIGN = 50;

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readCampaigns(): CampaignRecord[] {
  try {
    const raw = window.localStorage.getItem(PROMO_PREFLIGHT_CAMPAIGNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => CampaignRecordSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => (r as { success: true; data: CampaignRecord }).data);
  } catch {
    return [];
  }
}

function writeCampaigns(campaigns: CampaignRecord[]): void {
  window.localStorage.setItem(
    PROMO_PREFLIGHT_CAMPAIGNS_KEY,
    JSON.stringify(campaigns)
  );
}

function readVersions(): CampaignVersion[] {
  try {
    const raw = window.localStorage.getItem(PROMO_PREFLIGHT_VERSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => CampaignVersionSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => (r as { success: true; data: CampaignVersion }).data);
  } catch {
    return [];
  }
}

function writeVersions(versions: CampaignVersion[]): void {
  window.localStorage.setItem(
    PROMO_PREFLIGHT_VERSIONS_KEY,
    JSON.stringify(versions)
  );
}

export function listCampaigns(): CampaignRecord[] {
  return readCampaigns().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getCampaign(id: string): CampaignRecord | null {
  return readCampaigns().find((c) => c.id === id) ?? null;
}

export function createCampaign(
  name: string,
  jurisdiction: string
): CampaignRecord {
  const campaigns = readCampaigns();
  const campaign = CampaignRecordSchema.parse({
    id: randomId(),
    name: name.trim() || "Untitled campaign",
    jurisdiction: jurisdiction.trim(),
    createdAt: new Date().toISOString(),
    ownerOverrides: {}
  });
  writeCampaigns([...campaigns, campaign]);
  return campaign;
}

export function updateCampaignOwnerOverrides(
  campaignId: string,
  ownerOverrides: OwnerOverrides
): CampaignRecord | null {
  const campaigns = readCampaigns();
  const nextOwnerOverrides = sanitizeOwnerOverrides(ownerOverrides);
  let updatedCampaign: CampaignRecord | null = null;
  const nextCampaigns = campaigns.map((campaign) => {
    if (campaign.id !== campaignId) {
      return campaign;
    }

    updatedCampaign = CampaignRecordSchema.parse({
      ...campaign,
      ownerOverrides: nextOwnerOverrides
    });

    return updatedCampaign;
  });

  if (!updatedCampaign) {
    return null;
  }

  writeCampaigns(nextCampaigns);
  return updatedCampaign;
}

export function listVersions(campaignId: string): CampaignVersion[] {
  return readVersions()
    .filter((v) => v.campaignId === campaignId)
    .sort((a, b) => a.n - b.n);
}

export function getVersion(
  campaignId: string,
  n: number
): CampaignVersion | null {
  return (
    readVersions().find((v) => v.campaignId === campaignId && v.n === n) ?? null
  );
}

export function extractBlockersFromReport(report: RiskReport): VersionBlocker[] {
  return report.checkResults.flatMap((check) =>
    check.issues
      .filter((issue) => issue.blocker)
      .map((issue) =>
        VersionBlockerSchema.parse({
          stableKey: `${check.checkId}:${issue.detectedIssue.slice(0, 80)}`,
          checkId: check.checkId,
          title: issue.detectedIssue.slice(0, 180),
          severity: issue.severity,
          ownerRole: issue.ownerSuggestion ?? undefined
        })
      )
  );
}

export function extractFactsFromReport(report: RiskReport): ReturnType<typeof ExtractedFactsSchema.parse> {
  return ExtractedFactsSchema.parse({
    reportId: report.reportId,
    generatedAt: report.generatedAt,
    campaignName: report.campaignName,
    overallStatus: report.overallStatus,
    counts: report.counts,
    checks: report.checkResults.map((c) => ({
      checkId: c.checkId,
      status: c.status,
      severity: c.severity ?? null
    }))
  });
}

function readinessStateFromReport(
  report: RiskReport
): CampaignVersion["readinessState"] {
  if (report.counts.fail > 0) return "BLOCKED";
  if (report.counts.warn > 0) return "READY_WITH_WARNINGS";
  return "READY";
}

export function saveVersion(
  campaignId: string,
  report: RiskReport
): CampaignVersion {
  const allVersions = readVersions();
  const existing = allVersions.filter((v) => v.campaignId === campaignId);

  if (existing.length >= MAX_VERSIONS_PER_CAMPAIGN) {
    throw new Error(
      `Campaign has reached the limit of ${MAX_VERSIONS_PER_CAMPAIGN} versions.`
    );
  }

  const n = existing.length > 0 ? Math.max(...existing.map((v) => v.n)) + 1 : 1;
  const version = CampaignVersionSchema.parse({
    id: randomId(),
    campaignId,
    n,
    createdAt: new Date().toISOString(),
    extractedFacts: extractFactsFromReport(report),
    blockers: extractBlockersFromReport(report),
    readinessState: readinessStateFromReport(report)
  });

  writeVersions([...allVersions, version]);
  return version;
}

export function diffVersions(
  prev: CampaignVersion,
  curr: CampaignVersion,
  earlierVersions: CampaignVersion[] = []
): VersionDiffEntry[] {
  const prevKeys = new Set(prev.blockers.map((b) => b.stableKey));
  const currKeys = new Set(curr.blockers.map((b) => b.stableKey));
  const earlierKeys = new Set(
    earlierVersions
      .filter((version) => version.campaignId === curr.campaignId && version.n < prev.n)
      .flatMap((version) => version.blockers.map((blocker) => blocker.stableKey))
  );

  const entries: VersionDiffEntry[] = [];

  for (const blocker of curr.blockers) {
    let diffStatus: VersionDiffEntry["diffStatus"] = "new";

    if (prevKeys.has(blocker.stableKey)) {
      diffStatus = "still_open";
    } else if (earlierKeys.has(blocker.stableKey)) {
      diffStatus = "reopened";
    }

    entries.push({
      ...blocker,
      diffStatus
    });
  }

  for (const blocker of prev.blockers) {
    if (!currKeys.has(blocker.stableKey)) {
      entries.push({ ...blocker, diffStatus: "resolved" });
    }
  }

  const order = { new: 0, reopened: 1, still_open: 2, resolved: 3 };
  return entries.sort(
    (a, b) => order[a.diffStatus] - order[b.diffStatus]
  );
}

export function getLatestVersionSummary(campaignId: string): {
  versionCount: number;
  latestReadinessState: CampaignVersion["readinessState"] | null;
  latestCreatedAt: string | null;
} {
  const versions = listVersions(campaignId);
  if (versions.length === 0) {
    return {
      versionCount: 0,
      latestReadinessState: null,
      latestCreatedAt: null
    };
  }
  const latest = versions[versions.length - 1];
  return {
    versionCount: versions.length,
    latestReadinessState: latest.readinessState,
    latestCreatedAt: latest.createdAt
  };
}
