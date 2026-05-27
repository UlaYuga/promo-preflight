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

export const BRIEF_EXTRACTION_SAMPLE = `BR welcome email for Friday. Deposit min R$50, bonus up to R$500 with 35x wagering.
Email subject: Acme Casino — ganhe at\u00e9 R$500 em b\u00f4nus
Email body: Bem-vindo ao Acme Casino! Deposite R$50 e ganhe at\u00e9 R$500 em b\u00f4nus de boas-vindas. 18+.
SMS copy: Acme Casino: b\u00f4nus 100% at\u00e9 R$500. Dep\u00f3sito m\u00edn R$50. T&C se aplicam. 18+
Landing CTA URL: https://acme.casino/br/welcome?utm_source=email_welcome&utm_medium=email&utm_campaign=welcome_br_q2
Payment methods: Pix, Visa, Mastercard, USDT-TRC20
T&C: B\u00f4nus de 100% at\u00e9 R$500. Dep\u00f3sito m\u00ednimo R$50. Rollover 35x. Aposta m\u00e1xima R$5. V\u00e1lido 30 dias. 18+. Jogue com responsabilidade.
License info: Licen\u00e7a SPA/MF n\u00ba [XXXX].
Compliance owner assigned. Marketing owner: pedro.costa. CRM owner: ana.silva.
Operator: Acme Casino. GEO: BR. Locale: pt-BR. Currency: BRL.`;
