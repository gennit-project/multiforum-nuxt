import { useMutation, useQuery } from '@vue/apollo-composable';
import {
  GetWikiPageDocument,
  WriteWikiPageDocument,
} from '@/__generated__/operations';
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
export function checkWikiWriteContract() {
  const mutation = useMutation(WriteWikiPageDocument);
  mutation.mutate({
    input: {
      channelUniqueName: 'cats',
      id: 'selected-id',
      title: 'New',
      body: null,
    },
  });
  mutation.mutate({
    input: {
      channelUniqueName: 'cats',
      title: 'New',
      // @ts-expect-error author is owned by authenticated server context
      VersionAuthor: {},
    },
  });
  // @ts-expect-error route arrays must be narrowed
  mutation.mutate({ input: { channelUniqueName: ['cats'], title: 'New' } });
  // @ts-expect-error title remains required
  mutation.mutate({ input: { channelUniqueName: 'cats' } });
  mutation.onDone(({ data }) => {
    // @ts-expect-error unselected fields cannot be consumed
    void data?.writeWikiPage.Channel;
    // @ts-expect-error body remains nullable
    const body: string = data!.writeWikiPage.body;
    void body;
  });
  return mutation;
}
