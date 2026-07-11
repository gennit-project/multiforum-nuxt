# Plugin Configuration — UX & Integrity (Design)

**Status:** Proposal / scoping. Not yet implemented.

This doc covers a cluster of related plugin-configuration problems that all share
one root need: **make "is this plugin cleanly and completely configured?" both
visible and enforced.** It groups four features that touch the same components
(`PluginSecretsSection`, the settings-form renderer) and the same data
(`getServerPluginSecrets`, the per-version `settingsJson`, and the manifest):

1. A shared **config-status model**.
2. **Enable-gating** on required settings *and* secrets.
3. **Secret / setting rendering clarity** (dedupe, secret vs non-secret, orphaned secrets).
4. **Config carry-over** on version upgrade.

---

## Problems observed

- **Duplicated fields.** A secret that a manifest declares in both `secrets[]`
  *and* as a `type: "secret"` field in `ui.forms` renders twice — once in the
  "Required Secrets" section and again in the settings form.
- **Orphaned secrets.** The secrets list shows stored secrets that the *current*
  version no longer declares (e.g. a renamed/removed key from an older version),
  presented as if still required.
- **Ambiguous "set" state.** A non-secret setting (e.g. Service URL) renders with
  secret-style treatment — a "set" tag and a placeholder instead of its actual
  value — so you can't tell if it's set. Secret vs non-secret rendering is
  inconsistent (only some fields show the write-only note).
- **Enable without config.** The Enable button lets you enable a plugin with a
  required *setting* empty. (Required *secrets* are already validated on enable;
  required non-secret settings are not.) For a fail-closed security plugin this
  is a footgun — an enabled-but-misconfigured plugin can block every upload.
- **Config lost on upgrade.** Upgrading a plugin version drops all settings, so
  the admin re-enters everything.

---

## Current state (grounded)

- **Settings** live in `settingsJson` **on the `ServerConfig`→`PluginVersion`
  install edge** — per version. `installPluginVersion` connects a new version
  with `settingsJson: null`, so an upgrade drops settings. `enableServerPlugin`
  writes `settingsJson` and **validates required secrets** from the manifest —
  but **not required non-secret settings**.
- **Secrets** are `ServerSecret` nodes keyed by **(pluginId, key)** — version
  independent, so they persist across upgrades *when the key name is unchanged*.
  Values are write-only (encrypted; cannot be read back).
- **Secret status already exists:** `getServerPluginSecrets` returns per-secret
  `status ∈ { NOT_SET, SET_UNTESTED, VALID, INVALID }`. `PluginSecretsSection`
  colors a chip from it; the settings form also reuses it for `type: "secret"`
  fields (which is how the duplicate arises).
- **Manifest config is scoped.** `ui.forms` and `settingsDefaults` are already
  split by scope (`server` vs `channel`), so any config-status computation must
  be scope-aware instead of treating the manifest as one flat settings bag.
- Effective runtime config = `mergeSettings(manifest.settingsDefaults, edge.settingsJson)`.
- The manifest can (today) declare a secret in two places; nothing dedupes or
  lints this.

---

## Unifying concept: a config-completeness status

Introduce one derived status for an installed `(plugin, version, scope)` that
everything else renders or enforces. For each field the manifest declares for
that **scope only** (settings via `ui.forms[scope]` / `settingsDefaults[scope]`,
secrets via `secrets[]`):

| field kind | `required` | `isSet` | `isValid` |
|-----------|-----------|---------|-----------|
| setting | from field def | value is materially present after merging defaults + saved settings (for strings: non-empty after trim; for numbers/booleans: present; for selects: one allowed option) | passes field validation (required, pattern, enum/range, type) |
| secret | from `secrets[]` | a `ServerSecret` exists for `(pluginId, key)` — **boolean only, never the value** | policy-driven from secret status: `VALID` = valid; `INVALID`/`NOT_SET` = invalid; `SET_UNTESTED` = either allowed-but-unverified or blocked-until-validated, see decision below |

Plus a rollup: `isFullyConfigured` = every required field `isSet` && `isValid`.

This single object drives the green ✓ indicators, the Enable gate, the
carry-over preview, and the "orphaned secret" detection below.

---

## Feature 1 — Config-status model (foundation)

- Backend: expose config status for an installed version — either extend the
  installed-plugins query or add a `getPluginConfigStatus(pluginId, version)`
  that returns per-field `{ key, scope, kind, required, isSet, isValid }`
  (secrets as booleans). Reuse the existing `getServerPluginSecrets` logic for
  secrets and compute settings status from `settingsJson` + manifest field defs.
- Frontend: a composable that consumes it, so indicators, the Enable gate, and
  the upgrade preview all read the same source.
- Keep the setting-level validator aligned with the existing form validator so
  the UI and backend agree on what counts as missing vs invalid.

Everything below is mostly *rendering or enforcing* this status.

## Feature 2 — Enable-gating (settings + secrets)

- **Backend** `enableServerPlugin`: in addition to the existing required-secret
  check, validate **required non-secret settings** from the manifest; reject
  enabling with a clear, structured error listing every missing/invalid field
  (settings and secrets). Enabling should be impossible while
  `isFullyConfigured` is false.
- **Secret-status policy:** decide explicitly whether `SET_UNTESTED` counts as
  enable-able. Today the frontend effectively allows it; if we tighten the gate
  to require `VALID`, call that out as an intentional behavior change and limit
  it to plugins whose secrets can actually be validated ahead of runtime.
- **Frontend**: disable the Enable button while required config is missing and
  show a checklist of exactly what's outstanding (deep-linking to each field).
- **Why hard-block (recommendation):** for a fail-closed security plugin, an
  enabled-but-misconfigured plugin blocks all uploads. A hard block (not a
  dismissible warning) prevents that. *(Open decision — see below.)*

