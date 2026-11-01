import type {
  WriteWikiPageMutationVariables,
  GetChannelQueryVariables,
  GetSiteWideWikiListQueryVariables,
} from '@/__generated__/operations';
interface WikiCreateFields {
  title: string;
  body: string;
  editReason: string;
  slug: string;
}
interface WikiEditFields {
  title: string;
  body: string;
  editReason: string;
}
// Authors and relationship writes belong to the authenticated backend contract.
export const createWikiHomeVariables = (
  form: WikiCreateFields,
  channelUniqueName: string
): WriteWikiPageMutationVariables => ({
  input: {
    title: form.title,
    body: form.body,
    editReason: form.editReason || null,
    slug: form.slug,
    channelUniqueName,
    setAsHome: true,
  },
});
export const createWikiChildVariables = (
  form: WikiCreateFields,
  channelUniqueName: string,
  parentId: string
): WriteWikiPageMutationVariables => ({
  input: {
    title: form.title,
    body: form.body,
    editReason: form.editReason || null,
    slug: form.slug,
    channelUniqueName,
    parentId,
  },
});
export const updateWikiPageVariables = (
  form: WikiEditFields,
  channelUniqueName: string,
  id: string
): WriteWikiPageMutationVariables => ({
  input: {
    title: form.title,
    body: form.body,
    editReason: form.editReason || null,
    channelUniqueName,
    id,
  },
});

export const wikiWriteChannelVariables = (
  uniqueName: string
): GetChannelQueryVariables => ({ uniqueName });
export const wikiWriteListVariables = (
  channel: string
): GetSiteWideWikiListQueryVariables => ({
  searchInput: '',
  selectedChannels: [channel],
  options: { limit: 100, offset: 0 },
});
