import { ZodError } from "zod";
import { loadOwnersConfig, OWNERS_YAML_PATH } from "./loader.ts";

try {
  const config = loadOwnersConfig();
  const assignedCount = Object.values(config.owners).filter(Boolean).length;

  console.log(
    `Owners config check passed: ${assignedCount} assigned owner names validated from ${OWNERS_YAML_PATH}.`
  );
} catch (error) {
  console.error("Owners config check failed.");

  if (error instanceof ZodError) {
    console.error(error.issues);
  } else {
    console.error(error);
  }

  process.exit(1);
}