## Feature 3 — Secret / setting rendering clarity

Adopt one rule: **secrets are declared once (`secrets[]`) and render in exactly
one place; `ui.forms` is for non-secret settings only.**

- **Dedupe:** if a `ui.forms` field references a key that is also a declared
  secret, don't double-render it (skip it in the form, or render the single
  secret input in-place — see open decision). Belt-and-suspenders so no manifest
  can produce the duplicate regardless.
- **Distinguish rendering by kind:**
  - *Secrets:* masked input, write-only note, and a consistent status chip — a
    clear green ✓ when `VALID`/set, a distinct "Required — not set" when
    `NOT_SET`, and an error state on `INVALID`. Same treatment everywhere.
  - *Non-secret settings:* show the **actual current value** (prefilled,
    editable); no "set" tag, no write-only note.
- **Orphaned secrets:** split the secrets list into "required by this version"
  (intersect stored secrets with the current manifest's `secrets[]`) vs "stored
  but no longer declared" (e.g. a renamed key from a prior version). Show the
  latter in a separate informational section, not in the required list. Avoid
  eager deletion by default: because secrets are version-independent, an
  "unused in this version" secret may still be needed for rollback or downgrade.
  If we later add deletion, it should be an explicit cleanup action with a
  warning about version compatibility.
- **Manifest lint (nice-to-have):** at install / registry-generate, warn a
  plugin author if a key is declared in both `secrets[]` and `ui.forms`.

## Feature 4 — Config carry-over on upgrade

Because settings live on the per-version edge and reset to `null` on upgrade,
carry them over (reconciled against the new version's schema) instead.

- **Reconcile function** (pure, testable):
  `reconcileSettings(oldSettings, newManifest, scope) → { settings, carried[], dropped[], reset[] }`
  1. start from the new version's **scope-specific defaults** (new keys get sane values),
  2. carry old keys that still exist in the new schema **and** are type/enum-valid,
  3. **drop** old keys not in the new schema (report; don't silently keep),
  4. **reset** old values that are invalid for the new field (use default; flag).
  This keeps upgrade carry-over aligned with the same `server` vs `channel`
  split used everywhere else in the manifest.
- **`installPluginVersion`** gains a `carrySettings` option that computes the
  reconciled `settingsJson` from the previously-installed version's edge and sets
  it on the new edge (instead of `null`), returning a `carryOverReport`.
- **Upgrade preview (frontend):** show carried / new-default / dropped / reset,
  plus, per required secret, "already set ✓" vs "needs setting" (secrets persist
  by (pluginId, key)). Offer **[Carry over]** vs **[Start fresh]**, optionally
  with per-field edit before confirming.
- **Renamed keys (optional):** let the manifest declare `renamedFrom` on a
  setting or secret so intentional renames carry over; only where the *meaning*
  is unchanged (a rename that also changes semantics should stay flagged-as-new).

---

## Implementation surface

**Backend (`gennit-backend`)**
- Config-status resolver (per-version, per-field; secrets as booleans).
- Make the resolver scope-aware (`server` first; extendable to `channel`
  without conflating the two settings surfaces).
- `enableServerPlugin`: validate required settings (not just secrets); structured error.
- `installPluginVersion`: `carrySettings` option + scope-aware
  `reconcileSettings()` (pure, unit-tested) + `carryOverReport`.
- Optional: honor manifest `renamedFrom` for settings + secrets; manifest lint.

**Frontend (`multiforum-nuxt`)**
- `pages/admin/settings/plugins/[pluginId].vue` + `PluginSecretsSection.vue` +
  the settings-form renderer: dedupe, kind-aware rendering, green-✓ set
  indicators, orphaned-secret section, Enable-gate checklist, upgrade-preview
  modal.

**Plugin manifests**
- Convention: declare each secret once (in `secrets[]`); keep `ui.forms` for
  non-secret settings. (`security-attachment-scan` currently double-declares
  `SCAN_SERVICE_API_KEY` — fix in a manifest-only patch.)
- Optional `renamedFrom` support.

## Suggested rollout order

1. **Config-status model** (foundation).
2. **Enable-gating + green-✓ indicators + rendering dedupe** (highest
   immediate value; independent of carry-over). Ship the plugin manifest dedupe
   alongside.
3. **Orphaned-secret handling.**
4. **Carry-over on upgrade** (reconcile + preview).

## Open decisions

1. **Enable gate:** hard block vs dismissible warning? (Recommend **hard block**,
   at least for plugins with required config — a misconfigured fail-closed plugin
   is worse than not-enabled.)
2. **Secret placement:** allow `ui.forms` to *position* a single secret input
   in-place, or keep all secrets in their own section? (Recommend the simple rule
   — secrets always in their own section — unless there's demand.)
3. **`SET_UNTESTED` semantics:** does untested-but-present secret status count
   as enable-able, or must validation succeed first? (Recommend preserving
   today's permissive behavior unless the plugin exposes a reliable preflight
   validation step; otherwise we risk blocking legitimate plugins that cannot
   prove validity until runtime.)
4. **Carry-over default:** default to carry-over-with-preview, or opt-in each
   upgrade? (Recommend default-on with preview + a "start fresh" escape.)
5. **Renamed secrets:** support manifest `renamedFrom` to re-point a
   `ServerSecret`, or always treat a renamed secret as new? (Values are
   write-only, so auto-migration only re-points the record; recommend supporting
   it but only when meaning is unchanged.)

## Related

- Download-scan **enforcement + creator UX** design: `docs/download-scan-enforcement-design.md`.
- Plugin `security-attachment-scan` fail-closed fix: [multiforum-plugin-security-attachment-scan#2] (`v0.4.0`).
