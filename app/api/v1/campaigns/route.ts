import { getDb } from '../../../../infrastructure/db/client';
import { CampaignRepository } from '../../../../infrastructure/persistence/CampaignRepository';

export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  const db = getDb();
  const campaignRepo = new CampaignRepository(db);
  const campaigns = await campaignRepo.list();
  return Response.json({ campaigns });
}
