import { useMutation, useQuery  } from '@vue/apollo-composable';
import type { CreateWikiPageMutation } from '@/__generated__/operations';
import { CREATE_WIKI_PAGE } from '@/graphQLData/channel/mutations';
import { legacyCreateWikiHomeVariables } from '@/utils/legacyWikiWrites';
import { GetWikiPageDocument } from '@/__generated__/operations';
import type {
  ChannelUpdateInput,
  WikiPageUpdateInput,
  WikiPageVersionAuthorFieldInput,
} from '@/__generated__/graphql';
export function checkWikiSelections() {
  const page = useQuery(GetWikiPageDocument, {
    channelUniqueName: 'cats',
    slug: 'intro',
  });
  // @ts-expect-error route arrays must be narrowed
  page.refetch({ channelUniqueName: ['cats'], slug: 'intro' });
  // @ts-expect-error channel identity is not selected by this operation
  void page.result.value?.wikiPages[0]?.channelUniqueName;
  // @ts-expect-error body is nullable
  const body: string = page.result.value!.wikiPages[0]!.body;
  return { page, body };
}
// These guards document the exact backend #413 blockers for legacy wiki writes.
export const missingHomeInput: ChannelUpdateInput = {
  // @ts-expect-error pinned schema omits the existing home-page write relationship
  WikiHomePage: {},
};
export const missingAuthorUpdate: WikiPageUpdateInput = {
  // @ts-expect-error pinned schema omits author attribution on update
  VersionAuthor: {},
};
export const missingAuthorConnect: WikiPageVersionAuthorFieldInput = {
  // @ts-expect-error pinned schema exposes create but not existing-author connect
  connect: {},
};

// Raw documents are restricted to inferred legacy payloads and generated results.
export function checkLegacyWikiWriteContracts() {
  const mutation = useMutation<
    CreateWikiPageMutation,
    ReturnType<typeof legacyCreateWikiHomeVariables>
  >(CREATE_WIKI_PAGE);
  legacyCreateWikiHomeVariables(
    { title: '', body: '', editReason: '', slug: '' },
    // @ts-expect-error the legacy payload still requires a scalar forum ID
    ['cats'],
    'alice'
  );
  // @ts-expect-error no arbitrary input keys at the raw document boundary
  mutation.mutate({ unknownInput: true });
  mutation.onDone(({ data }) => {
    // @ts-expect-error generated result has no arbitrary mutation fields
    void data?.unknownResult;
  });
  return mutation;
}
