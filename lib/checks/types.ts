import type {
  CampaignBundle,
  CheckIssue,
  CheckResult
} from "../../schemas/index";
import type { CheckId } from "./definitions";

export type CheckContext = {
  bundle: CampaignBundle;
  generatedAt: string;
  priorResults?: CheckResult[];
  language?: string;
};

export type IssueDraft = Omit<CheckIssue, "issueId" | "checkId">;

export type CheckModule = {
  id: CheckId;
  run(context: CheckContext): CheckResult;
};
