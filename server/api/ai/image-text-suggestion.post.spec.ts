import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './image-text-suggestion.post';

const h = vi.hoisted(() => ({
  readBody: vi.fn(),
  setResponseHeader: vi.fn(),
  generateSuggestion: vi.fn(),
  isTrustedUrl: vi.fn(),
  config: {
    aiImageTextModel: 'openai/test-vision-model',
    public: { googleCloudStorageBucket: 'forum-images' },
  },
}));

vi.mock('h3', () => ({
  createError: (input: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(input.statusMessage), input),
  defineEventHandler: (currentHandler: unknown) => currentHandler,
  readBody: h.readBody,
  setResponseHeader: h.setResponseHeader,
}));

vi.mock('@/server/utils/image-text-suggestion', () => ({
  generateImageTextSuggestion: h.generateSuggestion,
  isTrustedUploadedImageUrl: h.isTrustedUrl,
}));

vi.stubGlobal('useRuntimeConfig', () => h.config);

type TestEvent = {
  context: {
    authSession?: {
      isAuthenticated: boolean;
    };
  };
};

const authenticatedEvent = (): TestEvent => ({
  context: { authSession: { isAuthenticated: true } },
});

const runHandler = (event: TestEvent) =>
  (handler as (input: TestEvent) => Promise<unknown>)(event);

describe('POST /api/ai/image-text-suggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.config.aiImageTextModel = 'openai/test-vision-model';
    h.config.public.googleCloudStorageBucket = 'forum-images';
    h.readBody.mockResolvedValue({
      imageUrl:
        'https://storage.googleapis.com/forum-images/users/alice/cat.jpg',
      currentAlt: 'cat.jpg',
      currentCaption: '',
    });
    h.isTrustedUrl.mockReturnValue(true);
    h.generateSuggestion.mockResolvedValue({
      alt: 'A tabby cat sitting beside a window',
      caption: 'Morning light by the window',
    });
  });

  it('requires an authenticated session', async () => {
    await expect(runHandler({ context: {} })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('fails closed when no model is configured', async () => {
    h.config.aiImageTextModel = '';

    await expect(runHandler(authenticatedEvent())).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('rejects malformed requests before generation', async () => {
    h.readBody.mockResolvedValue({ imageUrl: 'not a URL' });

    await expect(runHandler(authenticatedEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Invalid image-text suggestion request.',
    });
  });

  it('rejects images outside trusted instance storage', async () => {
    h.isTrustedUrl.mockReturnValue(false);

    await expect(runHandler(authenticatedEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage:
        'AI suggestions are currently available only for images uploaded to this instance.',
    });
  });

  it('returns separate editable alt-text and caption drafts', async () => {
    const result = await runHandler(authenticatedEvent());

    expect(result).toEqual({
      alt: 'A tabby cat sitting beside a window',
      caption: 'Morning light by the window',
    });
  });

  it('passes only validated request data to the generator', async () => {
    await runHandler(authenticatedEvent());

    expect(h.generateSuggestion).toHaveBeenCalledWith({
      model: 'openai/test-vision-model',
      input: {
        imageUrl:
          'https://storage.googleapis.com/forum-images/users/alice/cat.jpg',
        currentAlt: 'cat.jpg',
        currentCaption: '',
      },
    });
  });
});
