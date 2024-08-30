<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { ApolloError } from '@apollo/client/errors';
import { useRoute } from 'vue-router';
import { useMutation, useQuery } from '@vue/apollo-composable';
import TextInput from '@/components/forms/TextInput.vue';
import FormRow from '@/components/forms/FormRow.vue';
import TextEditor from '@/components/forms/TextEditor.vue';
import AddImage from '@/components/buttons/AddImage.vue';
import { getUploadFileName, uploadAndGetEmbeddedLink } from '@/utils';
import { CREATE_SIGNED_STORAGE_URL } from '@/graphQLData/discussion/mutations';
import { GET_LOCAL_USERNAME } from '@/graphQLData/user/queries';
import type { EditAccountSettingsFormValues } from '@/src/types/userTypes';

// Props
defineProps({
  formValues: {
    type: Object as PropType<EditAccountSettingsFormValues | null>,
    required: true,
  },
  getUserError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateUserError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  userLoading: {
    type: Boolean,
    default: false,
  },
});

// Emit
const emit = defineEmits(['updateFormValues', 'submit']);

// Data and Setup
const route = useRoute();
const titleInputRef = ref<InstanceType<typeof TextInput> | null>(null);
const touched = ref(false);

const usernameInParams = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});

const { mutate: createSignedStorageUrl } = useMutation(CREATE_SIGNED_STORAGE_URL);
const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

const username = computed(() => {
  return localUsernameResult.value?.username || '';
});

// Methods
const upload = async (file: any) => {
  if (!username.value) {
    console.error('No username found');
    return;
  }

  try {
    const filename = getUploadFileName({ username: username.value, file });
    const signedUrlResult = await createSignedStorageUrl({
      filename,
      contentType: file.type,
    });

    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    const embeddedLink = await uploadAndGetEmbeddedLink({
      file,
      filename,
      signedStorageURL,
    });

    return embeddedLink;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

const handleProfilePicChange = async (event: any) => {
  const selectedFile = event.target.files[0];

  if (selectedFile) {
    const embeddedLink = await upload(selectedFile);

    if (!embeddedLink) {
      return;
    }

    emit('updateFormValues', { profilePicURL: embeddedLink });
    emit('submit');
  }
};

// Focus the input on creation
nextTick(() => {
  if (titleInputRef.value) {
    titleInputRef.value?.$el?.children[0].childNodes[0].focus();
  }
});
</script>

<template>
  <v-container fluid class="max-w-4xl p-0">
    <div v-if="userLoading">Loading...</div>
    <div v-else-if="getUserError">
      <div v-for="(error, i) of getUserError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <TailwindForm
      v-else-if="formValues"
      :form-title="'Edit Account Settings'"
      :needs-changes="false"
      :show-cancel-button="false"
      @input="touched = true"
      @submit="emit('submit')"
    >
      <div class="space-y-8 divide-y divide-gray-200">
        <div class="space-y-4">
          <FormRow section-title="Username">
            <template #content>
              <TextInput
                ref="titleInputRef"
                :test-id="'username-input'"
                :disabled="true"
                :value="usernameInParams"
                :placeholder="'Add unique name'"
                :full-width="true"
              />
            </template>
          </FormRow>
          <FormRow section-title="Display Name" :required="false">
            <template #content>
              <TextInput
                ref="displayNameInputRef"
                :test-id="'display-name-input'"
                :value="formValues.displayName"
                :placeholder="'Add a more human readable display name'"
                :full-width="true"
                @update="emit('updateFormValues', { displayName: $event })"
              />
            </template>
          </FormRow>
          <FormRow section-title="Bio">
            <template #content>
              <TextEditor
                id="editExistingComment"
                class="mb-2 mt-3 p-1"
                :initial-value="formValues.bio || ''"
                :editor-id="'bio-input'"
                :rows="6"
                :allow-image-upload="false"
                @update="emit('updateFormValues', { bio: $event })"
              />
            </template>
          </FormRow>
          <FormRow section-title="Profile Picture">
            <template #content>
              <Avatar
                class="shadow-sm"
                :src="formValues.profilePicURL"
                :text="username"
                :is-square="false"
                :is-large="true"
              />
              <AddImage @change="handleProfilePicChange" />
            </template>
          </FormRow>
        </div>
      </div>
    </TailwindForm>
    <div v-for="(error, i) of getUserError?.graphQLErrors" :key="i">
      {{ error.message }}
    </div>
    <div v-for="(error, i) of updateUserError?.graphQLErrors" :key="i">
      {{ error.message }}
    </div>
  </v-container>
</template>
