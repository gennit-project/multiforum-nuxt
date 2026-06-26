import { describe, it, expect } from 'vitest';

// Guards every GraphQL document in graphQLData/: each fragment spread must
// resolve to a definition present in the same document. Catches a
// `...SomeFragment` spread whose `${SOME_FRAGMENT}` interpolation was forgotten,
// which would otherwise only surface as an "Unknown fragment" error at runtime.
const modules = import.meta.glob('../../graphQLData/**/*.{js,ts}', {
  eager: true,
}) as Record<string, Record<string, unknown>>;

type AstNode = { kind?: string; name?: { value: string }; [k: string]: unknown };

function collect(doc: AstNode) {
  const spreads = new Set<string>();
  const defs = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as AstNode;
    if (n.kind === 'FragmentSpread' && n.name) spreads.add(n.name.value);
    if (n.kind === 'FragmentDefinition' && n.name) defs.add(n.name.value);
    for (const val of Object.values(n)) {
      if (Array.isArray(val)) val.forEach(visit);
      else if (val && typeof val === 'object') visit(val);
    }
  };
  visit(doc);
  return { spreads, defs };
}

describe('graphQLData fragment resolution', () => {
  const unresolved: string[] = [];
  let checked = 0;

  for (const [path, mod] of Object.entries(modules)) {
    for (const [name, value] of Object.entries(mod)) {
      const doc = value as AstNode;
      if (!doc || doc.kind !== 'Document') continue;
      checked++;
      const { spreads, defs } = collect(doc);
      for (const spread of spreads) {
        if (!defs.has(spread)) {
          unresolved.push(`${path} → ${name}: "${spread}"`);
        }
      }
    }
  }

  it('resolves every fragment spread to a local definition', () => {
    expect({ checked: checked > 0, unresolved }).toEqual({
      checked: true,
      unresolved: [],
    });
  });
});
