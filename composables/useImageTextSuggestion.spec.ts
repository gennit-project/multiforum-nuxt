import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageTextSuggestion } from './useImageTextSuggestion';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

describe('useImageTextSuggestion', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('stores a successful suggestion', async () => {
    mockFetch.mockResolvedValue({
      alt: 'A black cat on a red chair',
      caption: 'Waiting by the window',
    });
    const composable = useImageTextSuggestion();

    await composable.requestSuggestion({
      imageUrl: 'https://img.test/cat.jpg',
    });

    expect(composable.suggestion.value).toEqual({
      alt: 'A black cat on a red chair',
      caption: 'Waiting by the window',
    });
  });

  it('surfaces the API status message', async () => {
    mockFetch.mockRejectedValue({
      data: { statusMessage: 'AI suggestions are not configured.' },
    });
    const composable = useImageTextSuggestion();

    await composable.requestSuggestion({
      imageUrl: 'https://img.test/cat.jpg',
    });

    expect(composable.errorMessage.value).toBe(
      'AI suggestions are not configured.'
    );
  });

  it('clears prior output while a new request starts', async () => {
    let finishRequest:
      ((value: { alt: string; caption: string }) => void) | undefined;
    mockFetch
      .mockResolvedValueOnce({ alt: 'Old suggestion', caption: '' })
      .mockImplementationOnce(
        () =>
          new Promise<{ alt: string; caption: string }>((resolve) => {
            finishRequest = resolve;
          })
      );
    const composable = useImageTextSuggestion();
    await composable.requestSuggestion({
      imageUrl: 'https://img.test/old.jpg',
    });

    const pending = composable.requestSuggestion({
      imageUrl: 'https://img.test/new.jpg',
    });

    expect({
      suggestion: composable.suggestion.value,
      loading: composable.loading.value,
    }).toEqual({ suggestion: null, loading: true });

    finishRequest?.({ alt: 'New suggestion', caption: '' });
    await pending;
  });

  it('dismisses both suggestions and errors', async () => {
    mockFetch.mockResolvedValue({ alt: 'A cat', caption: '' });
    const composable = useImageTextSuggestion();
    await composable.requestSuggestion({
      imageUrl: 'https://img.test/cat.jpg',
    });

    composable.dismissSuggestion();

    expect({
      suggestion: composable.suggestion.value,
      error: composable.errorMessage.value,
    }).toEqual({ suggestion: null, error: '' });
  });
});
