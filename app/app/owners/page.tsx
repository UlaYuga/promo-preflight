import { OwnersPageContent } from "@/components/owners-page-content";
import { loadOwnersConfig } from "@/lib/owners/loader";
import { resolveAllOwners } from "@/lib/owners/resolver";

export default function OwnersPage() {
  const config = loadOwnersConfig();
  const owners = resolveAllOwners({ workspaceOwners: config.owners });
  return <OwnersPageContent owners={owners} />;
}
