// A non-UUID id can never match a uuid primary key, and passing it to a
// uuid column makes Postgres throw a cast error (surfacing as a 500). Guard
// repository lookups with this so a malformed id is treated as "not found".
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
