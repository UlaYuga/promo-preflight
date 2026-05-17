import { NextRequest } from 'next/server';
import { getDb } from '../../../../../../infrastructure/db/client';
import { CampaignRepository } from '../../../../../../infrastructure/persistence/CampaignRepository';
import { CampaignNotFoundException } from '../../../../../../domain/exception/PreflightException';
import { errorResponse } from '../../../../../../api/v1/index';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const db = getDb();
  const campaignRepo = new CampaignRepository(db);

  const campaign = await campaignRepo.findById(id);
  if (!campaign) {
    return errorResponse(new CampaignNotFoundException(`Campaign not found: ${id}`));
  }

  const versions = await campaignRepo.listVersions(id);
  return Response.json({ campaignId: id, versions });
}
