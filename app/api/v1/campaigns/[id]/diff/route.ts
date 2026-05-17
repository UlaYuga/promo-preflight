import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '../../../../../../infrastructure/db/client';
import { CampaignRepository } from '../../../../../../infrastructure/persistence/CampaignRepository';
import { CampaignNotFoundException, NotFoundException } from '../../../../../../domain/exception/PreflightException';
import { diffBlockers } from '../../../../../../domain/service/DiffService';
import { errorResponse, badRequest } from '../../../../../../api/v1/index';

export const runtime = 'nodejs';

const QuerySchema = z.object({
  from: z.coerce.number().int().positive(),
  to: z.coerce.number().int().positive(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  const searchParams = req.nextUrl.searchParams;
  const queryParse = QuerySchema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  });

  if (!queryParse.success) {
    return badRequest('Query params `from` and `to` must be positive integers (version numbers)');
  }

  const { from: fromN, to: toN } = queryParse.data;

  const db = getDb();
  const campaignRepo = new CampaignRepository(db);

  const campaign = await campaignRepo.findById(id);
  if (!campaign) {
    return errorResponse(new CampaignNotFoundException(`Campaign not found: ${id}`));
  }

  const [fromBlockers, toBlockers] = await Promise.all([
    campaignRepo.getVersionBlockers(id, fromN),
    campaignRepo.getVersionBlockers(id, toN),
  ]);

  if (fromBlockers === null) {
    return errorResponse(
      new NotFoundException(`Version ${fromN} not found for campaign ${id}`)
    );
  }
  if (toBlockers === null) {
    return errorResponse(
      new NotFoundException(`Version ${toN} not found for campaign ${id}`)
    );
  }

  const diff = diffBlockers(fromBlockers, toBlockers);

  return Response.json({
    campaignId: id,
    from: fromN,
    to: toN,
    diff: {
      added: diff.added,
      resolved: diff.resolved,
      unchanged: diff.unchanged,
    },
  });
}
