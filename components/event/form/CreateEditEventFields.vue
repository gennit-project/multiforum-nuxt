<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import type { ApolloError } from '@apollo/client/errors';
import FormRow from '@/components/FormRow.vue';
import LocationIcon from '@/components/icons/LocationIcon.vue';
import TextInput from '@/components/TextInput.vue';
import ErrorMessage from '@/components/ErrorMessage.vue';
import CheckBox from '@/components/CheckBox.vue';
import LocationSearchBar from '@/components/event/list/filters/LocationSearchBar.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import type { CreateEditEventFormValues } from '@/types/Event';
import { checkUrl } from '@/utils';
import EventCoverImageField from '@/components/event/form/EventCoverImageField.vue';
import EventScheduleFields from '@/components/event/form/EventScheduleFields.vue';
import ForumPicker from '@/components/channel/ForumPicker.vue';
import TagPicker from '@/components/TagPicker.vue';
import {
  EVENT_TITLE_CHAR_LIMIT,
  MAX_CHARS_IN_EVENT_DESCRIPTION,
} from '@/utils/constants';
import {
  eventFormNeedsChanges,
  getEventFormValidationMessage,
} from '@/utils/eventFormValidation';
import type { PropType } from 'vue';

// Props and Emits
const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  createEventError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  submitError: {
    type: String,
    default: null,
  },
  createEventLoading: {
    type: Boolean,
    default: false,
  },
  formValues: {
    type: Object as PropType<CreateEditEventFormValues>,
    required: true,
  },
  getEventError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateEventError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  eventLoading: {
    type: Boolean,
    default: false,
  },
  updateEventLoading: {
    type: Boolean,
    default: false,
  },
  suspensionIssueNumber: {
    type: Number,
    default: null,
  },
  suspensionChannelId: {
    type: String,
    default: '',
  },
  suspensionUntil: {
    type: String,
    default: null,
  },
  suspensionIndefinitely: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'updateFormValues',
  'setSelectedChannels',
  'submit',
  'file-change',
]);

// Event type options for the dropdown
const eventTypeOptions = [
  { label: 'In-Person', value: 'in-person' },
  { label: 'Virtual', value: 'virtual' },
  { label: 'Hybrid', value: 'hybrid' },
];

// State for currently selected event type (purely for UI)
// Initialize from existing formValues.eventType if available
const selectedEventType = ref(props.formValues.eventType || 'in-person');

const showCreateEventError = computed(() => {
  return !(
    props.createEventError &&
    props.suspensionIssueNumber &&
    props.suspensionChannelId
  );
});

// Function to update event type selection
const updateEventType = (type: string) => {
  selectedEventType.value = type;
};

export type UpdateLocationInput = {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
};

const eventFormValidationInput = computed(() => ({
  selectedChannelsCount: props.formValues.selectedChannels.length,
  title: props.formValues.title,
  description: props.formValues.description,
  virtualEventUrl: props.formValues.virtualEventUrl,
  urlIsValid: urlIsValid.value,
  startBeforeEnd:
    new Date(props.formValues.startTime) < new Date(props.formValues.endTime),
}));

const needsChanges = computed(() =>
  eventFormNeedsChanges(eventFormValidationInput.value)
);

const changesRequiredMessage = computed(() =>
  getEventFormValidationMessage(eventFormValidationInput.value)
);

const urlIsValid = computed(() => {
  return checkUrl(props.formValues.virtualEventUrl || '');
});

const titleInputRef = ref<InstanceType<typeof TextInput> | null>(null);

nextTick(() => {
  if (titleInputRef.value) {
    (
      titleInputRef.value?.$el?.children?.[0].childNodes[0] as HTMLInputElement
    ).focus();
  }
});

const toggleCostField = () => {
  // Just toggle the free flag but keep cost details
  emit('updateFormValues', { free: !props.formValues.free });
};

const toggleHostedByOPField = () => {
  emit('updateFormValues', { isHostedByOP: !props.formValues.isHostedByOP });
};

const handleUpdateLocation = (event: UpdateLocationInput) => {
  emit('updateFormValues', {
    locationName: event.name,
    address: event.formatted_address,
    latitude: event.lat,
    longitude: event.lng,
  });
};

