import { z } from 'zod';
import { CampaignBundleSchema } from '../../schemas/index';
import { InvalidCampaignException } from '../exception/PreflightException';

export type CampaignBundle = z.infer<typeof CampaignBundleSchema>;
export type CampaignBundleInput = z.input<typeof CampaignBundleSchema>;

export { CampaignBundleSchema };

export function createCampaign(input: unknown): CampaignBundle {
  const result = CampaignBundleSchema.safeParse(input);
  if (!result.success) {
    throw new InvalidCampaignException(
      `Invalid campaign bundle: ${result.error.message}`
    );
  }
  return result.data;
}
