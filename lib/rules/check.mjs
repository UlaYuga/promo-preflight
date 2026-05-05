import { ZodError } from "zod";
import { loadRulesArtifact, RULES_YAML_PATH } from "./loader.ts";

try {
  const artifact = loadRulesArtifact();
  console.log(
    `Rules artifact check passed: ${artifact.rules.length} rules validated from ${RULES_YAML_PATH}.`
  );
} catch (error) {
  console.error("Rules artifact check failed.");

  if (error instanceof ZodError) {
    console.error(error.issues);
  } else {
    console.error(error);
  }

  process.exit(1);
}
