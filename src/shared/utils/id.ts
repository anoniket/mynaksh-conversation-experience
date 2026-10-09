let counter = 0;
/** Client-side id for optimistic inserts. Stable across retries of the same send. */
export function createClientId(prefix = 'c'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}
