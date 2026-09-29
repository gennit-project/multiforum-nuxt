import { ref } from 'vue';
import type {
  ImageTextSuggestion,
  ImageTextSuggestionRequest,
} from '@/types/imageTextSuggestion';

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const response = 'data' in error ? error.data : undefined;
    if (
      response &&
      typeof response === 'object' &&
      'statusMessage' in response
    ) {
      const statusMessage = response.statusMessage;
      if (typeof statusMessage === 'string' && statusMessage.trim()) {
        return statusMessage;
      }
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return 'The image could not be analyzed. Please try again.';
};

export function useImageTextSuggestion() {
  const suggestion = ref<ImageTextSuggestion | null>(null);
  const loading = ref(false);
  const errorMessage = ref('');

  const requestSuggestion = async (input: ImageTextSuggestionRequest) => {
    loading.value = true;
    errorMessage.value = '';
    suggestion.value = null;

    try {
      suggestion.value = await $fetch<ImageTextSuggestion>(
        '/api/ai/image-text-suggestion',
        {
          method: 'POST',
          body: input,
        }
      );
    } catch (error) {
      errorMessage.value = getErrorMessage(error);
    } finally {
      loading.value = false;
    }
  };

  const dismissSuggestion = () => {
    suggestion.value = null;
    errorMessage.value = '';
  };

  return {
    suggestion,
    loading,
    errorMessage,
    requestSuggestion,
    dismissSuggestion,
  };
}
