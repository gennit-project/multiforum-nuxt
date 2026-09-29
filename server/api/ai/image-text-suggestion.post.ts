import { z } from 'zod';
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3';
import {
  generateImageTextSuggestion,
  isTrustedUploadedImageUrl,
} from '@/server/utils/image-text-suggestion';

const requestSchema = z.object({
  imageUrl: z.string().url().max(2048),
  currentAlt: z.string().max(500).optional(),
  currentCaption: z.string().max(1000).optional(),
});

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');

  if (!event.context.authSession?.isAuthenticated) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in to request AI image-text suggestions.',
    });
  }

  const config = useRuntimeConfig(event);
  const model = String(config.aiImageTextModel || '').trim();
  if (!model) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI image-text suggestions are not configured.',
    });
  }

  const parsed = requestSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image-text suggestion request.',
    });
  }

  const bucket = String(config.public?.googleCloudStorageBucket || '').trim();
  if (
    !isTrustedUploadedImageUrl({
      imageUrl: parsed.data.imageUrl,
      bucket,
    })
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'AI suggestions are currently available only for images uploaded to this instance.',
    });
  }

  try {
    return await generateImageTextSuggestion({
      model,
      input: parsed.data,
    });
  } catch (error) {
    console.error(
      'AI image-text suggestion failed:',
      error instanceof Error ? error.message : error
    );
    throw createError({
      statusCode: 502,
      statusMessage:
        'The AI suggestion service could not analyze this image. Please try again.',
    });
  }
});
