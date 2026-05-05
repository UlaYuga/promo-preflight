"use client";

import { VersionDetail } from "@/components/version-diff";
import type { OwnerOverrides } from "@/schemas/owners";

export function VersionDiffContent({
  campaignId,
  n,
  workspaceOwners
}: Readonly<{
  campaignId: string;
  n: number;
  workspaceOwners: OwnerOverrides;
}>) {
  return (
    <div className="px-10 py-10">
      <VersionDetail
        campaignId={campaignId}
        n={n}
        workspaceOwners={workspaceOwners}
      />
    </div>
  );
}
