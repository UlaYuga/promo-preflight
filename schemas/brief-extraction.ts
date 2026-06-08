import { z } from "zod";
import {
  CampaignMetadataSchema,
  LinkAssetSchema,
  OfferBasicsSchema,
  OwnerSchema,
  PromoAssetSchema,
  TargetJurisdictionSchema
} from "../domain/model/Campaign";

export const CampaignExtractionCandidateSchema = z.object({
  metadata: CampaignMetadataSchema.partial().default({}),
  offer: OfferBasicsSchema.default({}),
  assets: z.array(PromoAssetSchema).default([]),
  links: z.array(LinkAssetSchema).default([]),
  owners: z.array(OwnerSchema).default([]),
  termsText: z.string().max(50000).optional(),
  notes: z.string().max(5000).optional(),
  targetJurisdiction: z.array(TargetJurisdictionSchema).min(1).max(3).optional(),
  paymentMethods: z.array(z.string().min(1).max(80)).max(12).optional()
});

export const ExtractionConfidenceSchema = z.enum(["high", "medium", "low"]);

export const ExtractedFieldSchema = z.object({
  path: z.string().min(1).max(120),
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(300),
  evidence: z.string().min(1).max(280),
  confidence: ExtractionConfidenceSchema
});

export const ExtractionGapSchema = z.object({
  path: z.string().min(1).max(120),
  label: z.string().min(1).max(120),
  reason: z.string().min(1).max(300)
});

export const BriefExtractionPayloadSchema = z.object({
  candidate: CampaignExtractionCandidateSchema,
  extracted: z.array(ExtractedFieldSchema).max(32),
  needsConfirmation: z.array(ExtractionGapSchema).max(16),
  notProvided: z.array(ExtractionGapSchema).max(16)
});

export const BriefExtractionResponseSchema = BriefExtractionPayloadSchema.extend({
  mode: z.enum(["mock", "live"]),
  modelUsed: z.string().optional()
});

export const BriefExtractionRequestSchema = z.object({
  rawBrief: z.string().trim().min(20)
});

export type CampaignExtractionCandidate = z.infer<
  typeof CampaignExtractionCandidateSchema
>;
export type BriefExtractionPayload = z.infer<typeof BriefExtractionPayloadSchema>;
export type BriefExtractionResponse = z.infer<typeof BriefExtractionResponseSchema>;
