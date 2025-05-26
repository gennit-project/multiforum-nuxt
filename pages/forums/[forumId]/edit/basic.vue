<script setup lang="ts">
  import {
    MAX_CHARS_IN_CHANNEL_DESCRIPTION,
    MAX_CHARS_IN_CHANNEL_DISPLAY_NAME,
  } from "@/utils/constants";
  import TagPicker from "@/components/TagPicker.vue";
  import TextInput from "@/components/TextInput.vue";
  import TextEditor from "@/components/TextEditor.vue";
  import AddImage from "@/components/AddImage.vue";
  import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";
  import { usernameVar } from "@/cache";
  import { ref, nextTick, defineProps, defineEmits } from "vue";
  import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
  import { useMutation } from "@vue/apollo-composable";
  import { isFileSizeValid } from "@/utils/index";

  defineProps({
    formValues: {
      type: Object,
      required: true,
    },
    touched: {
      type: Boolean,
      required: true,
    },
    titleIsInvalid: {
      type: Boolean,
      required: true,
    },
    editMode: {
      type: Boolean,
      required: true,
    },
  });
  type FileChangeInput = {
    // event of HTMLInputElement;
    event: Event;
    fieldName: string;
  };

  const titleInputRef = ref(null);

  nextTick(() => {
    if (titleInputRef.value) {
      // @ts-ignore - titleInputRef is not null
      titleInputRef.value?.focus();
    }
  });

  const emit = defineEmits(["updateFormValues", "submit"]);

  const { mutate: createSignedStorageUrl } = useMutation(CREATE_SIGNED_STORAGE_URL);

  const upload = async (file: File) => {
    if (!usernameVar.value) {
      console.error("No username found");
      return;
    }
    const sizeCheck = isFileSizeValid({ file });
    if (!sizeCheck.valid) {
      alert(sizeCheck.message);
      return;
    }

    try {
      const filename = getUploadFileName({
        username: usernameVar.value,
        file,
      });

      const getSignedStorageURLInput = {
        filename,
        contentType: file.type,
      };

      const signedUrlResult = await createSignedStorageUrl(getSignedStorageURLInput);
      const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

      const embeddedLink = uploadAndGetEmbeddedLink({
        file,
        filename,
        signedStorageURL,
        fileType: file.type,
      });

      return embeddedLink;
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleImageChange = async (input: FileChangeInput) => {
    const { event, fieldName } = input;
    const selectedFile = (event.target as HTMLInputElement).files?.[0];

    if (selectedFile) {
      const embeddedLink = await upload(selectedFile);
      if (!embeddedLink) return;

      emit("updateFormValues", { [fieldName]: embeddedLink });
      emit("submit");
    }
  };
</script>

<template>
  <div class="flex-1 space-y-4 sm:space-y-5">
    <FormRow
      :required="!editMode"
      section-title="Forum Unique Name"
    >
      <template #content>
        <TextInput
          ref="titleInputRef"
          :disabled="true"
          :full-width="true"
          :placeholder="'Add unique name with no spaces. Ex. forum_name'"
          :test-id="'title-input'"
          :value="formValues.uniqueName"
        />
      </template>
    </FormRow>

    <FormRow section-title="Forum Display Name">
      <template #content>
        <TextInput
          ref="displayNameInputRef"
          :full-width="true"
          :placeholder="'A more human readable display name'"
          :test-id="'display-name-input'"
          :value="formValues.displayName"
          @update="$emit('updateFormValues', { displayName: $event })"
        />
        <CharCounter
          :current="formValues.displayName?.length || 0"
          :max="MAX_CHARS_IN_CHANNEL_DISPLAY_NAME"
        />
      </template>
    </FormRow>

    <FormRow section-title="Tags">
      <template #content>
        <TagPicker
          data-testid="tag-input"
          :selected-tags="formValues.selectedTags"
          @set-selected-tags="$emit('updateFormValues', { selectedTags: $event })"
        />
      </template>
    </FormRow>

    <FormRow section-title="Description">
      <template #content>
        <TextEditor
          :allow-image-upload="false"
          class="my-3"
          :disable-auto-focus="true"
          :initial-value="formValues.description || ''"
          :placeholder="'Add description'"
          :test-id="'description-input'"
          @update="$emit('updateFormValues', { description: $event })"
        />
        <CharCounter
          :current="formValues.description?.length || 0"
          :max="MAX_CHARS_IN_CHANNEL_DESCRIPTION"
        />
      </template>
    </FormRow>
    <FormRow section-title="Forum Icon">
      <template #content>
        <AvatarComponent
          class="shadow-sm"
          :is-medium="true"
          :is-square="true"
          :src="formValues.channelIconURL"
          :text="formValues.uniqueName"
        />
        <AddImage
          key="channel-icon-url"
          :field-name="'channelIconURL'"
          @file-change="
            (input: FileChangeInput) => {
              handleImageChange(input);
            }
          "
        />
      </template>
    </FormRow>
    <FormRow section-title="Forum Banner">
      <template #content>
        <img
          v-if="formValues.channelBannerURL"
          :alt="formValues.uniqueName"
          class="w-full shadow-sm"
          :src="formValues.channelBannerURL"
        >
        <AddImage
          key="channel-banner-url"
          :field-name="'channelBannerURL'"
          @file-change="
            (input: FileChangeInput) => {
              handleImageChange(input);
            }
          "
        />
      </template>
    </FormRow>
    <FormRow
      :dangerous="true"
      section-title="Destructive Settings"
    >
      <template #content>
        <div class="align-items mt-4 flex gap-2">
          <CheckBox
            :checked="formValues.locked"
            :test-id="'lock-forum-checkbox'"
            @update="$emit('updateFormValues', { locked: $event })"
          />
          <label
            class="text-sm text-gray-600 dark:text-gray-400"
            for="lock-forum-checkbox"
            >Lock Forum</label
          >
        </div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Locking a forum will prevent users from creating new threads or replying to existing
          threads.
        </p>
      </template>
    </FormRow>
  </div>
</template>
