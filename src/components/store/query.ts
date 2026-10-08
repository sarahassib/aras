export type QueryValue = string | string[] | undefined;

/** Builds a query string from params, dropping empty values and managing arrays. */
export function buildQuery(
  base: Record<string, QueryValue>,
  changes: Record<string, QueryValue>,
): string {
  const merged: Record<string, QueryValue> = { ...base, ...changes };
  const usp = new URLSearchParams();
  for (const [key, raw] of Object.entries(merged)) {
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const value of values.filter((v) => v !== "" && v !== undefined)) {
      usp.append(key, value);
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

/** Toggles one value inside a repeated (array) param. */
export function toggleArrayValue(
  current: string | string[] | undefined,
  value: string,
): string[] {
  const list = Array.isArray(current) ? current : current ? [current] : [];
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
