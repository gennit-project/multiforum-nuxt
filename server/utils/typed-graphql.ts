import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export type GraphqlResponse<Result> = {
  data?: Result | null;
  errors?: readonly { message: string }[];
};

// Match Apollo's selected-result contract at the authored server HTTP boundary.
// Transport failure handling remains with each caller's session fallback.
export function requestGraphql<
  Result,
  Variables extends Record<string, unknown>,
>(
  url: string,
  document: TypedDocumentNode<Result, Variables>,
  variables: NoInfer<Variables>,
  options: { headers?: Record<string, string> } = {}
): Promise<GraphqlResponse<Result>> {
  return $fetch<GraphqlResponse<Result>>(url, {
    method: 'POST',
    headers: options.headers,
    body: { query: print(document), variables },
  });
}
