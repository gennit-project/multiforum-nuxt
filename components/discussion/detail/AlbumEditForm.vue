<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import type { PropType } from 'vue';
import type {
  Discussion,
  Image,
  DiscussionUpdateInput,
} from '@/__generated__/graphql';
import PrimaryButton from '@/components/PrimaryButton.vue';
import GenericButton from '@/components/GenericButton.vue';
import { useMutation } from '@vue/apollo-composable';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { UPDATE_DISCUSSION } from '@/graphQLData/discussion/mutations';
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
  return route.params.discussionId ? String(route.params.discussionId) : '';
});

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion | null | undefined>,
    required: false,
    default: undefined,
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

const albumId = computed(() => {
  // In create mode, we use an empty string to indicate there's no album yet
  if (isCreateMode.value) {
    return '';
  }
  return props.discussion?.Album?.id || '';
});

const images = computed(() => {
  if (!props.discussion?.Album?.Images) return [];
  return props.discussion.Album.Images.map((image: Image) => {
    return {
      id: image.id || '',
      url: image.url || '',
      alt: image.alt || '',
      caption: image.caption || '',
      isCoverImage: false,
      hasSensitiveContent: false,
      hasSpoiler: false,
      copyright: image.copyright || '',
    };
  });
});

const initialImageOrder = computed<string[]>(() => {
  // If there's an existing order, use it
  if (props.discussion?.Album?.imageOrder?.length) {
    // Filter out any null or undefined values to ensure string[]
    return props.discussion.Album.imageOrder.filter(
      (id): id is string => typeof id === 'string'
    );
  }

  // If no order exists, create one from the images array
  if (images.value.length > 0) {
    // Create an order from the image IDs
    return images.value
      .filter((img): img is (typeof images.value)[number] => Boolean(img.id))
      .map((img) => img.id);
  }

  return [];
});

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

function getUpdateDiscussionInputForAlbum(): DiscussionUpdateInput {
  // 1) If the album doesn't exist yet, CREATE it and connect to existing images
  if (!albumId.value) {
    const newImages = formValues.value.album.images;

    // Build the album node with Owner if user is logged in
    const albumNode: any = {
      imageOrder: formValues.value.album.imageOrder,
      Images: {
        // Connect to existing images using their IDs
        connect: newImages
          .filter((img): img is AlbumFormImage => Boolean(img.id))
          .map((img) => ({
            where: { node: { id: img.id } },
          })),
      },
    };

    // All images should already have IDs since they're created when uploaded
    return {
      Album: {
        create: {
          node: albumNode,
        },
      },
    };
  }

  // 2) If the album already exists, we build the connect/update/delete arrays
  const oldImages = props.discussion?.Album?.Images ?? [];
  const newImages = formValues.value.album.images;

  // CONNECT array: any new image in `newImages` that has NO matching ID in `oldImages`
  // These are images that already exist in the database but need to be connected to this album
  const connectImageArray = newImages
    .filter((img): img is AlbumFormImage => Boolean(img.id))
    .filter((img) => !oldImages.some((old) => old.id === img.id))
    .map((img) => ({
      connect: [
        {
          where: { node: { id: img.id } },
        },
      ],
    }));

  // UPDATE array: any image in `newImages` whose ID already exists in `oldImages`
  const updateImageArray = newImages
    .filter((img): img is AlbumFormImage => Boolean(img.id))
    .filter((img) => oldImages.some((old) => old.id === img.id))
    .map((img) => ({
      where: { node: { id: img.id } },
      update: {
        node: {
          url: img.url,
          alt: img.alt,
          caption: img.caption,
          copyright: img.copyright,
        },
      },
    }));

  // DISCONNECT array: any old image that is no longer present in `newImages`
  const disconnectImageArray = oldImages
    .filter(
      (old) => !newImages.some((img) => Boolean(img.id) && img.id === old.id)
    )
    .map((old) => ({
      disconnect: [
        {
          where: { node: { id: old.id } },
        },
      ],
    }));

  // Combine all operations into a single array. Each object is one "Images" operation.
  const imagesOps = [
    ...connectImageArray,
    ...updateImageArray,
    ...disconnectImageArray,
  ];

  // Wrap them in the correct update shape
  return {
    Album: {
      update: {
        node: {
          imageOrder: formValues.value.album.imageOrder,
          Images: imagesOps,
        },
      },
    },
  };
}

const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UPDATE_DISCUSSION, () => ({
  variables: {
    where: { id: props.discussion?.id || discussionIdInParams.value },
    updateDiscussionInput: getUpdateDiscussionInputForAlbum(),
  },
}));

onDone(() => {
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
    updateDiscussion();
  }
}

function handleUpdateAlbum(newVals: AlbumFormData) {
  // Update the album data
  formValues.value.album = {
    images: newVals.album.images,
    imageOrder: newVals.album.imageOrder,
  };

  // In create mode, automatically emit the updated album data to parent
  if (isCreateMode.value) {
    emit('updateFormValues', {
      album: formValues.value.album,
    });
  }
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 mt-3 flex w-full flex-col">
      <h3 class="font-semibold mb-4 text-lg dark:text-white">
        Edit Album (Optional)
      </h3>

      <AlbumEditor
        :form-values="formValues"
        :allow-image-upload="true"
        :discussion-id="discussionIdInParams"
        :existing-album="props.discussion?.Album || undefined"
        @update-form-values="handleUpdateAlbum"
      />

      <!-- Only show Save Album button in create mode (when discussionId is not provided) -->
      <div v-if="isCreateMode" class="align-items mt-4 flex justify-end gap-2">
        <GenericButton :text="'Cancel'" @click="emit('closeEditor')" />
        <PrimaryButton
          :label="'Save Album'"
          :loading="updateDiscussionLoading && !isCreateMode"
          @click="handleSave"
        />
      </div>

      <!-- Show auto-save info in edit mode -->
      <div v-else class="mt-4 flex items-center justify-between">
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
