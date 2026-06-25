import type { CreateEditDiscussionFormValues } from '@/types/Discussion';

/**
 * Pure helpers for the download edit page (downloads are discussions with
 * hasDownload). The base field mapping is shared with the discussion edit page
 * (utils/discussionEditForm); these cover the download-specific extras —
 * grouping the channel's selected label options and mapping the downloadable
 * files into the form shape.
 */

type LabelOption = { value: string; group?: { key?: string | null } | null };

type LabelDiscussionChannel = {
  Channel?: { uniqueName?: string | null } | null;
  LabelOptions?: LabelOption[] | null;
};

/**
 * Group the primary channel's selected label options by their filter-group key
 * (filterGroupKey -> selected option values).
 */
export function extractDownloadLabels(params: {
  discussionChannels: LabelDiscussionChannel[] | null | undefined;
  channelUniqueName: string;
}): Record<string, string[]> {
  const { discussionChannels, channelUniqueName } = params;
  const labels: Record<string, string[]> = {};

  const primaryChannel = (discussionChannels ?? []).find(
    (dc) => dc.Channel?.uniqueName === channelUniqueName
  );

  for (const option of primaryChannel?.LabelOptions ?? []) {
    const groupKey = option.group?.key;
    if (groupKey) {
      (labels[groupKey] ??= []).push(option.value);
    }
  }

  return labels;
}

type DownloadFileSource = {
  id?: string | null;
  fileName?: string | null;
  url?: string | null;
  kind?: string | null;
  size?: number | null;
  license?: { id?: string | null } | null;
  priceModel?: string | null;
  priceCents?: number | null;
  priceCurrency?: string | null;
};

type DownloadableFormFile = NonNullable<
  CreateEditDiscussionFormValues['downloadableFiles']
>[number];

/** Map the discussion's downloadable files into the form's file shape. */
export function mapDownloadableFiles(
  files: DownloadFileSource[] | null | undefined
): DownloadableFormFile[] {
  return (files ?? []).map((file) => ({
    id: file.id || '',
    fileName: file.fileName || '',
    url: file.url || '',
    kind: file.kind || 'OTHER',
    size: file.size || 0,
    license: file.license?.id || '',
    priceModel: file.priceModel || 'FREE',
    priceCents: file.priceCents || 0,
    priceCurrency: file.priceCurrency || 'USD',
  }));
}
