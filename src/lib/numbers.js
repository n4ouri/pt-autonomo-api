/**
 * Coerces a request value to a finite number, falling back for null/undefined/empty-string
 * (so existing optional params keep working) while rejecting genuinely invalid input
 * (e.g. "abc") instead of silently propagating NaN into the tax engines.
 */
export function num(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid numeric value: ${JSON.stringify(value)}`);
  }
  return n;
}
