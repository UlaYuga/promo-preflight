import { z } from "zod";

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

export const PromoTypeSchema = z.enum([
  "welcome",
  "reload",
  "freebet",
  "cashback",
  "tournament",
  "loyalty",
  "reactivation"
]);

export const ChannelSchema = z.enum([
  "email",
  "push",
  "onsite",
  "landing",
  "sms",
  "in_app"
]);

export const OwnerRoleSchema = z.enum([
  "product",
  "crm",
  "legal",
  "risk",
  "localization",
  "analytics"
]);

export const ReadinessStateSchema = z.enum([
  "READY",
  "READY_WITH_WARNINGS",
  "BLOCKED",
  "NEEDS_REVIEW"
]);

export const OwnerStatusSchema = z.enum([
  "pending",
  "approved",
  "blocked",
  "not_required"
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

export const ExportFormatSchema = z.enum(["markdown", "slack"]);

export const CampaignMetadataSchema = z.object({
  campaignName: z.string().min(1).max(120),
  operatorLabel: z.string().max(80).optional(),
  promoType: PromoTypeSchema,
  geo: z.string().min(1).max(80),
  locale: z.string().min(2).max(20),
  currency: z.string().min(3).max(8),
  launchDate: z.string().optional(),
  channelsIncluded: z.array(ChannelSchema).min(1)
});

export const OfferBasicsSchema = z.object({
  minDeposit: z.number().nonnegative().optional(),
  bonusAmount: z.number().nonnegative().optional(),
  bonusPercentage: z.number().nonnegative().optional(),
  maxBonus: z.number().nonnegative().optional(),
  wageringRequirement: z.string().max(80).optional(),
  maxCashout: z.number().nonnegative().optional(),
  maxBet: z.number().nonnegative().optional(),
  eligibleGames: z.string().max(2000).optional(),
  contribution: z.string().max(2000).optional(),
  cooldown: z.string().max(500).optional(),
  eligibilityRules: z.string().max(3000).optional()
});

export const PromoAssetSchema = z.object({
  channel: ChannelSchema,
  fieldName: z.string().min(1).max(80),
  text: z.string().max(20000),
  softLimit: z.number().int().positive().optional(),
  hardLimit: z.number().int().positive().optional()
});

export const LinkAssetSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().max(2048),
  expectedDomain: z.string().max(120).optional(),
  requiresUtm: z.boolean().default(true)
});

export const OwnerSchema = z.object({
  role: OwnerRoleSchema,
  name: z.string().max(120).optional(),
  status: OwnerStatusSchema.default("pending"),
  dueDate: z.string().optional(),
  notes: z.string().max(1000).optional()
});

export const TargetJurisdictionSchema = z.enum([
  'BR', 'MX', 'CO', 'AR', 'IN', 'RU', 'TR', 'UK', 'DE', 'ES', 'IT',
  'NG', 'ZA', 'KR', 'MY', 'AL', 'SE', 'PL', 'CA-ON'
]);

export type TargetJurisdiction = z.infer<typeof TargetJurisdictionSchema>;

export const CampaignBundleSchema = z.object({
  metadata: CampaignMetadataSchema,
  offer: OfferBasicsSchema,
  assets: z.array(PromoAssetSchema).default([]),
  links: z.array(LinkAssetSchema).default([]),
  owners: z.array(OwnerSchema).default([]),
  termsText: z.string().min(1).max(50000),
  notes: z.string().max(5000).optional(),
  // Added in T-013a (required in T-013d)
  targetJurisdiction: z.array(TargetJurisdictionSchema).min(1).max(3).optional(),
  paymentMethods: z.array(z.string()).optional()
});

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

export type CheckStatus = z.infer<typeof CheckStatusSchema>;
export type CheckSeverity = z.infer<typeof CheckSeveritySchema>;
export type PromoType = z.infer<typeof PromoTypeSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type OwnerRole = z.infer<typeof OwnerRoleSchema>;
export type ReadinessState = z.infer<typeof ReadinessStateSchema>;
export type OwnerStatus = z.infer<typeof OwnerStatusSchema>;
export type BlockerStatus = z.infer<typeof BlockerStatusSchema>;
export type DependencyStatus = z.infer<typeof DependencyStatusSchema>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export type CampaignMetadata = z.infer<typeof CampaignMetadataSchema>;
export type OfferBasics = z.infer<typeof OfferBasicsSchema>;
export type PromoAsset = z.infer<typeof PromoAssetSchema>;
export type LinkAsset = z.infer<typeof LinkAssetSchema>;
export type Owner = z.infer<typeof OwnerSchema>;
export type CampaignBundle = z.infer<typeof CampaignBundleSchema>;
export type CheckEvidence = z.infer<typeof CheckEvidenceSchema>;
export type CheckIssue = z.infer<typeof CheckIssueSchema>;
export type CheckResult = z.infer<typeof CheckResultSchema>;
export type RiskReport = z.infer<typeof RiskReportSchema>;
export type ReadinessOwner = z.infer<typeof ReadinessOwnerSchema>;
export type Blocker = z.infer<typeof BlockerSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type LaunchReadiness = z.infer<typeof LaunchReadinessSchema>;
export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

export type CampaignBundleInput = z.input<typeof CampaignBundleSchema>;
export type CheckResultInput = z.input<typeof CheckResultSchema>;
export type RiskReportInput = z.input<typeof RiskReportSchema>;
export type LaunchReadinessInput = z.input<typeof LaunchReadinessSchema>;
export type ExportPayloadInput = z.input<typeof ExportPayloadSchema>;
