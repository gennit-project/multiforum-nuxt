# Plugin system roadmap

The core plugin platform, server and channel pipelines, public pipeline
history, quarantine workflow, recovery, and declarative configuration are
shipped. See [Plugin system: implemented behavior](./plugins-implemented.md).

This file lists only work that has not shipped. It should not be used as a
description of current product behavior.

## Auto-labeler plugin

Channel pipelines already receive channel context and filter-group metadata on
`discussionChannel.created`. The remaining product work is to turn the
auto-labeler experiment into a supported plugin:

- define and version the plugin output contract for proposed labels and
  confidence;
- validate returned labels against the channel's current filter taxonomy;
- apply accepted labels idempotently and record an auditable result;
- add public diagnostics for suggestions that cannot be applied;
- publish the plugin as an independently versioned registry artifact;
- add end-to-end coverage for taxonomy changes and retries.

Until those items are implemented and released, documentation must not imply
that Multiforum automatically applies channel download labels.

## Bot experiments

Bot-specific exploration remains in
[plugins-bot-betabot-plan.md](./plugins-bot-betabot-plan.md). That document is a
design plan, not a list of shipped plugins.

## Documentation rule

New plugin features should update the maintained current-state reference and
the role-based public guide in the same change. Completed phase plans should be
reduced to historical pointers or moved to `docs/archive/` so they cannot be
mistaken for the product contract.
