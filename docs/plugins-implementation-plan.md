# Plugin system implementation plan

Status: completed. This file is retained as a pointer for links to the original
implementation plan; it is no longer the source of truth for product behavior.

The implemented system now includes:

- server and channel plugin installation, configuration, secrets, and version
  management;
- explicit server and channel event pipelines;
- public download pipeline history, diagnostics, manual starts, and retries;
- download quarantine, human review, rollout policies, and backfill campaigns;
- execution leases, heartbeats, and watchdog recovery;
- declarative plugin configuration with plan/apply reconciliation.

See [Plugin system: implemented behavior](./plugins-implemented.md) for the
maintained engineering reference. User-facing behavior and operating
procedures live in the public Multiforum documentation under **Plugin
pipelines**, **Security attachment scanning**, and **Declarative plugin
configuration**.

Unshipped ideas belong in [the plugin roadmap](./plugins-roadmap.md), not in
this completed plan.