const touched = ref(false);
</script>

<template>
  <div class="mx-auto max-w-3xl px-2 pt-0 dark:text-white sm:px-6">
    <div v-if="eventLoading">Loading...</div>
    <div v-else-if="getEventError">
      <div v-for="(error, i) of getEventError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <FormComponent
      v-else-if="formValues"
      class="w-full"
      data-testid="event-form"
      :form-title="editMode ? 'Edit Event' : 'Create Event'"
      :needs-changes="needsChanges"
      :loading="createEventLoading || updateEventLoading"
      @input="touched = true"
      @submit="emit('submit')"
    >
      <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Share an event with your community.
      </div>
      <div class="w-full space-y-5">
        <FormRow :required="true" class="mt-6">
          <template #content>
            <TextInput
              ref="titleInputRef"
              :test-id="'title-input'"
              :value="formValues.title"
              :full-width="true"
              :placeholder="'Add title'"
              @update="emit('updateFormValues', { title: $event })"
            />
            <CharCounter
              test-id="title-char-counter"
              :current="formValues.title?.length || 0"
              :max="EVENT_TITLE_CHAR_LIMIT"
            />
          </template>
        </FormRow>

        <FormRow>
          <template #content>
            <EventScheduleFields
              :form-values="formValues"
              @update-form-values="
                (updates) => emit('updateFormValues', updates)
              "
            />
          </template>
        </FormRow>
        <FormRow :required="true">
          <template #content>
            <ForumPicker
              :test-id="'channel-input'"
              :selected-channels="formValues.selectedChannels"
              :description="'Select forums to submit to'"
              :channel-where="{ eventsEnabled: true }"
              :required-enabled-channel-flags="['eventsEnabled']"
              @set-selected-channels="
                emit('updateFormValues', { selectedChannels: $event })
              "
            />
          </template>
        </FormRow>
        <FormRow :required="true">
          <template #content>
            <fieldset>
              <legend class="sr-only">Event type</legend>
              <div
                class="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-gray-600"
                role="radiogroup"
                aria-label="Event type"
              >
                <label
                  v-for="option in eventTypeOptions"
                  :key="option.value"
                  :class="[
                    'cursor-pointer rounded-md px-4 py-2 transition-colors',
                    selectedEventType === option.value
                      ? 'bg-orange-500 text-black'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
                  ]"
                  :data-testid="`event-type-option-${option.value}`"
                >
                  <input
                    type="radio"
                    name="event-type"
                    :value="option.value"
                    :checked="selectedEventType === option.value"
                    class="sr-only"
                    @change="updateEventType(option.value)"
                  >
                  {{ option.label }}
                </label>
              </div>
            </fieldset>
          </template>
        </FormRow>
        <FormRow
          v-if="
            selectedEventType === 'virtual' || selectedEventType === 'hybrid'
          "
        >
          <template #content>
            <TextInput
              id="virtualEventUrl"
              :test-id="'link-input'"
              :full-width="true"
              :value="formValues.virtualEventUrl"
              :placeholder="'Add a link to your event'"
              @update="
                emit('updateFormValues', {
                  virtualEventUrl: $event,
                })
              "
            />
            <ErrorMessage
              :text="
                touched &&
                formValues.virtualEventUrl &&
                formValues.virtualEventUrl.length > 0 &&
                !urlIsValid
                  ? 'Must be a valid URL that starts with https'
                  : ''
              "
            />
          </template>
        </FormRow>
        <FormRow
          v-if="
            selectedEventType === 'in-person' || selectedEventType === 'hybrid'
          "
          :description="'Events with an address can appear in search results by location.'"
        >
          <template #icon>
            <LocationIcon class="float-right h-6 w-6" />
          </template>
          <template #content>
            <LocationSearchBar
              data-testid="location-input"
              :initial-value="formValues.address"
              :search-placeholder="'Add an address'"
              :full-width="true"
              @update-location-input="handleUpdateLocation"
            />
          </template>
        </FormRow>
        <FormRow>
          <template #content>
            <TextEditor
              :test-id="'description-input'"
              class="mb-3"
              :disable-auto-focus="true"
              :initial-value="formValues.description"
              :placeholder="'Add details'"
              :field-name="'description'"
              :rows="6"
              @update="emit('updateFormValues', { description: $event })"
            />
            <CharCounter
              test-id="description-char-counter"
              :current="formValues.description?.length || 0"
              :max="MAX_CHARS_IN_EVENT_DESCRIPTION"
            />
          </template>
        </FormRow>
        <FormRow>
          <template #content>
            <EventCoverImageField
              :image-url="formValues.coverImageURL"
              @update="
                (url) => emit('updateFormValues', { coverImageURL: url })
              "
            />
          </template>
        </FormRow>
        <FormRow>
          <template #content>
            <TagPicker
              data-testid="tag-input"
              :selected-tags="formValues.selectedTags"
              @set-selected-tags="
                emit('updateFormValues', { selectedTags: $event })
              "
            />
          </template>
        </FormRow>
        <FormRow>
          <template #content>
            <CheckBox
              test-id="free-input"
              :checked="Boolean(formValues.free)"
              label="This event is free"
              @update="toggleCostField"
            />
            <div class="mt-3">
              <TextEditor
                data-testid="cost-input"
                :initial-value="formValues.cost"
                :disable-auto-focus="true"
                :allow-image-upload="false"
                :field-name="'cost'"
                :rows="3"
                :placeholder="'Add cost details (optional)'"
                @update="emit('updateFormValues', { cost: $event })"
              />
            </div>
          </template>
        </FormRow>
        <FormRow>
          <template #content>
            <CheckBox
              test-id="hosted-by-op-input"
              :checked="formValues.isHostedByOP"
              label="I am hosting this event"
              @update="toggleHostedByOPField"
            />
          </template>
        </FormRow>
      </div>
      <ErrorBanner
        v-if="needsChanges && touched"
        :text="changesRequiredMessage"
      />
      <ErrorBanner v-if="submitError" :text="submitError" />
      <SuspensionNotice
        v-if="suspensionIssueNumber && suspensionChannelId"
        class="mt-2"
        :issue-number="suspensionIssueNumber"
        :channel-id="suspensionChannelId"
        :suspended-until="suspensionUntil"
        :suspended-indefinitely="suspensionIndefinitely"
        :message="'You are suspended in this forum and cannot create events.'"
      />
      <!-- Create Event Errors -->
      <div v-if="createEventError && showCreateEventError">
        <ErrorBanner
          v-if="createEventError.message"
          :text="createEventError.message"
        />
        <ErrorBanner
          v-for="(error, i) in createEventError.graphQLErrors"
          v-else-if="createEventError.graphQLErrors?.length"
          :key="`create-${i}`"
          :text="error.message"
        />
        <ErrorBanner
          v-else
          :text="'An error occurred while creating the event.'"
        />
      </div>

      <!-- Update Event Errors -->
      <div v-if="updateEventError">
        <ErrorBanner
          v-if="updateEventError.message"
          :text="updateEventError.message"
        />
        <ErrorBanner
          v-for="(error, i) in updateEventError.graphQLErrors"
          v-else-if="updateEventError.graphQLErrors?.length"
          :key="`update-${i}`"
          :text="error.message"
        />
        <ErrorBanner
          v-else
          :text="'An error occurred while updating the event.'"
        />
      </div>
    </FormComponent>
  </div>
</template>

<style lang="scss">
sl-input {
  border: 0 !important;
  padding: 0 !important;
  margin: 0, 0, 0, 0;
  border-color: orange;
  &::focus {
    border: 0 !important;
    outline: 0 !important;
  }
}
.sl-input::part(base):focus-visible {
  box-shadow: 0 0 0 3px rgba(7, 3, 255, 0.33);
}
.sl-input::part(input) {
  border: 0 !important;
  margin: 0, 0, 0, 0;
  font-family: 'Inter', sans-serif;
  color: #000000;
  border-color: orange;
  font-size: 0.875rem;
}

/* These styles have been moved to the individual components */
</style>
