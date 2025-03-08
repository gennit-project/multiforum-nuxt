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

function getUpdateDiscussionInputFromFormValues(): DiscussionUpdateInput {
  // If there is no album yet, we CREATE an Album and images
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

    return {
      body: formValues.value.body, // include body if you want to update that too
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
  }

  // If we DO have an albumId, we UPDATE the existing Album/images
  const createImageArray: AlbumImagesCreateFieldInput[] = (
    props.discussion.Album?.Images ?? []
  )
    .filter((image) => {
      // Example logic: find images that exist in `formValues` but do NOT match
      // what we had originally, etc. (Adjust as needed.)
      return !formValues.value.album.images.some(
        (newImage) => newImage.id === image.id
      );
    })
    .map((image) => ({
      node: {
        url: image.url,
        alt: image.alt,
        caption: image.caption,
        copyright: image.copyright,
      },
    }));

  const deleteImageArray: AlbumImagesDeleteFieldInput[] = (
    props.discussion.Album?.Images ?? []
  )
    .filter((image) => {
      // Example logic: images removed from the form
      return !formValues.value.album.images.some(
        (newImage) => newImage.id === image.id
      );
    })
    .map((image) => ({
      where: {
        node: {
          id: image.id,
        },
      },
    }));

  const updateImageArray: AlbumImagesUpdateFieldInput[] = (
    props.discussion.Album?.Images ?? []
  )
    .filter((image) => {
      // Example logic: images that still exist, but could have changed
      return formValues.value.album.images.some(
        (newImage) => newImage.id === image.id
      );
    })
    .map((image) => {
      const newImage = formValues.value.album.images.find(
        (newImage) => newImage.id === image.id
      );
      if (!newImage) throw new Error("newImage is undefined");

      return {
        where: {
          node: {
            id: image.id,
          },
        },
        update: {
          node: {
            url: newImage.url,
            alt: newImage.alt,
            caption: newImage.caption,
            copyright: newImage.copyright,
          },
        },
      };
    });

  // ---- NEW: Build up a single array of image operations so each
  //           create/update/delete is its own item in the Images[] array
  const imagesOperations: any[] = [];

  // Flatten "create" operations (each item is { create: { node: {...}} })
  createImageArray.forEach((item) => {
    imagesOperations.push({
      create: item,
    });
  });

  // Flatten "delete" operations (each item is { where: {...}, delete: {...} })
  deleteImageArray.forEach((item) => {
    imagesOperations.push({
      where: item.where,
      // Some schemas allow simply `delete: true` or `delete: { node: {} }`.
      // Adjust as needed. For example:
      delete: {
        node: {},
      },
    });
  });

  // Flatten "update" operations (each item is { where: {...}, update: {...} })
  updateImageArray.forEach((item) => {
    imagesOperations.push({
      where: item.where,
      update: item.update,
    });
  });

  // Finally, wrap this in the correct shape: 
  // { body: '...', Album: { update: { node: { Images: [...] } } } }
  return {
    body: formValues.value.body, // if you want to also update discussion body
    Album: {
      update: {
        node: {
          Images: imagesOperations,
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
} = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
  variables: {
    where: { id: props.discussion.id },
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
