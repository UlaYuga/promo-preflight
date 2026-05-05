"use client";

import { CampaignVersionList } from "@/components/campaign-list";
import type { OwnerOverrides } from "@/schemas/owners";

export function CampaignDetailContent({
  campaignId,
  workspaceOwners
}: Readonly<{
  campaignId: string;
  workspaceOwners: OwnerOverrides;
}>) {
  return (
    <div className="px-10 py-10">
      <CampaignVersionList
        campaignId={campaignId}
        workspaceOwners={workspaceOwners}
      />
    </div>
  );
}
