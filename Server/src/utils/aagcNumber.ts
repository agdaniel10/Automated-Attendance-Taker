const AAGC_PREFIX = "AAGC";

export function buildAagcNumber(sequence: number): string {
  return `${AAGC_PREFIX}${sequence}`;
}

export function normalizeAagcNumber(value: string): string {
  const compact = value.trim().toUpperCase().replace(/[\s-]+/g, "");

  if (!compact) {
    return "";
  }

  const suffix = compact.startsWith(AAGC_PREFIX)
    ? compact.slice(AAGC_PREFIX.length)
    : compact;

  if (!/^\d+$/.test(suffix)) {
    return "";
  }

  const sequence = Number.parseInt(suffix, 10);

  if (!Number.isSafeInteger(sequence) || sequence <= 0) {
    return "";
  }

  return buildAagcNumber(sequence);
}
