import { z } from "zod";
import { OwnerRoleSchema } from "./index";

export const OWNER_ROLES = OwnerRoleSchema.options;

const OwnerNameSchema = z
  .string()
  .max(120)
  .transform((value) => value.trim());

export const OwnerOverridesSchema = z
  .object({
    product: OwnerNameSchema.optional(),
    crm: OwnerNameSchema.optional(),
    legal: OwnerNameSchema.optional(),
    risk: OwnerNameSchema.optional(),
    localization: OwnerNameSchema.optional(),
    analytics: OwnerNameSchema.optional()
  })
  .strict();

export const OwnersConfigSchema = z
  .object({
    owners: OwnerOverridesSchema
  })
  .strict();

export const OwnerResolutionSchema = z
  .object({
    ownerRole: OwnerRoleSchema,
    ownerName: z.string().min(1),
    assigned: z.boolean()
  })
  .strict();

export type OwnerOverrides = z.infer<typeof OwnerOverridesSchema>;
export type OwnersConfig = z.infer<typeof OwnersConfigSchema>;
export type OwnerResolution = z.infer<typeof OwnerResolutionSchema>;
