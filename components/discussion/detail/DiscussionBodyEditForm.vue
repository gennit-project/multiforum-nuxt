<script lang="ts" setup>
import { ref, computed } from "vue";
import type { PropType } from "vue";
import type {
  AlbumImagesCreateFieldInput,
  AlbumImagesUpdateFieldInput,
  AlbumUpdateFieldInput,
  AlbumImagesDeleteFieldInput,
  Discussion,
  Image,
  DiscussionUpdateInput,
} from "@/__generated__/graphql";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import { useMutation } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import { MAX_CHARS_IN_DISCUSSION_BODY } from "@/utils/constants";
import AlbumEditor from "@/components/discussion/form/AlbumEditor.vue";

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
});
const emit = defineEmits(["closeEditor", "updateFormValues"]);

const images = computed(() => {
  if (!props.discussion?.Album?.Images) return [];
  return props.discussion.Album.Images.map((image: Image) => {
    return {
      id: image.id,
      url: image.url || "",
      alt: image.alt || "",
      caption: image.caption || "",
      copyright: image.copyright || "",
    };
  });
});

const albumId = computed(() => {
  return props.discussion?.Album?.id || "";
});

const formValues = ref({
  body: props.discussion?.body || "",
  album: {
    images: images.value,
  },
});

const getUpdateDiscussionInputFromFormValues = () => {
  let result: DiscussionUpdateInput | undefined;

  // If there is no discussionID, which means we need to create a new album,
  // then we need to create a new album with the images.
  if (!albumId.value) {
    const createImageArray: AlbumImagesCreateFieldInput[] =
    formValues.value.album.images.map((image) => ({
      node: {
        url: image.url,
        alt: image.alt,
        caption: image.caption,
        copyright: image.copyright,
      },
    }));
    const createAlbumResult: DiscussionUpdateInput = {
      body: formValues.value.body,
      Album: {
        create: {
          node: {
            Images: {
              create: createImageArray,
            },
          },
        },
      },
    };
    return createAlbumResult;
  }
  if (albumId.value) {
    // If an album ID exists, then we're creating images like this:
    const baseAlbumUpdateInput: AlbumUpdateFieldInput = {
      update: {
        node: {
          Images: []
        }
      }
    }

    // For images that are in the form now, but were not in the original album,
    // we need to create them.
    const createImageArray: AlbumImagesUpdateFieldInput[] =
    (props.discussion.Album?.Images ?? []).filter((image) => {
      return !formValues.value.album.images.some((newImage) => newImage.id === image.id);
    }).map((image) => ({
      create: {
        node: {
          url: image.url,
          alt: image.alt,
          caption: image.caption,
          copyright: image.copyright,
        },
      },
    }));

    // For images that were deleted from the original album, we need to delete them.
    const deleteImageArray: AlbumImagesUpdateFieldInput[] = 
    (props.discussion.Album?.Images ?? []).filter((image) => {
      return !formValues.value.album.images.some((newImage) => newImage.id === image.id);
    }).map((image) => ({
      delete: {
        node: {
          id: image.id,
        }
      }
    }));

    // For images whose ID is on the original album and the form, but whose values have changed,
    // we need to update them.
    const updateImageArray: AlbumImagesUpdateFieldInput[] =
    (props.discussion.Album?.Images ?? []).filter((image) => {
      return formValues.value.album.images.some((newImage) => newImage.id === image.id);
    }).map((image) => {
      const newImage = formValues.value.album.images.find((newImage) => newImage.id === image.id);
      if (!newImage) {
        throw new Error("newImage is undefined");
      }
      return {
        where: {
          node: {
            id: image.id,
          }
        },
        update: {
          node: {
            url: newImage.url,
            alt: newImage.alt,
            caption: newImage.caption,
            copyright: newImage.copyright,
          }
        }
      }
    });


    // Add to base album input 
    if (createImageArray.length > 0) {
      baseAlbumUpdateInput.update.node.Images.push(...createImageArray);
    }
    if (deleteImageArray.length > 0) {
      baseAlbumUpdateInput.update.node.Images.push(...deleteImageArray);
    }
    if (updateImageArray.length > 0) {
      baseAlbumUpdateInput.update.node.Images.push(...updateImageArray);
    }
    result = baseAlbumUpdateInput;
  }
  if (!result) {
    throw new Error("updateDiscussionInput is undefined");
  }
  return result;
};

const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
  variables: {
    discussionWhere: { id: props.discussion.id },
    updateDiscussionInput: getUpdateDiscussionInputFromFormValues(),
  },
}));

onDone(() => {
  emit("closeEditor");
});

function handleUpdateAlbum(newVals: { album: { images: any[] } }) {
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
      <div class="flex align-items gap-2 justify-end">
        <GenericButton :text="'Cancel'" @click="emits('closeEditor')" />
        <PrimaryButton
          :disabled="
            formValues.body.length === 0 ||
            formValues.body.length > MAX_CHARS_IN_DISCUSSION_BODY
          "
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
