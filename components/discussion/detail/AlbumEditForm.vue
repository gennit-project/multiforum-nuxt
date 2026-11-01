<script lang="ts" setup>
import type { DiscussionPresentation as Discussion } from '@/types/DiscussionPresentation';
import { ref, computed, onMounted, watch } from 'vue';
import type { PropType } from 'vue';
import { buildAlbumUpdateInput } from '@/utils/albumUpdateInput';
import {
  mapAlbumImagesToForm,
  getInitialImageOrder,
} from '@/utils/albumImages';
import PrimaryButton from '@/components/PrimaryButton.vue';
import GenericButton from '@/components/GenericButton.vue';
import { useMutation } from '@vue/apollo-composable';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { UpdateDiscussionWithChannelConnectionsDocument } from '@/__generated__/operations';
import AlbumEditor from '@/components/discussion/form/AlbumEditor.vue';
import Notification from '@/components/NotificationComponent.vue';
import { useRoute } from 'vue-router';


// Define a simplified type for images used in the form
type AlbumFormImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  isCoverImage: boolean;
  hasSensitiveContent: boolean;
  hasSpoiler: boolean;
  copyright: string;
  Uploader?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
};

// Define types for form data
interface AlbumFormData {
  album: {
    images: AlbumFormImage[];
    imageOrder: string[];
  };
}

// Get the discussion ID from the route params
const route = useRoute();
const discussionIdInParams = computed(() => {
  // If the discussion ID is provided in the route params, use it
  return typeof route.params.discussionId === 'string' ? route.params.discussionId : '';
});

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion | null | undefined>,
    required: false,
    default: undefined,
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  allowImageUpload: {
    type: Boolean,
    default: true,
  },
  // Hide the built-in heading when a parent form labels this section itself.
  showHeading: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits<{
  closeEditor: [];
  updateFormValues: [
    formData: { album: { images: AlbumFormImage[]; imageOrder: string[] } },
  ];
}>();

// Check if we're in create mode (using a temporary ID) or edit mode
// If we have images with IDs, we're not really in "create" mode for the album,
// even if the discussion itself is new
const isCreateMode = computed(() => {
  // If discussion is undefined or null, we're in create mode
  if (!props.discussion) {
    return true;
  }

  // If discussion has a real ID (not temp-id), we're in edit mode
  if (props.discussion.id !== 'temp-id' && !discussionIdInParams.value) {
    return false;
  }

  // If we have images with IDs, we're editing an existing album (not in create mode)
  const hasExistingImages = props.discussion?.Album?.Images?.some(
    (img) => img.id
  );
  return !hasExistingImages;
});

const images = computed(() =>
  mapAlbumImagesToForm(props.discussion?.Album?.Images)
);

const initialImageOrder = computed<string[]>(() =>
  getInitialImageOrder({
    albumImageOrder: props.discussion?.Album?.imageOrder,
    images: images.value,
  })
);

// Create reactive form values based on the computed props
const formValues = ref<AlbumFormData>({
  album: {
    images: [], // Will be updated in onMounted
    imageOrder: [],
  },
});

// Notification state
const savedSuccessfully = ref(false);

// Initialize form values after component is mounted
onMounted(() => {
  formValues.value.album.images = [...images.value];
  formValues.value.album.imageOrder = [...initialImageOrder.value];
});

watch(() => [props.discussion?.id, discussionIdInParams.value], () => {
  formValues.value.album = { images: [...images.value], imageOrder: [...initialImageOrder.value] };
  savedSuccessfully.value = false;
});
let submittedId = props.discussion?.id || discussionIdInParams.value;

const buildAlbumVariables = () => ({
  where: { id: { eq: props.discussion?.id || discussionIdInParams.value } },
  updateDiscussionInput: {},
  album: buildAlbumUpdateInput({
    albumData: formValues.value.album,
    existingImages: props.discussion?.Album?.Images ?? [],
    existingImageOrder: props.discussion?.Album?.imageOrder,
  }),
});
const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UpdateDiscussionWithChannelConnectionsDocument, () => ({ variables: buildAlbumVariables() }));

onDone(() => {
  if (submittedId !== (props.discussion?.id || discussionIdInParams.value)) return;
  emit('closeEditor');
});

// For handling save
function handleSave() {
  // For both cases where we're inside CreateEditDiscussionFields (temp-id)
  if (props.discussion?.id === 'temp-id') {
    // Always emit the form values to update the parent component
    emit('updateFormValues', {
      album: formValues.value.album,
    });
    // Add a success notification
    savedSuccessfully.value = true;
    setTimeout(() => {
      savedSuccessfully.value = false;
    }, 3000); // Hide after 3 seconds
  } else {
    // In actual edit mode for an existing discussion, perform the API mutation
    const variables = buildAlbumVariables();
    if (variables.where.id.eq && variables.album) {
      submittedId = variables.where.id.eq;
      updateDiscussion(variables);
    }
    else emit('closeEditor');
  }
}

function handleUpdateAlbum(newVals: AlbumFormData) {
  // Update the album data
  formValues.value.album = {
    images: newVals.album.images,
    imageOrder: newVals.album.imageOrder,
  };

  // Create forms and enclosing edit forms persist album data through their
  // parent form. Standalone edit mode saves directly through AlbumEditor.
  if (isCreateMode.value || !props.showCloseButton) {
    emit('updateFormValues', {
      album: formValues.value.album,
    });
  }
}
</script>

<template>
  <div class="w-full">
    <div class="mt-3 mb-3 flex w-full flex-col">
      <h3 v-if="showHeading" class="mb-4 text-lg font-semibold dark:text-white">
        Edit Album (Optional)
      </h3>

      <AlbumEditor
        :form-values="formValues"
        :allow-image-upload="allowImageUpload"
        :auto-save="showCloseButton"
        :discussion-id="discussionIdInParams"
        :existing-album="props.discussion?.Album || undefined"
        @update-form-values="handleUpdateAlbum"
      />

      <!-- Only show Save Album button in create mode (when discussionId is not provided) -->
      <div
        v-if="isCreateMode && showCloseButton"
        class="align-items mt-4 flex justify-end gap-2"
      >
        <GenericButton :text="'Cancel'" @click="emit('closeEditor')" />
        <PrimaryButton
          :label="'Save Album'"
          :loading="updateDiscussionLoading && !isCreateMode"
          @click="handleSave"
        />
      </div>

      <!-- Show auto-save info in edit mode -->
      <div
        v-else-if="!isCreateMode && showCloseButton"
        class="mt-4 flex items-center justify-between"
      >
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Album changes are saved automatically
        </span>
        <GenericButton :text="'Close'" @click="emit('closeEditor')" />
      </div>
    </div>

    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />

    <Notification
      :show="savedSuccessfully"
      :title="'Album saved successfully'"
      @close-notification="savedSuccessfully = false"
    />
  </div>
</template>
