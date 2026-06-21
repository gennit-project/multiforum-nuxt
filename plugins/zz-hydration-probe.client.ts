// TEMP DIAGNOSTIC (remove after): capture the hydration mismatch + the client's
// first-render of the content wrapper on the Vercel runtime, where the mismatch
// reproduces (it does not on a local Node build). Read window.__hyd /
// window.__firstRender / window.__authVars off the live page.
import { defineNuxtPlugin } from 'nuxt/app';
import {
  useUsername,
  useModProfileName,
  useIsAuthenticated,
} from '@/composables/useAuthState';

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window === 'undefined') return;
  const w = window as any;
  w.__hyd = [];
  const ow = console.warn;
  const oe = console.error;
  const ser = (a: any) =>
    a && a.nodeType === 1
      ? 'EL<' + a.tagName.toLowerCase() + ' class="' + (a.getAttribute('class') || '') + '">'
      : String(a);
  const cap = (kind: string, orig: any) => (...args: any[]) => {
    try {
      const s = args.map(String).join(' ');
      if (/hydrat|mismatch|children|vdom/i.test(s)) {
        w.__hyd.push(kind + ' :: ' + args.map(ser).join(' | ').slice(0, 500));
      }
    } catch {
      /* ignore */
    }
    orig(...args);
  };
  console.warn = cap('warn', ow);
  console.error = cap('error', oe);

  const uName = useUsername();
  const uMod = useModProfileName();
  const uAuth = useIsAuthenticated();
  nuxtApp.hook('app:mounted', () => {
    w.__authVars = {
      username: uName.value,
      modProfileName: uMod.value,
      isAuthenticated: uAuth.value,
    };
    const el = document.querySelector('div.lg\\:pl-20');
    w.__firstRender = el ? el.outerHTML : 'none';
  });
});
