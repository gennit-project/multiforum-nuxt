---
name: nuxt-ssr-hydration
description: Prevent and debug SSR hydration mismatches in this Nuxt app. Use whenever a component's output could differ between server and client — auth-dependent UI, async/GraphQL data, dates/times, viewport/responsive decisions, module-level state, or browser-only APIs/directives — or when investigating a "Hydration completed but contains mismatches" warning.
---

# SSR hydration in Nuxt (multiforum-nuxt)

> **Mental model:** *"The server and the browser must render from the same truth, and
> that truth must belong to exactly one request."* — the project write-up,
> [The server and the browser must agree](https://www.catherineluse.com/post/the-server-and-the-browser-must-agree).

A hydration mismatch is not just a rendering glitch — it's a **boundary failure**. The same
divergences that corrupt the DOM also leak auth state, poison caches across requests, and
break request isolation. Treat "the markup didn't match" as "the server and client disagreed
about who the user is / what time it is / whose request this is."

## The five sources of divergence (and the fix)

1. **Auth asymmetry.** The server renders logged-out while the browser discovers identity in
   storage → personalized SSR is impossible and hydration diverges. Resolve the session
   **server-side** before rendering (`@auth0/auth0-nuxt`). For UI that is intrinsically
   client-only auth state, wrap it in `<ClientOnly>` — see rule below.
2. **Non-determinism.** Anything that evaluates differently per environment: `DateTime.local()`
   (timezone), `Math.random()`, `Date.now()`, and Apollo cache differences from query
   **resolution order**. Fixes: canonical values (`DateTime.utc()`), wrap reactive values in
   functions so they're recomputed consistently, and define Apollo **merge policies** for
   fields whose arrival order varies.
3. **Cross-request state pollution.** A module-level `ref`/singleton is shared across every
   server request, so one user's data bleeds into another's render. Use Nuxt's
   **`useState()`** for request-scoped state (it serializes into the payload and isolates per
   request) — never a module-level `ref` for request data.
4. **Cache boundaries are an authorization layer.** ISR/edge caching personalized HTML from
   the first logged-in request and serving it to anonymous visitors is a security bug, not a
   perf detail. Do not shared-cache authenticated routes; make caching explicitly
   anonymous-only.
5. **Viewport / browser-only decisions at render.** The server guesses one breakpoint, the
   browser picks another. Configure libraries SSR-aware (`ssr: true`) rather than branching on
   `window`/media queries during render.

## `<ClientOnly>` — a scalpel, not a blanket
- Reach for it only around an **intrinsically browser-only capability**, not to paper over a
  divergence you could make deterministic (prefer fixing the source).
- **Wrap at the source** — where the slot content is *defined* (the parent), not inside the
  child that receives the slot. `<ClientOnly>` in the child does nothing for content passed
  into its slot:
  ```vue
  <!-- CORRECT: wrap where the content is authored -->
  <Child>
    <ClientOnly>
      <MyComponent v-if="asyncData" />
    </ClientOnly>
  </Child>
  ```
- **Fallback structure must match** what hydration expects, or Vue abandons hydration for the
  whole surrounding section (not just the wrapped node). Provide a matching `#fallback` when
  the placeholder shape matters.
- Existing examples in this repo: `components/discussion/detail/DiscussionDetailContent.vue`
  (comment-form wrappers) and `DiscussionCommentsWrapper.vue` (subscribe button).

## Browser-only custom directives
A directive that touches the DOM crashes on SSR. Register it universally with
`getSSRProps() { return {} }` and install the real behavior only in `beforeMount` /
`unmounted` — never in the render path.

## Investigation discipline (when a mismatch appears)
- **Hard refresh vs. soft navigation**: a bug that only appears on hard refresh is SSR-specific
  (soft nav renders client-side). This isolates SSR problems fast.
- Temporarily enable detailed hydration-mismatch output to see the exact diverging node;
  record the finding permanently (here) once fixed.
- Build a **minimal reproduction** and separate framework behavior from integration failure
  before filing anything upstream (a caching bug can masquerade as an SDK bug).

## Related
- Query variables / cache merge policies: [apollo-data](../apollo-data/SKILL.md).
- CLAUDE.md → "SSR and Hydration" lists the current `<ClientOnly>` wrapper sites.

## Before finishing
Verify the affected page on a **hard refresh** (not just soft nav) with no hydration warning in
the console, then `pnpm run tsc`.
