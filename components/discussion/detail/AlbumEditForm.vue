<script lang="ts" setup>
import { ref, computed } from "vue";
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

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
});
const emit = defineEmits(["closeEditor"]);

const albumId = computed(() => {
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
  return images.value
    .filter((image: { id: string; url: string; alt: string; caption: string; isCoverImage: boolean; hasSensitiveContent: boolean; hasSpoiler: boolean; copyright: string }) => {
      return image.id !== null && image.id !== undefined;
    })
    .map((image: { id: string; url: string; alt: string; caption: string; isCoverImage: boolean; hasSensitiveContent: boolean; hasSpoiler: boolean; copyright: string }) => {
      return image.id;
    });
});

const orderedImages = computed(() => {
  return initialImageOrder.value
    .map((imageId) => {
      const image = images.value.find((image) => imageId === image.id);
      return image || null;
    })
    .filter((image): image is NonNullable<typeof image> => image !== null);
});

const formValues = ref({
  album: {
    images: orderedImages.value,
    imageOrder: initialImageOrder.value,
  },
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

function handleUpdateAlbum(newVals: {
  album: {
    images: any[];
    imageOrder: string[];
  };
}) {
  // Update the album data
  formValues.value.album = newVals.album;
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 mt-3 w-full flex flex-col">
      <h3 class="text-xl font-semibold mb-4 dark:text-white">Edit Album</h3>
      
      <AlbumEditor
        :form-values="formValues"
        :allow-image-upload="true"
        @update-form-values="handleUpdateAlbum"
      />
      
      <div class="flex align-items gap-2 justify-end mt-4">
        <GenericButton :text="'Cancel'" @click="emit('closeEditor')" />
        <PrimaryButton
          :label="'Save Album'"
          :loading="updateDiscussionLoading"
          @click="updateDiscussion"
        />
      </div>
    </div>
    
    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />
  </div>
</template>