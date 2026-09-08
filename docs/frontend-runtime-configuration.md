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
| `NUXT_PUBLIC_BRANDING_PRODUCT_NAME` | Product name in the footer attribution (default `Multiforum`) |
| `NUXT_PUBLIC_BRANDING_DOCS_URL` | Documentation link target |
| `NUXT_PUBLIC_BRANDING_SOURCE_URL` | Source repository link target |
| `NUXT_PUBLIC_BRANDING_ISSUES_URL` | Upstream bug tracker offered in the footer |
| `NUXT_PUBLIC_BRANDING_SUPPORT_EMAIL` | Contact address for instance support (unset by default) |
| `NUXT_PUBLIC_BRANDING_SHOW_UPSTREAM_LINKS` | Set to `false` to hide all upstream references |
| `NUXT_PUBLIC_BRANDING_CUSTOM_FOOTER_LINKS` | JSON array of `{"label","url"}` footer links |

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


## Instance branding

The footer's documentation, source, issue-tracker and support links are
configurable, so a deployment can point users at its own documentation and
support address instead of the upstream project's. Values resolve through
ordered layers, lowest precedence first:

```
upstream defaults  ->  NUXT_PUBLIC_BRANDING_*  ->  (planned) admin ServerConfig
```

`NUXT_PUBLIC_BRANDING_SHOW_UPSTREAM_LINKS=false` removes the "Powered by",
documentation, source and upstream issue-tracker links in one setting, for
deployments that present the software under their own name. The support email
is independent of that flag and still renders.

No support address is configured by default, so an instance that never sets one
omits the address rather than directing its users to the upstream maintainers.
Set `NUXT_PUBLIC_BRANDING_SUPPORT_EMAIL` to this deployment's own address.

Per-field value rules, applied by `utils/branding.ts`:

- An explicit empty string disables that field — `NUXT_PUBLIC_BRANDING_DOCS_URL=`
  removes the documentation link, matching the opt-out behavior of the other
  optional runtime values above.
- A malformed value falls back to the layer below rather than rendering. Only
  `http(s)` URLs and site-relative paths are accepted, so a `javascript:` or
  `data:` URL can never reach the page, and a malformed address in
  `NUXT_PUBLIC_BRANDING_SUPPORT_EMAIL` keeps the previous address rather than
  producing a broken `mailto:` link.
- `NUXT_PUBLIC_BRANDING_CUSTOM_FOOTER_LINKS` takes a JSON array, for example
  `[{"label":"Community Handbook","url":"/handbook"}]`. Entries missing a label
  or carrying an unsafe URL are dropped individually; the list is capped at
  eight links. Off-site links open in a new tab.

`VITE_BRANDING_*` equivalents remain available as build-time defaults for local
development and Vercel deployments.
