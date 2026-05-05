export function checkInputSize(
  rawText: string,
  maxChars: number
): { ok: true } | { ok: false; message: string } {
  if (rawText.length > maxChars) {
    return {
      ok: false,
      message: `Input exceeds maximum size of ${maxChars} characters (got ${rawText.length})`
    };
  }
  return { ok: true };
}

export function bundleTextSize(bundle: Record<string, unknown>): number {
  return JSON.stringify(bundle).length;
}
