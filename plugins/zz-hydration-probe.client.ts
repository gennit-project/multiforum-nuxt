// TEMP DIAGNOSTIC (remove after): pinpoint the residual hydration mismatch on
// the Vercel runtime. Captures (a) the Vue warnings, and (b) the DOM mutations
// Vue makes to lg:pl-20 right after hydration — the nodes it REMOVES are the
// "server more children" extras (the mismatch). Read window.__hyd / __mut.
import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window === 'undefined') return;
  const w = window as any;
  w.__hyd = [];
  w.__mut = [];
  const ow = console.warn;
  const oe = console.error;
  const cap = (kind: string, orig: any) => (...args: any[]) => {
    try {
      const s = args
        .map((a) =>
          a && a.nodeType === 1
            ? 'EL<' + a.tagName.toLowerCase() + ' class="' + (a.getAttribute('class') || '') + '">'
            : String(a)
        )
        .join(' ');
      if (/hydrat|mismatch|children|vdom/i.test(s)) w.__hyd.push(kind + ' :: ' + s.slice(0, 400));
    } catch {
      /* ignore */
    }
    orig(...args);
  };
  console.warn = cap('warn', ow);
  console.error = cap('error', oe);

  const desc = (n: Node): string => {
    if (n.nodeType === 8) return 'COMMENT<!--' + ((n as Comment).data || '').slice(0, 18) + '-->';
    if (n.nodeType === 3) return 'TEXT"' + (n.textContent || '').trim().slice(0, 20) + '"';
    if (n.nodeType === 1) {
      const e = n as Element;
      return (
        'EL<' +
        e.tagName.toLowerCase() +
        ' class="' +
        (e.getAttribute('class') || '').slice(0, 40) +
        '"' +
        (e.getAttribute('data-testid') ? ' testid=' + e.getAttribute('data-testid') : '') +
        '>'
      );
    }
    return '#' + n.nodeType;
  };
  const pathOf = (el: Element | null): string => {
    const p: string[] = [];
    let n: Element | null = el;
    let d = 0;
    while (n && d < 8) {
      p.unshift(
        n.tagName.toLowerCase() +
          '.' +
          (n.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2).join('.')
      );
      n = n.parentElement;
      d++;
    }
    return p.join('>');
  };

  nuxtApp.hook('app:beforeMount', () => {
    const root = document.querySelector('div.lg\\:pl-20') || document.body;
    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type !== 'childList') continue;
        const removed = Array.from(r.removedNodes);
        const added = Array.from(r.addedNodes);
        if (!removed.length && !added.length) continue;
        if (w.__mut.length < 30) {
          w.__mut.push({
            at: pathOf(r.target as Element),
            removed: removed.map(desc),
            added: added.map(desc),
          });
        }
      }
    });
    obs.observe(root, { childList: true, subtree: true });
    // stop after the post-hydration settle so we only capture the re-render burst
    setTimeout(() => obs.disconnect(), 3000);
  });
});
