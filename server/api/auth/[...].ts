import { NuxtAuthHandler } from '#auth'
import Auth0Provider from 'next-auth/providers/auth0'
import { useRuntimeConfig } from '#imports'

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,

  providers: [
    // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
    Auth0Provider.default({
      clientId: useRuntimeConfig().auth0.clientId,
      clientSecret: useRuntimeConfig().auth0.clientSecret,
      domain: useRuntimeConfig().auth0.domain,
    })
  ]
})