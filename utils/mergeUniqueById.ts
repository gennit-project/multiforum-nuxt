/**
 * Append `incoming` items onto `existing`, skipping any whose `id` is already
 * present. Used to accumulate paginated lists (e.g. a collection's downloads)
 * without introducing duplicates when pages overlap. Order is preserved:
 * existing items first, then new items in arrival order. Falsy incoming entries
 * are ignored.
 */
export function mergeUniqueById<T extends { id: string }>(
  existing: T[],
  incoming: (T | null | undefined)[] | null | undefined
): T[] {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming || []) {
    if (item && !seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}
