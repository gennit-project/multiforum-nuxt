---
name: accessibility
description: Build accessible Vue/Nuxt UI to WCAG 2.2 AA. Use when creating or editing any component, page, form, modal, menu, tab, toast, tooltip, or interactive control — especially anything with @click, custom widgets, dynamic content, or images. The prevention layer that keeps a11y defects from being written; lint:a11y (eslint) and axe (Playwright) are the detection layers that catch what slips through.
---

# Accessible Vue/Nuxt (WCAG 2.2 AA)

Prevent accessibility defects at authoring time. This repo already *detects* violations
via `pnpm run lint:a11y` (eslint on components) and axe-core in Playwright
(`tests/playwright/helpers/axe.ts`) — this skill stops them being written in the first
place. Target profile: **WCAG 2.2 AA** (the project's stated standard).

> Adapted for Vue/Nuxt from **A11Y.md** by Felipe A. Carriço — MIT license —
> https://github.com/fecarrico/A11Y.md. Its examples are React/TSX; the rules below are
> transposed to Vue single-file components with semantics preserved.

## Behavior contract (apply proactively while generating; audit while reviewing)

1. **No inference.** Don't claim something is accessible without evidence in the code/spec.
2. **Reference the APG.** For any custom widget, follow the WAI-ARIA Authoring Practices
   Guide pattern (roles, states, keyboard interaction) — don't improvise ARIA.
3. **Interrogate non-semantic interactivity.** Before putting `@click` on a `<div>` /
   `<span>`, replace it with a native element (`<button>`, `<a>`/`<NuxtLink>`) or a full
   APG ARIA pattern. A clickable non-button is the #1 defect this repo's eslint rule flags.
4. **Reuse before creating.** Check `components/` for an existing button/modal/menu/form
   control and extend it rather than spawning a parallel, differently-accessible pattern.
5. **Explain trade-offs** when a change touches accessibility, and **audit in review mode**:
   identify violations, classify severity, suggest targeted fixes — don't rewrite whole
   components unless the structure is critically broken.

## AA thresholds (house defaults for this repo)
- **Contrast:** 4.5:1 for normal text, 3:1 for large text / UI components / meaningful
  graphics (SC 1.4.3, 1.4.11). Keep dark-mode (`dark:`) variants in contrast too.
- **Target size:** aim for 44×44px; 24×24px is the hard AA floor (SC 2.5.8).
- **Accessible names** on every input and interactive control — a real `<label>` (or
  `aria-label` / `aria-labelledby` when no visible label exists).

## Vue patterns (the high-frequency ones)

**Interactive elements — use native semantics:**
```vue
<!-- ❌ not focusable, no role, no keyboard, no :disabled semantics -->
<div class="btn" @click="save">Save</div>
<!-- ✅ -->
<button type="button" @click="save">Save</button>
<!-- navigation → a link, not a click handler -->
<NuxtLink :to="href">Open discussion</NuxtLink>
```

**Forms — associate label and control, announce errors:**
```vue
<label :for="id">Title</label>
<input :id="id" v-model="title" :aria-invalid="!!error" :aria-describedby="error ? errId : undefined" />
<p v-if="error" :id="errId" role="alert">{{ error }}</p>
```

**Icon-only controls need a name:**
```vue
<button type="button" :aria-label="expanded ? 'Collapse' : 'Expand'" @click="toggle">
  <Icon name="chevron" aria-hidden="true" />
</button>
```

**Dynamic / async content must be announced.** Wrap client-only, auth-, or query-driven
regions per this repo's SSR rules (see CLAUDE.md “SSR and Hydration”), and expose status
politely so screen readers hear updates:
```vue
<p aria-live="polite">{{ resultCount }} results</p>   <!-- CharCounter.vue already does this -->
```

**Modals / menus / tabs / tooltips (composite widgets):** follow the matching APG pattern —
focus trap + `Esc` to close + return focus for dialogs; roving `tabindex` + arrow keys for
menus/tabs. Prefer extending the existing components over hand-rolling ARIA.

**Images:** meaningful images need `alt`; decorative images use `alt=""` (or `aria-hidden`).

## Upstream reference guides (consult on demand, transpose to Vue)
A11Y.md ships 21 APG-aligned guides — pull the relevant one when building that widget:
`buttons, forms, modals, navigation, tabs-accordion, tooltips-popovers,
toasts-notifications, tables, images, carousels-sliders, drag-drop, autocomplete,
infinite-scroll, loading-skeleton, content-interaction, responsive-mobile,
visual-perception`, plus compliance/governance guides. Source:
https://github.com/fecarrico/A11Y.md/tree/main/docs/en/references

## Before finishing
Run `pnpm run lint:a11y`; for user-facing flows, exercise the axe helper in a mocked
Playwright test (see [write-mocked-playwright-test](../write-mocked-playwright-test/SKILL.md)).
