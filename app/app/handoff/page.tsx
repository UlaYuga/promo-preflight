import { HandoffPage } from "@/components/handoff-page";
import { runChecks } from "@/lib/checks/runner";
import { sampleCampaignBundle } from "@/schemas/fixtures";
import { CampaignBundleSchema } from "@/schemas/index";

export default function HandoffPageServer() {
  const offlineBundle = CampaignBundleSchema.parse(sampleCampaignBundle);
  const offlineReport = runChecks({
    bundle: offlineBundle,
    mode: "offline"
  });

  return <HandoffPage fallbackReport={offlineReport} />;
}
