import { CampaignDetailContent } from "@/components/campaign-detail-content";
import { loadOwnersConfig } from "@/lib/owners/loader";

export default async function CampaignDetailPage({
  params
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const config = loadOwnersConfig();

  return (
    <CampaignDetailContent
      campaignId={id}
      workspaceOwners={config.owners}
    />
  );
}
