# Frontend runtime configuration

Multiforum's frontend accepts deployment-specific settings when its Node
server starts. A single built image can therefore be promoted between
environments without rebuilding browser assets for each hostname, instance
name, authentication provider, or optional integration.

`VITE_*` variables remain supported as build-time defaults for existing local
and Vercel workflows. Container deployments should prefer the runtime
variables below.

| Runtime variable | Purpose |
| --- | --- |
| `NUXT_PUBLIC_BASE_URL` | Public frontend origin used in links and metadata |
| `NUXT_PUBLIC_ENVIRONMENT` | Deployment label such as `development`, `staging`, or `production` |
| `NUXT_PUBLIC_SERVER_NAME` | Backend `ServerConfig` identifier |
| `NUXT_PUBLIC_SERVER_DISPLAY_NAME` | Human-facing instance name |
| `NUXT_PUBLIC_AUTH_PROVIDER` | `local-dev` or `auth0` |
| `NUXT_BACKEND_GRAPHQL_URL` | Server-side GraphQL endpoint on the private container network |
| `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional Google Maps browser key |
| `NUXT_PUBLIC_GOOGLE_MAP_ID` | Optional Google Maps map ID |
| `NUXT_PUBLIC_OPEN_CAGE_API_KEY` | Optional OpenCage geocoding key |
| `NUXT_PUBLIC_GOOGLE_CLOUD_STORAGE_BUCKET` | Optional public storage bucket name |
| `NUXT_PUBLIC_OPEN_GRAPH_API_KEY` | Optional link-preview API key |
| `NUXT_PUBLIC_LOGOUT_URL` | Optional post-logout destination |
| `NUXT_PUBLIC_ENABLE_LANGUAGE_PICKER` | Set to `true` to show language selection |

Nuxt exposes every `NUXT_PUBLIC_*` value to the browser. Do not put secrets in
these variables. Auth0 client secrets and session secrets belong in the
server-only `NUXT_AUTH0_*` variables demonstrated by
[`.env.production.example`](../.env.production.example).

The image contains inert Auth0 placeholders solely because the Auth0 module
validates its shape even in `local-dev` mode. Selecting `auth0` without real
`NUXT_AUTH0_DOMAIN`, `NUXT_AUTH0_CLIENT_ID`, `NUXT_AUTH0_CLIENT_SECRET`, and
`NUXT_AUTH0_SESSION_SECRET` values stops the server with a clear configuration
error; the placeholders can never enable an Auth0 session.

Runtime configuration is read before application components and integration
plugins initialize. Setting an optional integration value to an empty string
explicitly disables its build-time fallback.

Browser GraphQL requests use the frontend's same-origin `/api/graphql` route.
The Node server proxies that route to `NUXT_BACKEND_GRAPHQL_URL`, so changing a
backend hostname or container network does not require rebuilding browser
assets and does not require exposing the backend directly to browsers.
