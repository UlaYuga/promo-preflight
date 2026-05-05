import { LaunchReadiness } from "@/components/launch-readiness";
import { loadOwnersConfig } from "@/lib/owners/loader";

export default function ReadinessPage() {
  const ownersConfig = loadOwnersConfig();

  return (
    <LaunchReadiness
      workspaceOwners={ownersConfig.owners}
    />
  );
}
