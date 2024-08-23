
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { provideApolloClient } from '@vue/apollo-composable'

export default defineNuxtPlugin(nuxtApp => {
  const httpLink = new HttpLink({ uri: nuxtApp.$config.public.graphqlUrl })

  const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem('token')
    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : ''
      }
    })
    return forward(operation)
  })

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) console.error(`[GraphQL error]: ${graphQLErrors}`)
    if (networkError) console.error(`[Network error]: ${networkError}`)
  })

  const apolloClient = new ApolloClient({
    link: ApolloLink.from([authLink, errorLink, httpLink]),
    cache: new InMemoryCache(),
  })

  provideApolloClient(apolloClient)
})
