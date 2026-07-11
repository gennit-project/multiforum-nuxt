# Core Web Vitals Improvement Plan

This document is a concrete plan for improving Core Web Vitals on the deployed Topical/Multiforum site.

It is based on a live inspection of `https://www.topical.space/discussions` on July 10, 2026, not just local code review.

## Scope

Primary target routes:

- `/discussions`
- representative discussion detail pages
- key public forum listing pages

Primary metrics:

- **LCP**: reduce time to first meaningful content and largest image/text paint
- **INP**: reduce main-thread work, hydration cost, and overly eager client code
- **CLS**: prevent layout jumps from media, split-view panes, and late UI state changes

## Live Findings

### 1. Feed thumbnails are loading full-resolution originals

The deployed discussion list is rendering small thumbnails from very large source images.

Examples observed on the live page:

- `80x80` thumbnail backed by a `4032x3024` image (`~12.2 MP`)
- `32x32` avatar backed by a `1082x1086` image
- several `80x80` thumbnails backed by images in the `1768x1120` to `2400x1080` range

Observed oversize ratios included:

- ~`1905x`
- ~`1147x`
- ~`545x`
- ~`405x`

This is likely the single highest-value LCP and transfer-size improvement opportunity on the site.

### 2. The discussions page is shipping too much JS and CSS up front

On the live deployment, the initial page included approximately:

- `49` `modulepreload` scripts
- `108` script prefetches
- `17` style prefetches
- `24` stylesheets

Observed deployed asset sizes:

- main JS module response: about `856 KB`
- main CSS response: about `261 KB`

Even with caching, this is too much work for first load on slower devices and will directly affect both LCP and INP.

### 3. Public HTML is not aggressively cached

Observed HTML headers for `/discussions`:

- `cache-control: public, max-age=0, must-revalidate`
- `x-vercel-cache: MISS`

Observed response timing from the request I made:

- `starttransfer`: about `490 ms`
- `total`: about `490 ms`

That is not catastrophic, but public discussions pages should likely be cheaper to serve and cacheable at the edge for anonymous traffic.

### 4. Mobile above-the-fold rendering is weak

At mobile width, the page showed a large mostly empty top region before meaningful feed content. The screenshot looked more like a fallback/info layout than a healthy discussions landing page.

This needs verification in code, but if representative it will hurt:

- perceived LCP
- user engagement
- early scroll behavior

### 5. Image loading behavior is too eager

On the live page, inspected images were generally:

- `loading="auto"`
- no `fetchpriority`
- full-size `img` sources rather than responsive variants

That means the browser is making poor default guesses instead of being guided by the application.

## Goals

Suggested initial goals for public routes:

- reduce public route HTML TTFB to `< 250 ms` at the edge for cache hits
- reduce first-load JS shipped to the discussions route by at least `40%`
- reduce first-screen image bytes on discussions pages by at least `70%`
- eliminate oversized thumbnail downloads on feed/list pages
- ensure mobile discussion lists render meaningful content above the fold

## Workstreams

## Workstream 1: Fix Image Delivery First

This is the highest-confidence, highest-impact work.

### Objectives

- stop using original upload assets for feed thumbnails and avatars
- serve appropriately sized responsive images
- lazy-load non-critical images
- preserve layout space to avoid CLS

### Implementation plan

1. Inventory all image surfaces on public pages:
   - discussion list thumbnails
   - forum list thumbnails
   - avatars
   - detail-page inline media
   - banners and hero-like media

2. Introduce explicit image variants:
   - avatar sizes such as `32`, `48`, `64`
   - list thumbnail sizes such as `80`, `160`, `320`
   - detail-page content widths such as `640`, `960`, `1280`

3. Move list surfaces to responsive image markup:
   - use `srcset`
   - use `sizes`
   - ensure width/height or aspect-ratio is declared

4. Set loading priority intentionally:
   - offscreen feed thumbnails: `loading="lazy"` and `decoding="async"`
   - only the likely LCP image: `fetchpriority="high"` if needed
   - avoid marking many images as high priority

5. Add hard guards in code:
   - list-item image components should reject raw original URLs when a thumbnail variant is required
   - centralize image URL generation in one helper/composable

### Likely code areas

