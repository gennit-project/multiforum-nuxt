# Discussion-page hydration flash — investigation handoff

**Status:** 🔴 **Unresolved.** Several real bugs found and fixed (and merged),
but the user-visible flash **still happens**. This document captures the full
state so the next session can resume without re-deriving everything.

Last updated: 2026-06-21.

---

## The symptom

On discussion **detail** pages, the page content renders, then **disappears
(black/blank screen), then reappears** — a visible flash on first load. Console
shows:

> Hydration completed but contains mismatches.

Canonical repro URL:
`https://www.topical.space/forums/sourceit/discussions/92a528b0-b5ce-487d-97c8-d2c2415e6477`

The user re-confirmed on 2026-06-21 (after PR #110) that **the flash still
occurs**: "the discussion detail page appears, disappears and reappears."

---

## What the flash actually *is* (confirmed mechanism)

A temporary `MutationObserver` probe (since removed — see "Diagnostic toolkit")
captured the smoking gun on the Vercel runtime:

- The page-content `<div>` (`class="flex min-w-0 flex-1 flex-col bg-white
  dark:bg-black lg:pl-20"`, i.e. `div.lg:pl-20` in the default layout) is
  **removed from the DOM and then re-added** right after hydration.
- That remove/re-add is the black-screen flash.

Mechanically: when Vue hits a hydration mismatch in a subtree, it **bails out of
hydrating that subtree and client-renders it from scratch** — which means
removing the server DOM and re-inserting client-rendered DOM. So *any* mismatch
inside the content subtree can produce this exact remove/re-add flash.

**Key implication:** finding and killing mismatches one at a time only helps if
we kill *the* one inside the flashing subtree. We fixed several mismatches; at
least one remains in (or above) the discussion-content subtree.

---

## Environment / why this is hard

- **Nuxt 4.4.8**, **Vue 3** SSR, **Nitro `vercel` preset** in production.
- **The flash only reproduces on the Vercel runtime**, and appears
  concurrency-related. A local `node-server` build (`NITRO_PRESET=node_server`,
  then `node --env-file=.env .output/server/index.mjs`) **never reproduced the
  visible flash**, even though we could inspect SSR HTML structure there.
- Therefore **verification must happen on a deployed environment.** Preview
  deploys were **SSO-protected** (couldn't fetch their HTML), so we verified on
  prod. Either disable Vercel SSO on previews or accept brief prod verification.
- Node 24 required locally (`nvm use 24`). Backend GraphQL is the Heroku dev
  instance.

---

## Timeline of fixes (all merged to `main`)

Each of these was a genuine bug. They reduced/altered the mismatch but the flash
persists.

| PR | SHA | What |
|----|-----|------|
| #106 | `e1ef213c` | **SSR Apollo auth.** Authenticate SSR GraphQL queries so server-rendered, auth-dependent content matches the client. Added `plugins/apollo-ssr-auth.ts` (`apollo:auth` hook reads `nuxtApp.ssrContext.event.context.accessToken`) and `server/middleware/2.auth-session.ts` sets `event.context.accessToken`. |
| #107 | `19aa7bb8` | **Request-scoped auth state (the big one).** Module-level `ref()`s in `cache.ts` are shared across requests in Nuxt SSR → one user's auth state leaked into another's SSR render (a real security/privacy bug *and* a hydration-mismatch source). Replaced with request-scoped `useState` composables in `composables/useAuthState.ts`; server seeding in `plugins/auth-session.ts`. **Verified on prod:** anonymous SSR authed-markers went 15 → 0. |
| — | — | **Vuetify `ssr: true`** in `plugins/vuetify.ts` — makes `useDisplay()` breakpoints (`lgAndUp`/`mdAndUp`) consistent SSR vs client (was causing a responsive-nav mismatch). |
| — | — | **`<NuxtRouteAnnouncer>` wrapped in `<ClientOnly>`** in `app.vue`. |
| #110 | `78ea5c2b` | **Layout `ClientOnly` `#fallback` removal.** The mobile-nav and footer `<ClientOnly>` blocks in `layouts/default.vue` had `#fallback` slots. Nuxt renders `#fallback` content wrapped in Vue **fragment-boundary comment markers** (`<!--[-->` / `<!--]-->`) on SSR that the client VDOM doesn't reproduce → "server rendered more child nodes than client vdom" → re-render of the layout column → removed/re-added the content `<div>`. Removing the fallbacks makes each `ClientOnly` render a single `<span>` placeholder. **Verified on prod SSR:** layout-column children are now `nav | <span> | content-div | <span>`, no fragment markers. **But the flash still happens.** |

> PR #110 also removed the temporary diagnostics that PRs #108/#109 had merged
> to main (the probe + the detail flag).

### Tangential cleanup PR (unrelated to the flash)
- **#111** `chore(test): replace require('vue') in mock factories with dynamic
  import` — removes `require('vue')` + its eslint-disable comments from 16 spec
  files. Pure test hygiene; **not** a Vuetify or hydration issue. (Open at time
  of writing.)

---

## Why PR #110 wasn't enough

PR #110 eliminated the **layout-column** fragment-marker mismatch (the
`ClientOnly` placeholders around mobile-nav and footer). That was *a* cause of
the content `<div>` being re-rendered, but evidently **not the only one**. The
remaining mismatch is most likely **inside the discussion-detail content
subtree itself** (or another `ClientOnly`/`v-if` boundary within it), which
still trips Vue's hydration bail-out and re-renders the content.

---

## Remaining hypotheses (ranked, for next session)

1. **A mismatch inside the discussion-detail content**, not the layout.
   Prime suspects (auth/async-dependent `v-if` not wrapped in `<ClientOnly>` *at
   the source*, per the rule in `CLAUDE.md` → "SSR and Hydration"):
   - `components/discussion/detail/DiscussionTitleEditForm.vue` — the
     `<p class="ml-1 mt-1 flex ...">` containing a `<slot />` (back-link) plus
     `<span v-if="answered">`. Suspected earlier; treated as a symptom but never
     definitively cleared.
   - `components/discussion/detail/DiscussionDetailContent.vue` — comment-form
     `ClientOnly` wrappers.
   - `components/discussion/detail/DiscussionCommentsWrapper.vue` — subscribe
     button.
2. **Other `ClientOnly` fragment markers nested in the content.** The SSR HTML
   still contains `<!--[-->...<!--]-->` markers inside the article/content
   internals (seen while checking the footer placeholder). Some of those may be
   another `#fallback`/slot boundary that doesn't survive hydration.
3. **Authenticated-user data divergence via Apollo.** Even with #106/#107, if a
   query resolves to different data on the client than was serialized from SSR
   (`payload.data['_apollo:default']`), the rendered content differs → mismatch.
   Worth checking whether the flash happens **logged out vs logged in**, and
   whether it's tied to a specific query.
4. **A Vuetify component inside the content** using `useDisplay()` or other
   client-only state despite `ssr: true`.

Note: hypotheses 1–2 are structural (cheap to find with the detail flag);
3–4 are data/state-driven.

---

## Diagnostic toolkit (how to resume the hunt)

Two temporary diagnostics existed and were removed in PR #110. **Re-add them to
a throwaway branch, deploy, and read them on the Vercel runtime.**

### 1. `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` flag
In `nuxt.config.ts`, inside the `vite.define` block:
```ts
define: {
  global: 'globalThis',
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true', // TEMP DIAGNOSTIC
},
```
This makes the **production** console print the **exact element/text** that
mismatched (otherwise prod Vue prints only the generic "contains mismatches"
line with no detail). This is the single most valuable next step — it should
name the offending node directly.

### 2. MutationObserver + console-capture probe
The full probe lived at `plugins/zz-hydration-probe.client.ts`. It:
- Wraps `console.warn`/`console.error` and pushes any hydration/mismatch lines
  to `window.__hyd`.
- Hooks `app:beforeMount`, observes `div.lg:pl-20` (subtree, childList), and
  records removed/added nodes to `window.__mut` (with element class/testid),
  disconnecting after 3s.

After load, read `window.__hyd` (the warnings) and `window.__mut` (which nodes
got removed/re-added).

**Both are recoverable from git** — cherry-pick or copy from:
- `6373df51` — "diag: hydration probe + details" (PR #108), and/or
- `5a23f06b` — "MutationObserver probe to capture lg:pl-20 re-render nodes" (PR #109).

⚠️ **Remember to remove them again before final merge** (PR #110 is the template
for that cleanup: delete the plugin, drop the define flag).

---

## Reproduce / verify

1. **Deployed only.** Local node build won't show the flash. Use prod, or a
   preview with SSO disabled.
2. Open the canonical URL above with DevTools console open; watch for the
   flash and the mismatch warning.
3. With the detail flag on, the console names the mismatched node — that's the
   target.
4. To inspect SSR structure (no flash, but shows markers/structure):
   `curl -s "<url>" > /tmp/ssr.html` then inspect the
   `div.relative.flex.flex-grow.flex-col` (layout column) and the
   `div.lg:pl-20` (content) subtrees.
5. Confirm a deploy is the commit you think: the removed probe is a useful
   tell — `grep -c "zz-hydration\|__hyd\|__mut" /tmp/ssr.html` is `0` on
   post-#110 builds.

---

## Key files

- `layouts/default.vue` — the layout; content lives in `div.lg:pl-20` (fixed in #110).
- `composables/useAuthState.ts` — request-scoped auth state (`useUsername`, `useIsAuthenticated`, etc.).
- `plugins/auth-session.ts` — seeds auth state server-side from the session.
- `plugins/apollo-ssr-auth.ts` — `apollo:auth` hook for SSR query auth.
- `server/middleware/2.auth-session.ts` — sets `event.context.accessToken`.
- `plugins/vuetify.ts` — `createVuetify({ ssr: true })`.
- `app.vue` — `<NuxtRouteAnnouncer>` under `<ClientOnly>`.
- Suspected content components: `components/discussion/detail/DiscussionTitleEditForm.vue`,
  `DiscussionDetailContent.vue`, `DiscussionCommentsWrapper.vue`.
- `CLAUDE.md` → "SSR and Hydration" — the project's rule: wrap async/auth-dependent
  `v-if` in `<ClientOnly>` **at the source** where the slot content is defined.

---

## Recommended next step

1. Branch off `main`, re-add **just the detail flag** (`__VUE_PROD_HYDRATION_MISMATCH_DETAILS__`),
   deploy, load the discussion page, and read the console — it should name the
   exact mismatching element.
2. If the named node is an async/auth `v-if`, wrap it in `<ClientOnly>` at its
   source (or fix the SSR/client data divergence behind it).
3. Re-test on the deployed env; if the flash is gone, remove the flag and merge.
4. Check **logged-out vs logged-in** — if the flash is auth-state-specific, that
   points at hypothesis 3 (Apollo data divergence) rather than a static `v-if`.
