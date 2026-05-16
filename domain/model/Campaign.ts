import { z } from 'zod';
import { InvalidCampaignException } from '../exception/PreflightException';

// ---------------------------------------------------------------------------
// Primitive enums
// ---------------------------------------------------------------------------

export const PromoTypeSchema = z.enum([
  'welcome',
  'reload',
  'freebet',
  'cashback',
  'tournament',
  'loyalty',
  'reactivation',
]);

export const ChannelSchema = z.enum([
  'email',
  'push',
  'onsite',
  'landing',
  'sms',
  'in_app',
]);

export const OwnerRoleSchema = z.enum([
  'product',
  'crm',
  'legal',
  'risk',
  'localization',
  'analytics',
]);

export const OwnerStatusSchema = z.enum([
  'pending',
  'approved',
  'blocked',
  'not_required',
]);

export const TargetJurisdictionSchema = z.enum([
  'BR', 'MX', 'CO', 'AR', 'IN', 'RU', 'TR', 'UK', 'DE', 'ES', 'IT',
  'NG', 'ZA', 'KR', 'MY', 'AL', 'SE', 'PL', 'CA-ON',
]);

// ---------------------------------------------------------------------------
// Composite schemas
// ---------------------------------------------------------------------------

export const CampaignMetadataSchema = z.object({
  campaignName: z.string().min(1).max(120),
  operatorLabel: z.string().max(80).optional(),
  promoType: PromoTypeSchema,
  geo: z.string().min(1).max(80),
  locale: z.string().min(2).max(20),
  currency: z.string().min(3).max(8),
  launchDate: z.string().optional(),
  channelsIncluded: z.array(ChannelSchema).min(1),
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
  eligibilityRules: z.string().max(3000).optional(),
});

export const PromoAssetSchema = z.object({
  channel: ChannelSchema,
  fieldName: z.string().min(1).max(80),
  text: z.string().max(20000),
  softLimit: z.number().int().positive().optional(),
  hardLimit: z.number().int().positive().optional(),
});

export const LinkAssetSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().max(2048),
  expectedDomain: z.string().max(120).optional(),
  requiresUtm: z.boolean().default(true),
});

export const OwnerSchema = z.object({
  role: OwnerRoleSchema,
  name: z.string().max(120).optional(),
  status: OwnerStatusSchema.default('pending'),
  dueDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

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
  paymentMethods: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type PromoType = z.infer<typeof PromoTypeSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type OwnerRole = z.infer<typeof OwnerRoleSchema>;
export type OwnerStatus = z.infer<typeof OwnerStatusSchema>;
export type TargetJurisdiction = z.infer<typeof TargetJurisdictionSchema>;

export type CampaignMetadata = z.infer<typeof CampaignMetadataSchema>;
export type OfferBasics = z.infer<typeof OfferBasicsSchema>;
export type PromoAsset = z.infer<typeof PromoAssetSchema>;
export type LinkAsset = z.infer<typeof LinkAssetSchema>;
export type Owner = z.infer<typeof OwnerSchema>;
export type CampaignBundle = z.infer<typeof CampaignBundleSchema>;
export type CampaignBundleInput = z.input<typeof CampaignBundleSchema>;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCampaign(input: unknown): CampaignBundle {
  const result = CampaignBundleSchema.safeParse(input);
  if (!result.success) {
    throw new InvalidCampaignException(
      `Invalid campaign bundle: ${result.error.message}`
    );
  }
  return result.data;
}
