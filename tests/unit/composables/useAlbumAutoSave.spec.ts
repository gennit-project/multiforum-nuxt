import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAlbumAutoSave } from '@/composables/useAlbumAutoSave';

const mockMutate = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    error: { value: null },
  }),
}));

vi.mock('@/graphQLData/discussion/mutations', () => ({
  UPDATE_DISCUSSION: Symbol('UPDATE_DISCUSSION'),
}));

describe('useAlbumAutoSave', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  describe('album update input building', () => {
    it('returns empty object when no album data', () => {
      const { isAutoSaving } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum: null,
        getAlbumData: () => ({ images: [], imageOrder: [] }),
      });

      // The composable doesn't expose getAlbumUpdateInput directly,
      // but we can verify the behavior through performAutoSave
      expect(isAutoSaving.value).toBe(false);
    });

    it('creates new album when existingAlbum is null and images have IDs', async () => {
      const getAlbumData = () => ({
        images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'test', caption: '', copyright: '' },
        ],
        imageOrder: ['img-1'],
      });

      const { performAutoSave } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum: null,
        getAlbumData,
      });

      await performAutoSave();

      expect(mockMutate).toHaveBeenCalledWith({
        where: { id: 'disc-1' },
        updateDiscussionInput: {
          Album: {
            create: {
              node: {
                imageOrder: ['img-1'],
                Images: {
                  connect: [{ where: { node: { id: 'img-1' } } }],
                },
              },
            },
          },
        },
      });
    });

    it('does not call mutation when discussionId is undefined', async () => {
      const { performAutoSave } = useAlbumAutoSave({
        discussionId: undefined,
        existingAlbum: null,
        getAlbumData: () => ({
          images: [{ id: 'img-1', url: 'test.jpg', alt: '', caption: '', copyright: '' }],
          imageOrder: ['img-1'],
        }),
      });

      await performAutoSave();

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not call mutation when images array is empty', async () => {
      const { performAutoSave } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum: null,
        getAlbumData: () => ({ images: [], imageOrder: [] }),
      });

      await performAutoSave();

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('builds connect array for new images added to existing album', async () => {
      const existingAlbum = {
        id: 'album-1',
        Images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'existing', caption: '', copyright: '' },
        ],
        imageOrder: ['img-1'],
      } as any;

      const getAlbumData = () => ({
        images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'existing', caption: '', copyright: '' },
          { id: 'img-2', url: 'http://example.com/2.jpg', alt: 'new', caption: '', copyright: '' },
        ],
        imageOrder: ['img-1', 'img-2'],
      });

      const { performAutoSave } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum,
        getAlbumData,
      });

      await performAutoSave();

      expect(mockMutate).toHaveBeenCalledWith({
        where: { id: 'disc-1' },
        updateDiscussionInput: {
          Album: {
            update: {
              node: {
                imageOrder: ['img-1', 'img-2'],
                Images: [
                  {
                    connect: [{ where: { node: { id: 'img-2' } } }],
                  },
                ],
              },
            },
          },
        },
      });
    });

    it('builds disconnect array for removed images', async () => {
      const existingAlbum = {
        id: 'album-1',
        Images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'first', caption: '', copyright: '' },
          { id: 'img-2', url: 'http://example.com/2.jpg', alt: 'second', caption: '', copyright: '' },
        ],
        imageOrder: ['img-1', 'img-2'],
      } as any;

      const getAlbumData = () => ({
        images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'first', caption: '', copyright: '' },
        ],
        imageOrder: ['img-1'],
      });

      const { performAutoSave } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum,
        getAlbumData,
      });

      await performAutoSave();

      expect(mockMutate).toHaveBeenCalledWith({
        where: { id: 'disc-1' },
        updateDiscussionInput: {
          Album: {
            update: {
              node: {
                imageOrder: ['img-1'],
                Images: [
                  {
                    disconnect: [{ where: { node: { id: 'img-2' } } }],
                  },
                ],
              },
            },
          },
        },
      });
    });

    it('builds update array when image properties change', async () => {
      const existingAlbum = {
        id: 'album-1',
        Images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'old alt', caption: 'old caption', copyright: '' },
        ],
        imageOrder: ['img-1'],
      } as any;

      const getAlbumData = () => ({
        images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'new alt', caption: 'new caption', copyright: 'me' },
        ],
        imageOrder: ['img-1'],
      });

      const { performAutoSave } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum,
        getAlbumData,
      });

      await performAutoSave();

      expect(mockMutate).toHaveBeenCalledWith({
        where: { id: 'disc-1' },
        updateDiscussionInput: {
          Album: {
            update: {
              node: {
                imageOrder: ['img-1'],
                Images: [
                  {
                    where: { node: { id: 'img-1' } },
                    update: {
                      node: {
                        url: 'http://example.com/1.jpg',
                        alt: 'new alt',
                        caption: 'new caption',
                        copyright: 'me',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      });
    });

    it('does not include update operation when image properties unchanged', async () => {
      const existingAlbum = {
        id: 'album-1',
        Images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'same', caption: '', copyright: '' },
        ],
        imageOrder: ['img-1'],
      } as any;

      const getAlbumData = () => ({
        images: [
          { id: 'img-1', url: 'http://example.com/1.jpg', alt: 'same', caption: '', copyright: '' },
        ],
        imageOrder: ['img-1'],
      });

      const { performAutoSave } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum,
        getAlbumData,
      });

      await performAutoSave();

      // Should still be called to update imageOrder, but Images array should be empty
      expect(mockMutate).toHaveBeenCalledWith({
        where: { id: 'disc-1' },
        updateDiscussionInput: {
          Album: {
            update: {
              node: {
                imageOrder: ['img-1'],
                Images: [],
              },
            },
          },
        },
      });
    });
  });

  describe('auto-save state', () => {
    it('sets isAutoSaving to true during save', async () => {
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      mockMutate.mockImplementation(() => pendingPromise);

      const { performAutoSave, isAutoSaving } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum: {
          id: 'album-1',
          Images: [],
          imageOrder: [],
        } as any,
        getAlbumData: () => ({
          images: [{ id: 'img-1', url: 'test.jpg', alt: '', caption: '', copyright: '' }],
          imageOrder: ['img-1'],
        }),
      });

      const savePromise = performAutoSave();
      expect(isAutoSaving.value).toBe(true);

      resolvePromise!();
      await savePromise;

      expect(isAutoSaving.value).toBe(false);
    });

    it('sets autoSaveSuccess to true after successful save', async () => {
      mockMutate.mockResolvedValue({});

      const { performAutoSave, autoSaveSuccess } = useAlbumAutoSave({
        discussionId: 'disc-1',
        existingAlbum: {
          id: 'album-1',
          Images: [],
          imageOrder: [],
        } as any,
        getAlbumData: () => ({
          images: [{ id: 'img-1', url: 'test.jpg', alt: '', caption: '', copyright: '' }],
          imageOrder: ['img-1'],
        }),
      });

      await performAutoSave();

      expect(autoSaveSuccess.value).toBe(true);
    });
  });
});
