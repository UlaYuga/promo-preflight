import { z } from "zod";

// ---------------------------------------------------------------------------
// Campaign schemas — authoritative source is domain/model/Campaign.ts
// Re-exported here so existing imports of schemas/index.ts continue to work.
// ---------------------------------------------------------------------------

export {
  PromoTypeSchema,
  ChannelSchema,
  OwnerRoleSchema,
  OwnerStatusSchema,
  TargetJurisdictionSchema,
  CampaignMetadataSchema,
  OfferBasicsSchema,
  PromoAssetSchema,
  LinkAssetSchema,
  OwnerSchema,
  CampaignBundleSchema,
} from "../domain/model/Campaign";

export type {
  PromoType,
  Channel,
  OwnerRole,
  OwnerStatus,
  TargetJurisdiction,
  CampaignMetadata,
  OfferBasics,
  PromoAsset,
  LinkAsset,
  Owner,
  CampaignBundle,
  CampaignBundleInput,
} from "../domain/model/Campaign";

// Re-import for use in schemas defined below
import {
  OwnerRoleSchema,
  OwnerStatusSchema,
} from "../domain/model/Campaign";

// ---------------------------------------------------------------------------
// Check / report schemas — owned here (not domain entities)
// ---------------------------------------------------------------------------

export const CheckStatusSchema = z.enum([
  "PASS",
  "WARN",
  "FAIL",
  "NOT_APPLICABLE"
]);

export const CheckSeveritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
]);

export const ReadinessStateSchema = z.enum([
  "READY",
  "READY_WITH_WARNINGS",
  "BLOCKED",
  "NEEDS_REVIEW"
]);

export const BlockerStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "accepted_risk"
]);

export const DependencyStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "not_required"
]);

export const ExportFormatSchema = z.enum(["markdown", "slack", "pdf"]);

export const CheckEvidenceSchema = z.object({
  field: z.string().min(1),
  snippet: z.string().max(280)
});

export const CheckIssueSchema = z.object({
  issueId: z.string().min(1),
  checkId: z.string().min(1),
  severity: CheckSeveritySchema,
  blocker: z.boolean(),
  detectedIssue: z.string().min(1).max(1000),
  evidence: z.array(CheckEvidenceSchema).max(6),
  suggestedFix: z.string().min(1).max(1500),
  ownerSuggestion: OwnerRoleSchema.optional(),
  confidence: z.number().min(0).max(1)
});

export const CheckResultSchema = z.object({
  checkId: z.string().min(1),
  publicName: z.string().min(1),
  status: CheckStatusSchema,
  severity: CheckSeveritySchema.optional(),
  summary: z.string().max(1200),
  issues: z.array(CheckIssueSchema),
  suggestedFixCount: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
  modelUsed: z.string().optional(),
  deterministicSignals: z.record(z.string(), z.unknown()).optional(),
  parsingError: z.string().optional()
});

export const RiskReportSchema = z.object({
  reportId: z.string(),
  campaignName: z.string(),
  overallStatus: CheckStatusSchema,
  generatedAt: z.string(),
  counts: z.object({
    pass: z.number().int(),
    warn: z.number().int(),
    fail: z.number().int(),
    notApplicable: z.number().int(),
    criticalBlockers: z.number().int()
  }),
  checkResults: z.array(CheckResultSchema)
});

export const ReadinessOwnerSchema = z.object({
  role: OwnerRoleSchema,
  name: z.string().optional(),
  status: OwnerStatusSchema,
  linkedIssueIds: z.array(z.string()).default([]),
  dueDate: z.string().optional(),
  notes: z.string().optional()
});

export const BlockerSchema = z.object({
  blockerId: z.string(),
  title: z.string(),
  sourceCheckId: z.string(),
  severity: CheckSeveritySchema,
  ownerRole: OwnerRoleSchema.optional(),
  requiredAction: z.string(),
  status: BlockerStatusSchema,
  dueDate: z.string().optional()
});

export const DependencySchema = z.object({
  dependencyId: z.string(),
  dependency: z.string(),
  dependsOn: z.string().optional(),
  ownerRole: OwnerRoleSchema.optional(),
  status: DependencyStatusSchema,
  notes: z.string().optional()
});

export const LaunchReadinessSchema = z.object({
  readinessId: z.string(),
  campaignName: z.string(),
  state: ReadinessStateSchema,
  owners: z.array(ReadinessOwnerSchema),
  blockers: z.array(BlockerSchema),
  dependencies: z.array(DependencySchema),
  checklist: z.record(z.string(), z.boolean())
});

export const ExportPayloadSchema = z.object({
  format: ExportFormatSchema,
  includeSourceExcerpts: z.boolean().default(false),
  report: RiskReportSchema,
  readiness: LaunchReadinessSchema.optional()
});

// ---------------------------------------------------------------------------
// Derived types for check / report schemas
// ---------------------------------------------------------------------------

export type CheckStatus = z.infer<typeof CheckStatusSchema>;
export type CheckSeverity = z.infer<typeof CheckSeveritySchema>;
export type ReadinessState = z.infer<typeof ReadinessStateSchema>;
export type BlockerStatus = z.infer<typeof BlockerStatusSchema>;
export type DependencyStatus = z.infer<typeof DependencyStatusSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export type CheckEvidence = z.infer<typeof CheckEvidenceSchema>;
export type CheckIssue = z.infer<typeof CheckIssueSchema>;
export type CheckResult = z.infer<typeof CheckResultSchema>;
export type RiskReport = z.infer<typeof RiskReportSchema>;
export type ReadinessOwner = z.infer<typeof ReadinessOwnerSchema>;
export type Blocker = z.infer<typeof BlockerSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type LaunchReadiness = z.infer<typeof LaunchReadinessSchema>;
export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

export type CheckResultInput = z.input<typeof CheckResultSchema>;
export type RiskReportInput = z.input<typeof RiskReportSchema>;
export type LaunchReadinessInput = z.input<typeof LaunchReadinessSchema>;
export type ExportPayloadInput = z.input<typeof ExportPayloadSchema>;

