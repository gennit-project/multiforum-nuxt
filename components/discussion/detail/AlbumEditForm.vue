<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import type { PropType } from "vue";
import type {
  Discussion,
  Image,
  DiscussionUpdateInput,
} from "@/__generated__/graphql";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import { useMutation } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { UPDATE_DISCUSSION } from "@/graphQLData/discussion/mutations";
import AlbumEditor from "@/components/discussion/form/AlbumEditor.vue";
import Notification from "@/components/NotificationComponent.vue";

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
});
const emit = defineEmits(["closeEditor", "updateFormValues"]);

// Check if we're in create mode (using a temporary ID) or edit mode
// If we have images with IDs, we're not really in "create" mode for the album,
// even if the discussion itself is new
const isCreateMode = computed(() => {
  // If discussion has a real ID, we're in edit mode
  if (props.discussion.id !== 'temp-id') {
    return false;
  }
  
  // If we have images with IDs, we're editing an existing album (not in create mode)
  const hasExistingImages = props.discussion?.Album?.Images?.some(img => img.id);
  return !hasExistingImages;
});

const albumId = computed(() => {
  // In create mode, we use an empty string to indicate there's no album yet
  if (isCreateMode.value) {
    return "";
  }
  return props.discussion?.Album?.id || "";
});

const images = computed(() => {
  if (!props.discussion?.Album?.Images) return [];
  return props.discussion.Album.Images.map((image: Image) => {
    return {
      id: image.id || "",
      url: image.url || "",
      alt: image.alt || "",
      caption: image.caption || "",
      isCoverImage: false,
      hasSensitiveContent: false,
      hasSpoiler: false,
      copyright: image.copyright || "",
    };
  });
});

const initialImageOrder = computed<string[]>(() => {
  // If there's an existing order, use it
  if (props.discussion?.Album?.imageOrder?.length) {
    return props.discussion.Album.imageOrder;
  }
  
  // If no order exists, create one from the images array
  if (images.value.length > 0) {
    console.log("Creating image order from images");
    // Create an order from the image IDs
    return images.value
      .filter(img => img.id)
      .map(img => img.id);
  }
  
  return [];
});

// Create reactive form values based on the computed props
const formValues = ref({
  album: {
    images: [], // Will be updated in onMounted
    imageOrder: [],
  },
});

// Notification state
const savedSuccessfully = ref(false);

// Initialize form values after component is mounted
onMounted(() => {
  console.log("AlbumEditForm mounted, initializing formValues");
  console.log("Images:", images.value);
  console.log("ImageOrder:", initialImageOrder.value);
  
  formValues.value.album.images = [...images.value];
  formValues.value.album.imageOrder = [...initialImageOrder.value];
  
  console.log("Initialized formValues:", formValues.value);
});

function getUpdateDiscussionInputForAlbum(): DiscussionUpdateInput {
  // 1) If the album doesn't exist yet, CREATE it and connect to existing images
  if (!albumId.value) {
    const newImages = formValues.value.album.images || [];
    
    // All images should already have IDs since they're created when uploaded
    return {
      Album: {
        create: {
          node: {
            imageOrder: formValues.value.album.imageOrder,
            Images: {
              // Connect to existing images using their IDs
              connect: newImages.map(img => ({
                where: { node: { id: img.id } }
              }))
            },
          },
        },
      },
    };
  }

  // 2) If the album already exists, we build the connect/update/delete arrays
  const oldImages = props.discussion.Album?.Images ?? [];
  const newImages = formValues.value.album.images;

  // CONNECT array: any new image in `newImages` that has NO matching ID in `oldImages`
  // These are images that already exist in the database but need to be connected to this album
  const connectImageArray = newImages
    .filter((img) => !oldImages.some((old) => old.id === img.id))
    .map((img) => ({
      connect: {
        where: { node: { id: img.id } }
      }
    }));

  // UPDATE array: any image in `newImages` whose ID already exists in `oldImages`
  const updateImageArray = newImages
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
    
  // DELETE array: any old image that is no longer present in `newImages`
  const deleteImageArray = oldImages
    .filter((old) => !newImages.some((img) => img.id === old.id))
    .map((old) => ({
      delete: {
        where: { node: { id: old.id } },
      },
    }));
    
  // Combine all operations into a single array. Each object is one "Images" operation.
  const imagesOps = [
    ...connectImageArray,
    ...updateImageArray,
    ...deleteImageArray,
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
    where: { id: props.discussion.id },
    updateDiscussionInput: getUpdateDiscussionInputForAlbum(),
  },
}));

onDone(() => {
  emit("closeEditor");
});

// For handling save
function handleSave() {
  console.log("handleSave called, isCreateMode:", isCreateMode.value);
  console.log("Current album data:", JSON.stringify(formValues.value.album));
  
  // For both cases where we're inside CreateEditDiscussionFields (temp-id)
  if (props.discussion.id === 'temp-id') {
    // Always emit the form values to update the parent component
    console.log("Emitting updateFormValues in CreateEditDiscussionFields context");
    emit("updateFormValues", {
      album: formValues.value.album
    });
    // Add a success notification
savedSuccessfully.value = true;
setTimeout(() => {
  savedSuccessfully.value = false;
}, 3000); // Hide after 3 seconds
  } else {
    // In actual edit mode for an existing discussion, perform the API mutation
    console.log("Calling updateDiscussion in edit mode");
    updateDiscussion();
  }
}

function handleUpdateAlbum(newVals: {
  album: {
    images: any[];
    imageOrder: string[];
  };
}) {
  console.log("AlbumEditForm received update from AlbumEditor:", JSON.stringify(newVals));
  
  // Update the album data
  formValues.value.album = {
    images: newVals.album.images,
    imageOrder: newVals.album.imageOrder
  };
  
  console.log("Updated formValues in AlbumEditForm:", JSON.stringify(formValues.value.album));
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 mt-3 w-full flex flex-col">
      <h3 class="text-lg font-semibold mb-4 dark:text-white">Edit Album (Optional)</h3>
      
      <AlbumEditor
        :form-values="formValues"
        :allow-image-upload="true"
        @update-form-values="handleUpdateAlbum"
      />
      
      <div class="flex align-items gap-2 justify-end mt-4">
        <GenericButton :text="'Cancel'" @click="emit('closeEditor')" />
        <PrimaryButton
          :label="'Save Album'"
          :loading="updateDiscussionLoading && !isCreateMode"
          @click="handleSave"
        />
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