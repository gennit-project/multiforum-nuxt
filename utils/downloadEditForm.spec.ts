import { describe, it, expect } from 'vitest';
import { extractDownloadLabels, mapDownloadableFiles } from './downloadEditForm';

describe('extractDownloadLabels', () => {
  it('groups the primary channel label options by group key', () => {
    const labels = extractDownloadLabels({
      channelUniqueName: 'cats',
      discussionChannels: [
        {
          Channel: { uniqueName: 'cats' },
          LabelOptions: [
            { value: 'pdf', group: { key: 'format' } },
            { value: 'zip', group: { key: 'format' } },
            { value: 'free', group: { key: 'price' } },
          ],
        },
      ],
    });
    expect(labels).toEqual({ format: ['pdf', 'zip'], price: ['free'] });
  });

  it('only reads the channel matching the current forum', () => {
    const labels = extractDownloadLabels({
      channelUniqueName: 'cats',
      discussionChannels: [
        {
          Channel: { uniqueName: 'dogs' },
          LabelOptions: [{ value: 'pdf', group: { key: 'format' } }],
        },
      ],
    });
    expect(labels).toEqual({});
  });

  it('ignores options without a group key', () => {
    const labels = extractDownloadLabels({
      channelUniqueName: 'cats',
      discussionChannels: [
        {
          Channel: { uniqueName: 'cats' },
          LabelOptions: [{ value: 'orphan', group: null }],
        },
      ],
    });
    expect(labels).toEqual({});
  });

  it('returns an empty object when there are no channels', () => {
    expect(
      extractDownloadLabels({ channelUniqueName: 'cats', discussionChannels: [] })
    ).toEqual({});
  });
});

describe('mapDownloadableFiles', () => {
  it('maps a file to the form shape', () => {
    const [file] = mapDownloadableFiles([
      {
        id: 'f1',
        fileName: 'model.stl',
        url: 'u',
        kind: 'STL',
        size: 100,
        license: { id: 'cc' },
        priceModel: 'PAID',
        priceCents: 500,
        priceCurrency: 'EUR',
      },
    ]);
    expect(file).toEqual({
      id: 'f1',
      fileName: 'model.stl',
      url: 'u',
      kind: 'STL',
      size: 100,
      license: 'cc',
      priceModel: 'PAID',
      priceCents: 500,
      priceCurrency: 'EUR',
    });
  });

  it('applies defaults for missing fields', () => {
    const [file] = mapDownloadableFiles([{ fileName: 'x' }]);
    expect(file).toMatchObject({
      id: '',
      kind: 'OTHER',
      size: 0,
      license: '',
      priceModel: 'FREE',
      priceCents: 0,
      priceCurrency: 'USD',
    });
  });

  it('returns an empty array for no files', () => {
    expect(mapDownloadableFiles(null)).toEqual([]);
  });
});
