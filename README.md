![Multiforum Logo](./docs/multiforum-header.png)

[![codecov](https://codecov.io/gh/gennit-project/multiforum-nuxt/branch/main/graph/badge.svg)](https://codecov.io/gh/gennit-project/multiforum-nuxt)

> Multiforum is under active development; test coverage is being expanded as core features stabilize.

## About

Multiforum is a community platform that lets people create and manage topic-based forums with multiple content types:

- Discussions — upvotable posts with threaded comments
- Events — with calendar views and map-based discovery
- Wikis — collaborative docs with revision history
- Downloads — file sharing with custom filters per forum

Key differentiators:

- Cross-posting lets content be shared across multiple forums
- Map integration for location-based event discovery
- Personal libraries for organizing favorites and collections
- Granular moderation at both channel and server levels

## How it fits together

Multiforum is split across two repositories:

- **This repository** — the Vue/Nuxt frontend (and its Nitro server layer for SSR and auth).
- **[gennit-project/multiforum-backend](https://github.com/gennit-project/multiforum-backend)** — the GraphQL API and Neo4j data layer.

The frontend talks to the backend exclusively through GraphQL.

> **Backend architecture:** the data model, GraphQL schema, and resolver design
> are documented in depth in the backend's
> [architecture overview](https://github.com/gennit-project/multiforum-backend/blob/main/docs/architecture.md)
> and the references linked from it. This README and the
> [frontend architecture doc](./docs/architecture-and-auth.md) cover the frontend
> and the cross-tier auth flow; for anything about how data is stored, related,
> and queried, start with the backend docs.

## Technology choices — and why

These are the main technologies and, more importantly, *why* they fit a
cross-posting, deeply-interconnected community platform. If you have never used
them, the short version of each explains what problem it solves here.

### Nuxt (server-side-rendered Vue)

Nuxt is a framework on top of [Vue](https://vuejs.org/) that adds
**server-side rendering (SSR)** — the first version of a page is built on the
server and sent as ready-to-read HTML, then "hydrated" into a live app in the
browser. That matters here for three reasons:

- **Discoverability/SEO.** Forum posts, events, and wikis are public content
  people share and search for. SSR means crawlers and link previews see the
  real content, not an empty shell waiting for JavaScript.
- **Fast first paint.** Users see content immediately instead of a spinner,
  which matters on a content-heavy, link-driven site.
- **Hydration-safe auth.** SSR lets us render the correct logged-in/logged-out
  UI on the server using lightweight auth-hint cookies, avoiding the "flash of
  wrong UI" that plagues purely client-side auth. (See
  [Architecture and authentication](./docs/architecture-and-auth.md).)

Nuxt's file-based routing also maps cleanly onto the many nested routes a forum
app needs (`/forums/[forumId]/discussions/[discussionId]`, etc.).

### Neo4j (graph database, in the backend)

Multiforum's data is fundamentally a **graph**, not a stack of independent
tables. A single discussion can be cross-posted into many forums; comments nest
arbitrarily deep; users connect to forums through roles; moderation issues link
content, actions, and suspensions together. In a relational database, "show me
every forum this download appears in" or "walk this comment thread" turns into a
pile of join tables and recursive queries.

[Neo4j](https://neo4j.com/) stores data as nodes and relationships directly, so
those traversals — *follow the edges between connected things* — are natural and
efficient. The shape of the database mirrors the shape of the product.

### GraphQL + Apollo Client

Because the data is a graph, the API is too. [GraphQL](https://graphql.org/)
lets the frontend ask for exactly the connected data a screen needs — a
discussion *with* its channels, author, and comment counts — in a single
request shaped like the result. [Apollo Client](https://www.apollographql.com/docs/react/)
adds a normalized cache so repeated views of the same entity stay consistent and
fast without manual bookkeeping.

### Auth0

[Auth0](https://auth0.com/) is a managed authentication provider. Rather than
building and securing our own login, password reset, and social/single-sign-on
flows, we delegate that to Auth0 and focus on the product. It pairs with the
SSR auth-hint strategy above to keep login state correct across server and
client.

### Supporting libraries

- **Pinia** — small, typed store for UI state that several components share
  (theme, modals, navigation) without prop-drilling.
- **Tailwind CSS** — utility-first styling with first-class dark-mode support,
  which keeps the large component library visually consistent.
- **Google Maps** — powers location-based event discovery and clustering.
- **Vitest + Vue Test Utils** for unit tests and **Playwright** (with mocked
  GraphQL) for end-to-end flows — fast feedback locally and in CI.

## Developer docs

Start here:

- [Development setup](./docs/development-setup.md)
- [Contributing guide](./CONTRIBUTING.md)
- [Developer workflow and standards](./CLAUDE.md)

Architecture:

- [Frontend architecture and authentication](./docs/architecture-and-auth.md)
- [Moderation architecture](./docs/moderation-architecture.md)
- [Performance](./docs/PERFORMANCE.md)
- **Backend architecture:** see the [backend architecture overview](https://github.com/gennit-project/multiforum-backend/blob/main/docs/architecture.md)

Feature areas and plans:

- [Feature roadmap](./docs/FEATURE_ROADMAP.md)
- [Moderation plan](./docs/MODERATION_PLAN.md)
- [Notifications plan](./docs/NOTIFICATIONS_PLAN.md)
- [Plugins: implemented](./docs/PLUGINS_IMPLEMENTED.md) · [roadmap](./docs/PLUGINS_ROADMAP.md) · [implementation plan](./docs/PLUGINS_IMPLEMENTATION_PLAN.md) · [bot/betabot plan](./docs/PLUGINS_BOT_BETABOT_PLAN.md)
- [Maps: developer docs](./docs/MAP_DEVELOPER_DOCS.md) · [clustering guide](./docs/MAP_CLUSTERING_GUIDE.md)
- [Automated test plan](./docs/AUTOMATED_TEST_PLAN.md)

Hosted documentation: [docs.multiforum.net](https://docs.multiforum.net).

## Screenshots

- [Screenshots gallery](./docs/screenshots.md)
- [Feature updates (2025)](./docs/feature-updates.md)

## Status

This project is in active development.
