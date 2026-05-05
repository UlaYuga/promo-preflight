import { z } from "zod";
import {
  CheckSeveritySchema,
  CheckStatusSchema,
  OwnerRoleSchema,
  ReadinessStateSchema
} from "./index";
import { OwnerOverridesSchema } from "./owners";

export const ExtractedFactsSchema = z.object({
  reportId: z.string(),
  generatedAt: z.string(),
  campaignName: z.string(),
  overallStatus: CheckStatusSchema,
  counts: z.object({
    pass: z.number().int().nonnegative(),
    warn: z.number().int().nonnegative(),
    fail: z.number().int().nonnegative(),
    criticalBlockers: z.number().int().nonnegative()
  }),
  checks: z.array(
    z.object({
      checkId: z.string(),
      status: CheckStatusSchema,
      severity: CheckSeveritySchema.nullable()
    })
  )
});

export const VersionBlockerSchema = z.object({
  stableKey: z.string(),
  checkId: z.string(),
  title: z.string(),
  severity: CheckSeveritySchema,
  ownerRole: OwnerRoleSchema.optional()
});

export const CampaignVersionSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  n: z.number().int().positive(),
  createdAt: z.string(),
  extractedFacts: ExtractedFactsSchema,
  blockers: z.array(VersionBlockerSchema),
  readinessState: ReadinessStateSchema
});

export const CampaignRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  jurisdiction: z.string(),
  createdAt: z.string(),
  ownerOverrides: OwnerOverridesSchema.default({})
});

export const VersionDiffEntrySchema = z.object({
  stableKey: z.string(),
  checkId: z.string(),
  title: z.string(),
  severity: CheckSeveritySchema,
  ownerRole: OwnerRoleSchema.optional(),
  diffStatus: z.enum(["new", "still_open", "resolved", "reopened"])
});

export type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;
export type VersionBlocker = z.infer<typeof VersionBlockerSchema>;
export type CampaignVersion = z.infer<typeof CampaignVersionSchema>;
export type CampaignRecord = z.infer<typeof CampaignRecordSchema>;
export type VersionDiffEntry = z.infer<typeof VersionDiffEntrySchema>;
