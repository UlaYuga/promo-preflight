import { extname } from "node:path";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (
      error?.code === "ERR_MODULE_NOT_FOUND" &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !extname(specifier)
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }

    throw error;
  }
}
