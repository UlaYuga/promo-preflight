import { z } from "zod";

// ---------------------------------------------------------------------------
// AI brief extraction contract — browser demo only.
// This is NOT part of the persisted /api/v1/* contract.
// Raw brief text is never stored by the extraction endpoint.
// ---------------------------------------------------------------------------

export const ExtractionFieldSchema = z.object({
  fieldPath: z.string().min(1),
  label: z.string().min(1),
  value: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  sourceSnippet: z.string().max(280),
});

export type ExtractionField = z.infer<typeof ExtractionFieldSchema>;

export const ExtractionCandidateSchema = z.object({
  campaignName: z.string().optional(),
  operatorLabel: z.string().optional(),
  promoType: z.string().optional(),
  geo: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  launchDate: z.string().optional(),
  channelsIncluded: z.array(z.string()).optional(),
  targetJurisdiction: z.array(z.string()).optional(),
  offer: z
    .object({
      minDeposit: z.number().optional(),
      bonusAmount: z.number().optional(),
      bonusPercentage: z.number().optional(),
      maxBonus: z.number().optional(),
      wageringRequirement: z.string().optional(),
      maxCashout: z.number().optional(),
      maxBet: z.number().optional(),
      eligibleGames: z.string().optional(),
      contribution: z.string().optional(),
      cooldown: z.string().optional(),
      eligibilityRules: z.string().optional(),
    })
    .optional(),
  termsText: z.string().optional(),
  channelCopy: z
    .record(
      z.string(),
      z.object({
        text: z.string(),
        fieldName: z.string().optional(),
      }),
    )
    .optional(),
  links: z
    .array(
      z.object({
        label: z.string().optional(),
        url: z.string(),
        requiresUtm: z.boolean().optional(),
      }),
    )
    .optional(),
  owners: z
    .array(
      z.object({
        role: z.string(),
        name: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .optional(),
  paymentMethods: z.array(z.string()).optional(),
});

export type ExtractionCandidate = z.infer<typeof ExtractionCandidateSchema>;

export const BriefExtractionResultSchema = z.object({
  candidate: ExtractionCandidateSchema,
  fields: z.array(ExtractionFieldSchema),
  needsConfirmation: z.array(z.string()),
  notProvided: z.array(z.string()),
  providerNote: z.string().optional(),
});

export type BriefExtractionResult = z.infer<typeof BriefExtractionResultSchema>;

export const BriefExtractionRequestSchema = z.object({
  rawBrief: z.string().min(10).max(20000),
});

export const BRIEF_EXTRACTION_SAMPLE = `BR welcome offer for Q2 2026. Deposit min R$50, bonus up to R$500 with 35x wagering.
Email subject: Acme Casino — Get up to R$500 Welcome Bonus
Email body: Welcome to Acme Casino! Deposit R$50 and get up to R$500 in welcome bonus. 18+. T&Cs apply.
SMS copy: Acme Casino: 100% bonus up to R$500. Min deposit R$50. T&Cs apply. 18+
Landing CTA URL: https://acme.casino/br/welcome?utm_source=email_welcome&utm_medium=email&utm_campaign=welcome_br_q2
Payment methods: Pix, Visa, Mastercard, USDT-TRC20
T&C: 100% welcome bonus up to R$500. Minimum deposit R$50. 35x wagering requirement. Max bet R$5. Valid 30 days. 18+. Gamble responsibly.
License info: SPA/MF license no. [XXXX].
Compliance owner assigned. Marketing owner: pedro.costa. CRM owner: ana.silva.
Operator: Acme Casino. GEO: BR. Locale: pt-BR. Currency: BRL.`;
