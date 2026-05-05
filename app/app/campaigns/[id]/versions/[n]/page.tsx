import { notFound } from "next/navigation";
import { VersionDiffContent } from "@/components/version-diff-content";
import { getVersion } from "@/lib/versioning";
import { loadOwnersConfig } from "@/lib/owners/loader";

export default async function VersionDiffPage({
  params
}: Readonly<{ params: Promise<{ id: string; n: string }> }>) {
  const { id, n: nStr } = await params;
  const n = Number(nStr);
  const version = getVersion(id, n);

  if (!version || !Number.isFinite(n)) {
    notFound();
  }

  const config = loadOwnersConfig();

  return (
    <VersionDiffContent
      campaignId={id}
      n={n}
      workspaceOwners={config.owners}
    />
  );
}
