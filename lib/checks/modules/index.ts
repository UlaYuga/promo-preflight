import { CHECK_IDS, type CheckId } from "../definitions";
import type { CheckModule } from "../types";
import { channelConsistencyCheck } from "./channel-consistency";
import { jurisdictionalRiskSignalsCheck } from "./jurisdictional-risk-signals";
import { formatQaCheck } from "./format-qa";
import { launchOwnershipCheck } from "./launch-ownership";
import { linkQaCheck } from "./link-qa";
import { localizationQaCheck } from "./localization-qa";
import { offerMathSanityCheck } from "./offer-math-sanity";
import { termsRobustnessCheck } from "./terms-robustness";

export const CHECK_MODULES = [
  channelConsistencyCheck,
  termsRobustnessCheck,
  offerMathSanityCheck,
  jurisdictionalRiskSignalsCheck,
  localizationQaCheck,
  launchOwnershipCheck,
  linkQaCheck,
  formatQaCheck
] satisfies CheckModule[];

export const CHECK_MODULE_BY_ID = Object.fromEntries(
  CHECK_MODULES.map((module) => [module.id, module])
) as Record<CheckId, CheckModule>;

const missingModules = CHECK_IDS.filter((checkId) => !CHECK_MODULE_BY_ID[checkId]);
if (missingModules.length > 0) {
  throw new Error(`Missing check modules: ${missingModules.join(", ")}.`);
}
