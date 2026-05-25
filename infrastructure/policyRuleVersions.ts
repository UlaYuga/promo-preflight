import { z } from 'zod';
import type { PolicyRuleVersions } from '../domain/model/Run';

export const PolicyRuleVersionsSchema = z.strictObject({
  paymentCompatibility: z.number().int().positive(),
  cryptoDisclosure: z.number().int().positive(),
  jurisdictionalRisk: z.number().int().positive(),
});

export function parsePolicyRuleVersions(value: unknown): PolicyRuleVersions {
  return PolicyRuleVersionsSchema.parse(value);
}
