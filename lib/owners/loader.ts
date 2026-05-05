import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { OwnersConfigSchema, type OwnersConfig } from "../../schemas/owners";

export const OWNERS_YAML_PATH = path.join(
  process.cwd(),
  "config",
  "owners.yaml"
);

export function loadOwnersConfig(
  filePath: string = OWNERS_YAML_PATH
): OwnersConfig {
  const source = readFileSync(filePath, "utf8");
  const parsed = parse(source);

  return OwnersConfigSchema.parse(parsed);
}
