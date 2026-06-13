// Apollo Client cache typing helpers

import type { ApolloCache, NormalizedCacheObject } from '@apollo/client';
import type { ApolloError } from '@apollo/client/errors';
import type { Ref } from 'vue';

/**
 * Type alias for the Apollo cache used in this application
 */
export type AppCache = ApolloCache<NormalizedCacheObject>;

/**
 * Type for Apollo cache update functions
 */
export type CacheUpdateFn<T = unknown> = (
  cache: AppCache,
  result: { data?: T }
) => void;

/**
 * Type for GraphQL error refs
 */
export type GraphQLErrorRef = Ref<ApolloError | null>;

/**
 * Type for issues aggregate query results
 */
export interface IssuesAggregateResult {
  issuesAggregate?: {
    count: number;
  };
}

/**
 * Type for channel issues query results
 */
export interface ChannelIssuesResult {
  channels?: Array<{
    Issues: Array<{ id: string }>;
    [key: string]: unknown;
  }>;
}
