import { notFound } from "next/navigation";
import { CampaignDetailContent } from "@/components/campaign-detail-content";
import { getCampaign } from "@/lib/versioning";
import { loadOwnersConfig } from "@/lib/owners/loader";

export default async function CampaignDetailPage({
  params
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const campaign = getCampaign(id);

  if (!campaign) {
    notFound();
  }

  const config = loadOwnersConfig();

  return (
    <CampaignDetailContent
      campaignId={id}
      workspaceOwners={config.owners}
    />
  );
}
