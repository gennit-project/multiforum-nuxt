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
import { MAX_CHARS_IN_DISCUSSION_BODY } from "@/utils/constants";
import AlbumEditor from "@/components/discussion/form/AlbumEditor.vue";

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
});
const emit = defineEmits(["closeEditor", "updateFormValues"]);

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

const imageOrder = computed<string[]>(() => {
  // If there's an existing order, use it
  if (props.discussion?.Album?.imageOrder?.length) {
    return props.discussion.Album.imageOrder.map((imageId: string) => {
      const image = images.value.find((image) => image.id === imageId);
      return image ? image.id : "";
    });
  }
  
  // If no order exists, create one from the images array
  return images.value
    .map(image => image.id)
    .filter((id): id is string => id !== "");
});

const orderedImages = computed(() => {
  return imageOrder.value
    .map((imageId) => {
      const image = images.value.find((image) => imageId === image.id);
      return image || null;
    })
    .filter((image): image is NonNullable<typeof image> => image !== null);
});

const formValues = ref({
  body: props.discussion?.body || "",
  album: {
    images: orderedImages.value,
    imageOrder: imageOrder.value,
  },
});

function getUpdateDiscussionInputFromFormValues(): DiscussionUpdateInput {
  // 1) If the album doesn't exist yet, just CREATE it (and its images)
  if (!albumId.value) {
    const newImages = formValues.value.album.images || [];
    return {
      body: formValues.value.body,
      Album: {
        create: {
          node: {
            imageOrder: newImages.map((img) => img.id),
            Images: {
              create: newImages.map((img) => ({
                node: {
                  url: img.url,
                  alt: img.alt,
                  caption: img.caption,
                  copyright: img.copyright,
                },
              })),
            },
          },
        },
      },
    };
  }

  // 2) If the album already exists, we build the create/update/delete arrays
  const oldImages = props.discussion.Album?.Images ?? [];
  const newImages = formValues.value.album.images;

  // CREATE array: any new image in `newImages` that has NO matching ID in `oldImages`
  const createImageArray = newImages
    .filter((img) => !oldImages.some((old) => old.id === img.id))
    .map((img) => ({
      create: {
        node: {
          url: img.url,
          alt: img.alt,
          caption: img.caption,
          copyright: img.copyright,
        },
      },
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

  // Combine all operations into a single array. Each object is one “Images” operation.
  const imagesOps = [
    ...createImageArray,
    ...updateImageArray,
    ...deleteImageArray,
  ];

  // Wrap them in the correct update shape, including "body" if you want to change it:
  return {
    body: formValues.value.body,
    Album: {
      update: {
        node: {
          imageOrder: newImages.map((img) => img.id),
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
    updateDiscussionInput: getUpdateDiscussionInputFromFormValues(),
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
  // Merge these changes back into the parent's form data
  formValues.value.album = newVals.album;
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 mt-3 w-full flex flex-col">
      <TextEditor
        class="mb-3"
        :test-id="'body-input'"
        :disable-auto-focus="false"
        :initial-value="formValues.body || ''"
        :placeholder="'Add details'"
        :rows="8"
        @update="formValues.body = $event"
      />

      <CharCounter
        :current="formValues.body?.length || 0"
        :max="MAX_CHARS_IN_DISCUSSION_BODY"
      />
      <AlbumEditor
        :form-values="formValues"
        :allow-image-upload="true"
        @update-form-values="handleUpdateAlbum"
      />
      <div class="flex align-items gap-2 justify-end mt-2">
        <GenericButton :text="'Cancel'" @click="emits('closeEditor')" />
        <PrimaryButton
          :disabled="formValues.body.length > MAX_CHARS_IN_DISCUSSION_BODY"
          :label="'Save'"
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