- reusable image components
- discussion list item components
- avatar/photo components
- download/media rendering components
- upload/storage URL helpers

### Verification

- compare transferred image bytes before/after on `/discussions`
- verify no thumbnail renders from original uploads on list pages
- confirm width/height or aspect-ratio is present for all list images

## Workstream 2: Cut Initial JavaScript and CSS

The deployed route is clearly preloading and prefetching too much.

### Objectives

- reduce first-load route cost
- reduce hydration and parse work
- prevent non-critical features from blocking the initial feed render

### Implementation plan

1. Audit Nuxt route prefetch and link prefetch behavior:
   - determine why the page emits such a large number of `modulepreload` and `prefetch` tags
   - disable or narrow automatic prefetching on high-traffic public routes

2. Identify features on `/discussions` that do not need immediate hydration:
   - tooltips
   - emoji/button popovers
   - rich editors
   - preview/detail panes when no item is selected
   - advanced dropdowns and modals

3. Convert non-critical components to lazy boundaries:
   - async components
   - client-only islands only where necessary
   - deferred hydration for non-visible interactive surfaces

4. Split route-specific code more aggressively:
   - keep list page logic separate from detail/editor logic
   - avoid pulling create/edit/comment tooling into public list routes

5. Reduce CSS loaded on first route:
   - identify global CSS that could be route-scoped or component-scoped
   - avoid importing detail-page/editor CSS into list pages

6. Review vendor chunking:
   - verify whether large shared chunks are forcing too much code into first load
   - isolate optional libraries such as maps, editors, and richer widgets

### Likely code/config areas

- `nuxt.config.*`
- app-level layout and navigation components
- route components for discussions/forum lists
- async component boundaries
- any global plugin that touches all pages

### Verification

- compare number of preload/prefetch tags before/after
- compare first-load JS bytes for `/discussions`
- inspect whether editor/detail-only code disappears from the list route payload

### Progress so far

- removed viewport-triggered `NuxtLink` prefetching in favor of interaction-only prefetch
- restored SSR rendering for the discussions index wrapper
- split discussion list/detail components behind async boundaries
- disabled explicit Google font prefetching
- reduced remote font loading to the single wordmark family still used by the public UI
- narrowed the remaining remote wordmark font to the Latin subset actually used by the public shell
- switched self-hosted `Inter` faces to `font-display: swap`
- removed unused self-hosted `Inter` weights from the global stylesheet
- removed the default sitewide discussions route from the global Font Awesome stylesheet path and migrated its shared shell/list icons to local SVG components
- migrated the shared discussion/download vote controls, multiselect chrome, event list cards, and image-upload trigger away from Font Awesome so more public list surfaces no longer depend on the global icon stylesheet
- removed the global Font Awesome stylesheet from the default sitewide discussions landing state and migrated its shared shell/list icons to local SVG components

## Workstream 3: Cache Public HTML and Public Data Better

Public listing pages are strong candidates for edge caching.

### Objectives

- reduce TTFB for anonymous users
- reduce server/render cost on hot public pages
- improve LCP without changing frontend markup

### Implementation plan

1. Classify routes by cacheability:
   - anonymous public listings
   - anonymous detail pages
   - authenticated personalized pages
   - mutation-heavy admin/editor pages

2. For anonymous public routes:
   - serve edge-cacheable HTML where safe
   - use `stale-while-revalidate` where freshness requirements allow it
   - keep authenticated/personalized responses unshared

3. Cache data-fetching layers separately where helpful:
   - trending/hot discussions
   - forum summaries
   - counts and metadata that do not need per-request recomputation

4. Normalize theme and locale behavior:
   - avoid unnecessary cache fragmentation if cookies cause public HTML variation
   - verify whether `theme` or locale cookies force avoidable dynamic responses

### Risks

- incorrect caching of personalized state
- stale moderation/auth visibility if caching boundaries are too broad

### Verification

- inspect `cache-control` and `x-vercel-cache` on anonymous public routes
- measure cache-hit TTFB after deployment

## Workstream 4: Fix Mobile Above-the-Fold Rendering

The mobile state should show useful content immediately.

### Objectives

- ensure discussion list content is visible without dead space
- prevent desktop split-view assumptions from degrading mobile LCP

### Implementation plan

