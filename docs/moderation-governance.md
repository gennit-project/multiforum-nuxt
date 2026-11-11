# Moderation rule governance

Frontend issue: https://github.com/gennit-project/multiforum-nuxt/issues/720
Backend issue: https://github.com/gennit-project/multiforum-backend/issues/433

The moderation plugin has two independent rule scopes:

- Server admins select `serverRuleEnforcement: on | off`. `on` applies server
  rules in every forum while the server plugin is enabled. Forum owners cannot
  change this scope.
- Server admins select `channelRuleEligibility: all | none | allowlist`, with
  `channelRuleAllowlist` containing forum unique names. An empty allowlist permits
  no forums.
- Eligible owners explicitly opt into checks against their own forum's rules.
  An owner's saved opt-in is inactive while the server policy disallows it.
- An ineligible owner can request access under `allowlist` policy. The request is
  a server issue (`channelUniqueName: null`) with a related forum and plugin slug.
  Admin approval adds eligibility and closes the request. It never opts in for
  the owner.

## Version and migration boundary

These controls require moderation plugin **0.8.0 or later** and the companion
backend governance APIs. Older installations show an upgrade message instead
of sending settings their runtime cannot interpret. Plugin database IDs remain
in routes; governance APIs receive the canonical `llm-moderation` slug.

A legacy `serverRuleCheckMode: allowlist` means server rules were checked only
in selected forums. It is **not** equivalent to the new channel eligibility
allowlist. Preserve the legacy scope through a carried-settings upgrade, then
ask the admin to explicitly choose global On or Off. The UI does not choose that
migration automatically and does not copy `serverRuleForumAllowlist` into
`channelRuleAllowlist`. Flat settings override legacy nested `server` settings.

The backend is authoritative for permission, current eligibility, deduplicating
requests and opt-in state. Approval uses the backend-resolved `canManagePlugins`
capability, including root, tier-role and suspension rules; membership in the
public Admins list is not sufficient. Capability lookup failures hide approval.
The frontend does not use generated channel-plugin connect/update mutations for
the governed plugin. It also resolves the newest server-enabled installation
rather than depending on query ordering.

## Coordinated release

1. Publish the reviewed backend containing the new schema, governance permission
   checks and runtime scope enforcement.
2. Publish the reviewed moderation plugin 0.8.0 artifact and registry entry.
3. Release this frontend against its reviewed pinned backend schema.
4. Upgrade the installed moderation plugin, review carried settings, explicitly
   resolve any legacy server-rule allowlist, and save the desired policy.

These are release prerequisites, not actions performed by this change. Do not
merge or deploy a partial slice without reviewing the mixed-version behavior.

## Verification

- `pnpm schema:check`, `pnpm compile`, `pnpm graphql:check`,
  `pnpm operations:check`, `pnpm operations:contract:check`, `pnpm tsc`.
- Unit coverage in `pluginGovernance`, `ChannelRuleGovernance`,
  `ChannelRuleApproval`, upgrade preview and server issue navigation tests.
- Mocked Playwright: `channels/channelRuleGovernance.spec.ts`,
  `issues/channelRuleApproval.spec.ts`, and the moderation-governance cases in
  `admin/pluginDetail.spec.ts`.

Mocked browser tests verify UI and request contracts, not live persistence or
plugin execution; companion backend/plugin integration tests own those layers.
