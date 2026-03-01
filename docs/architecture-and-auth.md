# Architecture and Authentication

## Technology Stack

The backend ([multiforum-backend](https://github.com/gennit-project/multiforum-backend)) uses Apollo Server with Neo4j.

- Some resolvers are auto-generated via the [Neo4j GraphQL library](https://neo4j.com/docs/graphql/current/)
- More complex resolvers use a combination of [OGM](https://neo4j.com/docs/graphql/current/ogm/) and custom Cypher

The frontend is a Vue/Nuxt application that queries the backend through GraphQL.

## Authentication System

Multiforum uses a hybrid authentication model:
- Auth0 for secure authentication
- SSR-compatible auth hints to avoid hydration mismatch and auth UI flashing

### SSR Auth State Management

The app uses a two-layer auth strategy:

1. Auth hint cookies (SSR-compatible)
- Non-sensitive cookies indicate logged-in state
- Available during SSR to render the correct auth UI immediately

2. Secure auth tokens (client-side)
- JWT tokens in localStorage
- Used for authenticated API calls and full auth state

### End-to-End Auth Flow

1. Login flow
- User authenticates with Auth0
- Auth hint cookie is set
- Auth token is stored in localStorage
- User data is fetched and cached

2. SSR rendering
- Server reads auth hint cookies
- Server renders correct auth-aware UI
- Client hydrates with matching state

3. Client-side operation
- App reads localStorage auth tokens
- Performs authenticated GraphQL requests
- Maintains reactive auth state

4. Logout flow
- Auth hint cookies are cleared
- localStorage tokens are removed
- User is redirected

### Key Components

- `useSSRAuth` composable: auth hint cookies and SSR auth state
- `useAuthManager` composable: secure tokens and user data
- `RequireAuth` component: auth-aware conditional rendering
- Auth hint cookies: `isLoggedIn`, `username`, `modProfileName`

### Implementation Requirements

- Keep auth hint cookies synchronized on every auth state change
- SSR logic must rely on cookies (not localStorage)
- Client logic can use both cookies and localStorage
- Keep login/logout and user-fetch auth updates consistent

### Testing and Debugging

Testing focus:
- Validate auth behavior in SSR mode
- Test fallback behavior with cleared cookies
- Verify no hydration mismatch

Common issues:
- UI flash: cookie and auth token state are out of sync
- Hydration errors: server/client initial auth state differs
- Missing auth UI: missing cookie or token

### Benefits

- No auth-state flash
- Better SEO rendering behavior
- Faster perceived load for auth-aware UI
- Secure token handling for sensitive auth data
- More reliable behavior around token edge cases

## Performance

Performance optimizations are documented in [PERFORMANCE.md](../PERFORMANCE.md), including:
- Code splitting and lazy loading
- Compression and caching
- JS/CSS minification
- Image optimization
- Server response time improvements
