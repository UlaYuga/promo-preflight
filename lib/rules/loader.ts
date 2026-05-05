import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { RulesArtifactSchema, type RulesArtifact } from "../../schemas/rules";

export const RULES_YAML_PATH = path.join(process.cwd(), "rules", "rules.yaml");

export function loadRulesArtifact(
  filePath: string = RULES_YAML_PATH
): RulesArtifact {
  const source = readFileSync(filePath, "utf8");
  const parsed = parse(source);

  return RulesArtifactSchema.parse(parsed);
}

export function loadRules(filePath?: string) {
  return loadRulesArtifact(filePath).rules;
}
