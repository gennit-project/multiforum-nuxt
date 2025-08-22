declare global {
  interface GlobalThis {
    __auth0_getToken?: (opts?: Record<string, unknown>) => Promise<string>;
  }
}
