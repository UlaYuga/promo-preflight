import { RulesPageContent } from "@/components/rules-page-content";
import { loadRulesArtifact } from "@/lib/rules/loader";

export default function RulesPage() {
  const artifact = loadRulesArtifact();
  return <RulesPageContent rules={artifact.rules} />;
}
