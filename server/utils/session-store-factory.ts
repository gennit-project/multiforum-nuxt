// server/utils/session-store-factory.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 2 fix.
//
// By default @auth0/auth0-nuxt uses a STATELESS state store: the entire session
// (id + access + refresh tokens + user claims) is encrypted into the session
// COOKIE. Once "Allow Offline Access" is enabled, a refresh token is added and
// the cookie exceeds the browser's ~4KB limit, so the browser drops it and
// getSession() returns nothing. Switching to a server-side SessionStore keeps
// only a small session id in the cookie and stores the tokens server-side.
//
// The 'auth0Sessions' storage mount is configured in nuxt.config (nitro):
// Upstash Redis in production (a shared, persistent store across serverless
// function instances) and a filesystem driver in local dev (nitro.devStorage).
// Both survive restarts. With in-memory storage, every restart orphaned the
// browser's session cookie (its id no longer in the store), which the SDK then
// deleted on the resulting store miss, silently logging the user out — a shared
// persistent store avoids that cascade. This store implementation is driver-
// agnostic: it only talks to the unstorage interface, so the driver can change
// without touching this file.
import type {
  SessionStore,
  StateData,
  StoreOptions,
} from '@auth0/auth0-nuxt';
import type { Storage } from 'unstorage';

class NitroSessionStore implements SessionStore {
  readonly #store: Storage<StateData>;

  constructor(store: Storage<StateData>) {
    this.#store = store;
  }

  async get(identifier: string): Promise<StateData | undefined> {
    return (await this.#store.getItem<StateData>(identifier)) ?? undefined;
  }

  async set(identifier: string, stateData: StateData): Promise<void> {
    await this.#store.setItem(identifier, stateData);
  }

  async delete(identifier: string): Promise<void> {
    await this.#store.removeItem(identifier);
  }

  async deleteByLogoutToken(
    claims: unknown,
    _options?: StoreOptions
  ): Promise<void> {
    // Back-channel logout: best-effort. With a key/value store and no index of
    // session-id -> sub/sid we can't target the exact entry, so this is a no-op
    // for the spike. (A persistent store would key sessions by sub/sid to honor
    // back-channel logout.)
    if (import.meta.dev) {
      console.log('[auth-session-store] deleteByLogoutToken (no-op):', claims);
    }
  }
}

export default function getSessionStoreInstance() {
  const storage = useStorage<StateData>('auth0Sessions');
  return new NitroSessionStore(storage);
}
