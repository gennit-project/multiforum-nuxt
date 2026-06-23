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

It's built with Nuxt/Vue on the frontend and a GraphQL/Neo4j backend. The
backend lives in a separate repository:
[gennit-project/multiforum-backend](https://github.com/gennit-project/multiforum-backend).

## Docs

Documentation is hosted at [docs.multiforum.net](https://docs.multiforum.net).

## Developer Docs

- [Development setup](./docs/development-setup.md)
- [Architecture and authentication](./docs/architecture-and-auth.md)
- [Moderation architecture](./docs/moderation-architecture.md)
- [Contributing guide](./CONTRIBUTING.md)
- [Performance details](./PERFORMANCE.md)
- [Developer workflow and standards](./CLAUDE.md)

## Technology Summary

- **Frontend**: Vue/Nuxt + Apollo Client
- **Backend**: Apollo Server + Neo4j
- **Authentication**: Auth0 + SSR auth hint cookies
- **Maps**: Google Maps

## Screenshots

- [Screenshots gallery](./docs/screenshots.md)
- [Feature updates (2025)](./docs/feature-updates.md)

## Status

This project is in active development.

```

```