1. Audit the mobile discussions route rendering path:
   - identify whether empty-state or detail-pane containers reserve large heights
   - check whether hidden split-view columns still consume layout space

2. Make mobile-first route decisions explicit:
   - if there is no selected discussion, render the list as the primary surface
   - do not reserve detail-pane real estate on small screens

3. Check header/nav weight:
   - trim sticky nav height where possible
   - ensure search/nav controls do not push meaningful content too far down

4. Confirm feed item density:
   - first item headline and metadata should appear near the top of the page

### Verification

- mobile screenshot review at common widths
- confirm visible discussion content above the fold on `/discussions`

## Workstream 5: Reduce INP by Shrinking Main-Thread Work

Even if LCP improves, input responsiveness will lag if hydration and event binding stay too heavy.

### Objectives

- reduce work during startup
- keep list scrolling, searching, and menu interactions responsive

### Implementation plan

1. Audit expensive always-on client plugins:
   - global listeners
   - theme/init scripts
   - search/index setup
   - analytics or instrumentation

2. Defer secondary interaction code:
   - discussion preview pane logic
   - popovers/tooltips
   - advanced filtering widgets

3. Avoid hydrating every interactive affordance immediately:
   - hydrate on visibility or first interaction where possible

4. Review long discussion list rendering:
   - consider virtualization only if the DOM is truly large enough to justify it
   - prefer lighter cards and deferred detail behavior first

### Verification

- measure startup JS execution in Lighthouse/DevTools
- verify no noticeable lag when opening menus, scrolling lists, or selecting posts

## Workstream 6: Add Performance Budgets and Regression Protection

Without budgets, the app will drift back.

### Objectives

- catch bundle growth
- catch image regressions
- keep public routes within target budgets

### Implementation plan

1. Add route-level budgets for public pages:
   - max initial JS bytes
   - max CSS bytes
   - max image bytes in first viewport

2. Add CI reporting where practical:
   - bundle analysis artifacts
   - Lighthouse/PageSpeed snapshots for core public routes

3. Add component-level safeguards:
   - image helper tests to prevent original asset usage on thumbnail surfaces
   - lint/checks around preload/prefetch volume if feasible

## Suggested Delivery Phases

## Phase 1: Highest ROI, lowest ambiguity

- implement thumbnail/responsive image pipeline
- lazy-load non-critical feed images
- fix mobile discussion-list above-the-fold layout

Expected impact:

- strongest LCP win
- reduced bandwidth
- immediate user-visible improvement

## Phase 2: Initial payload reduction

- reduce route prefetch/preload volume
- split list-route code from editor/detail tooling
- defer non-critical hydration

Expected impact:

- improved LCP
- improved INP
- better startup on slower devices

## Phase 3: Caching and server response

- add edge-friendly caching for public HTML and data
- reduce re-render cost on anonymous traffic

Expected impact:

- lower TTFB
- steadier LCP under load

## Phase 4: Ongoing protection

- add budgets
- add automated reporting
- document accepted thresholds

## Metrics to Capture Before and After

For `/discussions` and one representative detail page, capture:

- TTFB
- LCP
- INP
- CLS
- total transferred bytes
- total JS bytes on first load
- total CSS bytes on first load
- image bytes in initial viewport
- number of preloaded modules
- number of prefetched modules

## Recommended First Implementation Tickets

1. **Introduce responsive thumbnail generation for discussion list images**
   - owner: frontend + media/storage
   - success: no list page loads original full-size uploads for thumbnails

2. **Audit and reduce Nuxt prefetch/modulepreload emission on `/discussions`**
   - owner: frontend platform
   - success: initial preload/prefetch count drops substantially

3. **Separate list-route code from editor/detail code paths**
   - owner: frontend
   - success: first-load JS for `/discussions` drops materially

4. **Fix mobile discussions layout to show content above the fold**
   - owner: frontend UX
   - success: first feed item visible near the top at mobile width

5. **Add caching policy for anonymous public routes**
   - owner: frontend platform / deployment
   - success: repeated anonymous requests show edge cache hits

## Notes

- The existing [docs/performance.md](./performance.md) is useful background, but it appears to describe earlier optimization work and does not reflect the current live deployment shape.
- This plan should be treated as the current execution document for Core Web Vitals improvements on the public site.
