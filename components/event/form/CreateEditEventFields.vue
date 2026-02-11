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
import DateTimePickersRow from './DateTimePickersRow.vue';
import type { CreateEditEventFormValues } from '@/types/Event';
import { DateTime } from 'luxon';
import {
  getDuration,
  getUploadFileName,
  uploadAndGetEmbeddedLink,
  checkUrl,
} from '@/utils';
import AddImage from '@/components/AddImage.vue';
import { useMutation } from '@vue/apollo-composable';
import { CREATE_SIGNED_STORAGE_URL } from '@/graphQLData/discussion/mutations';
import ForumPicker from '@/components/channel/ForumPicker.vue';
import TagPicker from '@/components/TagPicker.vue';
import { usernameVar } from '@/cache';
import {
  EVENT_TITLE_CHAR_LIMIT,
  MAX_CHARS_IN_EVENT_DESCRIPTION,
} from '@/utils/constants';
import type { PropType } from 'vue';
import { isFileSizeValid } from '@/utils/index';

type FileChangeInput = {
  // event of HTMLInputElement;
  event: Event;
  fieldName: string;
};
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

// Function to update event type selection
const updateEventType = (type: string) => {
  selectedEventType.value = type;
};

// Track if the event spans multiple days
const isMultiDayEvent = ref(false);

// Check if start and end dates are different
const initializeMultiDayState = () => {
  const startDateTime = DateTime.fromISO(props.formValues.startTime);
  const endDateTime = DateTime.fromISO(props.formValues.endTime);

  // If the dates are the same, it's a single-day event
  // If they're different, it's a multi-day event
  isMultiDayEvent.value = !startDateTime.hasSame(endDateTime, 'day');
};

// Initialize multi-day state when component mounts
initializeMultiDayState();

export type UpdateLocationInput = {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
};

const startTime = computed(() => {
  return new Date(props.formValues.startTime);
});
const endTime = computed(() => {
  return new Date(props.formValues.endTime);
});

const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);

// Computed Properties
const datePickerErrorMessage = computed(() => {
  if (startTime.value < new Date()) {
    return 'Are you sure you want the start time to be in the past?';
  }
  if (startTime.value >= endTime.value) {
    return 'The start time must be before the end time.';
  }
  return '';
});

const duration = computed(() => {
  return getDuration(
    startTime.value.toISOString(),
    endTime.value.toISOString()
  );
});

const needsChanges = computed(() => {
  const hasValidVirtualEventUrl = props.formValues.virtualEventUrl
    ? urlIsValid.value && !!props.formValues.virtualEventUrl
    : true;

  return !(
    props.formValues.selectedChannels.length > 0 &&
    props.formValues.title.length > 0 &&
    startTime.value < endTime.value &&
    props.formValues.title.length <= EVENT_TITLE_CHAR_LIMIT &&
    props.formValues.description.length <= MAX_CHARS_IN_EVENT_DESCRIPTION &&
    (urlIsValid.value || !props.formValues.virtualEventUrl) &&
    hasValidVirtualEventUrl
  );
});

const changesRequiredMessage = computed(() => {
  if (props.formValues.selectedChannels.length === 0) {
    return 'At least one channel must be selected.';
  }
  if (!props.formValues.title) {
    return 'A title is required.';
  }
  if (props.formValues.title.length > EVENT_TITLE_CHAR_LIMIT) {
    return `Title cannot exceed ${EVENT_TITLE_CHAR_LIMIT} characters.`;
  }
  if (props.formValues.description.length > MAX_CHARS_IN_EVENT_DESCRIPTION) {
    return `Description cannot exceed ${MAX_CHARS_IN_EVENT_DESCRIPTION} characters.`;
  }
  if (props.formValues.virtualEventUrl && !urlIsValid.value) {
    return 'Virtual event URL must be valid.';
  }
  return '';
});

const urlIsValid = computed(() => {
  return checkUrl(props.formValues.virtualEventUrl || '');
});

const titleInputRef = ref<InstanceType<typeof TextInput> | null>(null);

nextTick(() => {
  if (titleInputRef.value) {
    (
      titleInputRef.value?.$el?.children[0].childNodes[0] as HTMLInputElement
    ).focus();
  }
});

const handleStartTimeTimeChange = (dateTimeValue: string) => {
  if (!dateTimeValue) return;

  try {
    // Create DateTime object directly from the time string
    const currentDate = DateTime.fromJSDate(startTime.value);
    const startTimeObject = DateTime.fromFormat(dateTimeValue, 'HH:mm', {
      zone: currentDate.zone,
    }).set({
      year: currentDate.year,
      month: currentDate.month,
      day: currentDate.day,
    });

    if (startTimeObject.isValid) {
      emit('updateFormValues', { startTime: startTimeObject.toISO() });
    }
  } catch (error) {
    console.warn('Invalid time input:', dateTimeValue, error);
  }
};

const handleEndTimeTimeChange = (dateTimeValue: string) => {
  if (!dateTimeValue) return;

  try {
    const currentDate = DateTime.fromJSDate(endTime.value);
    const endTimeObject = DateTime.fromFormat(dateTimeValue, 'HH:mm', {
      zone: currentDate.zone,
    }).set({
      year: currentDate.year,
      month: currentDate.month,
      day: currentDate.day,
    });

    if (endTimeObject.isValid) {
      emit('updateFormValues', { endTime: endTimeObject.toISO() });
    }
  } catch (error) {
    console.warn('Invalid time input:', dateTimeValue, error);
  }
};

const handleStartTimeDateChange = (dateTimeValue: string) => {
  if (!dateTimeValue) return;

  try {
    const currentDate = DateTime.fromJSDate(startTime.value);
    const inputDateTime = DateTime.fromISO(dateTimeValue);

    if (!inputDateTime.isValid) return;

    const startTimeObject = currentDate.set({
      year: inputDateTime.year,
      month: inputDateTime.month,
      day: inputDateTime.day,
    });

    if (startTimeObject.isValid) {
      // Update start time
      const updates: Partial<CreateEditEventFormValues> = {
        startTime: startTimeObject.toISO(),
      };

      // If not a multi-day event, also update the end date to match the start date
      if (!isMultiDayEvent.value) {
        const currentEndTime = DateTime.fromJSDate(endTime.value);
        const newEndTime = currentEndTime.set({
          year: inputDateTime.year,
          month: inputDateTime.month,
          day: inputDateTime.day,
        });

        if (newEndTime.isValid) {
          updates.endTime = newEndTime.toISO();
        }
      }

      emit('updateFormValues', updates);
    }
  } catch (error) {
    console.warn('Invalid date input:', dateTimeValue, error);
  }
};

const handleEndTimeDateChange = (dateTimeValue: string) => {
  if (!dateTimeValue) return;

  try {
    const currentDate = DateTime.fromJSDate(endTime.value);
    const inputDateTime = DateTime.fromISO(dateTimeValue);

    if (!inputDateTime.isValid) return;

    const endTimeObject = currentDate.set({
      year: inputDateTime.year,
      month: inputDateTime.month,
      day: inputDateTime.day,
    });

    if (endTimeObject.isValid) {
      const startDateTime = DateTime.fromJSDate(startTime.value);

      // If end date is different from start date, update multi-day status
      isMultiDayEvent.value = !startDateTime.hasSame(endTimeObject, 'day');

      emit('updateFormValues', { endTime: endTimeObject.toISO() });
    }
  } catch (error) {
    console.warn('Invalid date input:', dateTimeValue, error);
  }
};

const toggleCostField = () => {
  // Just toggle the free flag but keep cost details
  emit('updateFormValues', { free: !props.formValues.free });
};

const toggleHostedByOPField = () => {
  emit('updateFormValues', { isHostedByOP: !props.formValues.isHostedByOP });
};

const toggleIsAllDayField = () => {
  // Toggle the isAllDay flag
  const newAllDayValue = !props.formValues.isAllDay;
  emit('updateFormValues', { isAllDay: newAllDayValue });

  // If switching to All Day, set times to the full day
  if (newAllDayValue) {
    const startDate = DateTime.fromISO(props.formValues.startTime);
    const endDate = isMultiDayEvent.value
      ? DateTime.fromISO(props.formValues.endTime)
      : startDate; // Use same date if not multi-day

    const newStartTime = startDate.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    const newEndTime = endDate.set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });

    emit('updateFormValues', {
      startTime: newStartTime.toISO(),
      endTime: newEndTime.toISO(),
    });
  }
};

const toggleMultiDayEvent = () => {
  isMultiDayEvent.value = !isMultiDayEvent.value;

  // If switching to single-day event, update end date to match start date
  if (!isMultiDayEvent.value) {
    const startDateTime = DateTime.fromJSDate(startTime.value);
    const currentEndTime = DateTime.fromJSDate(endTime.value);

    // Keep the same time but set date to match start date
    const newEndTime = currentEndTime.set({
      year: startDateTime.year,
      month: startDateTime.month,
      day: startDateTime.day,
    });

    emit('updateFormValues', { endTime: newEndTime.toISO() });
  }
};

const handleUpdateLocation = (event: UpdateLocationInput) => {
  emit('updateFormValues', {
    locationName: event.name,
    address: event.formatted_address,
    latitude: event.lat,
    longitude: event.lng,
  });
};

const upload = async (file: any) => {
  if (!usernameVar.value) {
    console.error('No username found');
    return;
  }
  const sizeCheck = isFileSizeValid({ file });
  if (!sizeCheck.valid) {
    alert(sizeCheck.message);
    return;
  }
  try {
    const filename = getUploadFileName({ username: usernameVar.value, file });
    const signedUrlResult = await createSignedStorageUrl({
      filename,
      contentType: file.type,
    });

    const signedStorageURL =
      signedUrlResult?.data?.createSignedStorageURL?.url || '';
    const embeddedLink = uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType: file.type,
      signedStorageURL,
    });

    return embeddedLink;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

const coverImageLoading = ref(false);

const handleCoverImageChange = async (input: FileChangeInput) => {
  if (!input.event || !input.event.target) {
    return;
  }
  const { event, fieldName } = input;
  const target = event?.target as HTMLInputElement;
  if (!target.files || !target.files[0]) {
    return;
  }
  const selectedFile = target.files[0];

  if (fieldName === 'coverImageURL' && selectedFile) {
    coverImageLoading.value = true;
    const embeddedLink = await upload(selectedFile);

    if (!embeddedLink) {
      return;
    }
    emit('updateFormValues', { coverImageURL: embeddedLink });
    coverImageLoading.value = false;
  }
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
            <div class="flex flex-col dark:text-white">
              <DateTimePickersRow
                :is-all-day="formValues.isAllDay"
                :is-multi-day="isMultiDayEvent"
                :start-time="startTime"
                :end-time="endTime"
                @update-start-date="handleStartTimeDateChange"
                @update-start-time="handleStartTimeTimeChange"
                @update-end-date="handleEndTimeDateChange"
                @update-end-time="handleEndTimeTimeChange"
              />

              <!-- Duration Display -->
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Duration: {{ duration }}
              </div>

              <!-- Checkboxes for event options -->
              <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <!-- All-day checkbox -->
                <CheckBox
                  test-id="all-day-input"
                  :checked="formValues.isAllDay"
                  label="All day"
                  @update="toggleIsAllDayField"
                />

                <!-- Multi-day checkbox -->
                <CheckBox
                  test-id="multi-day-input"
                  :checked="isMultiDayEvent"
                  label="Multi-day event"
                  @update="toggleMultiDayEvent"
                />
              </div>

              <ErrorMessage :text="datePickerErrorMessage" class="mt-1" />
            </div>
          </template>
        </FormRow>
        <FormRow :required="true">
          <template #content>
            <ForumPicker
              :test-id="'channel-input'"
              :selected-channels="formValues.selectedChannels"
              :description="'Select forums to submit to'"
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
            <div v-if="formValues.coverImageURL" class="mb-3">
              <div
                class="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-600"
              >
                <img
                  alt="Cover Image"
                  :src="formValues.coverImageURL"
                  class="h-auto max-h-64 w-full object-cover"
                >

                <!-- Image overlay when loading -->
                <div
                  v-if="coverImageLoading"
                  class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
                >
                  <div class="flex flex-col items-center text-white">
                    <div class="h-8 w-8 text-white">
                      <svg
                        class="h-8 w-8 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke-dasharray="42"
                          stroke-dashoffset="12"
                          stroke-linecap="round"
                        />
                      </svg>
                    </div>
                    <span class="mt-2">Uploading image...</span>
                  </div>
                </div>
              </div>

              <!-- Image actions for when an image exists -->
              <div class="mt-2 flex space-x-2">
                <AddImage
                  key="cover-image-replace"
                  field-name="coverImageURL"
                  label="Replace Image"
                  :disabled="coverImageLoading"
                  @file-change="handleCoverImageChange"
                />

                <button
                  type="button"
                  class="flex items-center text-sm text-red-500 hover:underline"
                  :disabled="coverImageLoading"
                  :class="{
                    'cursor-not-allowed opacity-60': coverImageLoading,
                  }"
                  @click="emit('updateFormValues', { coverImageURL: '' })"
                >
                  <i class="fa fa-trash-can mr-2" /> Remove Image
                </button>
              </div>
            </div>

            <div
              v-else-if="coverImageLoading"
              class="bg-gray-50 mb-3 rounded-md border border-gray-200 p-6 dark:border-gray-600 dark:bg-gray-700"
            >
              <div
                class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-300"
              >
                <div class="h-8 w-8">
                  <svg
                    class="h-8 w-8 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke-dasharray="42"
                      stroke-dashoffset="12"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>
                <span>Uploading image...</span>
              </div>
            </div>

            <div v-else class="mb-3">
              <div
                class="bg-gray-50 rounded-md border border-dashed border-gray-300 p-8 text-center dark:border-gray-600 dark:bg-gray-800"
              >
                <i
                  class="fa fa-image mb-3 text-3xl text-gray-400 dark:text-gray-500"
                />
                <span
                  class="mb-3 block text-sm text-gray-500 dark:text-gray-400"
                >
                  No cover image uploaded
                </span>
                <div class="mt-2">
                  <AddImage
                    key="cover-image-url"
                    field-name="coverImageURL"
                    label="Add Cover Image"
                    :disabled="coverImageLoading"
                    @file-change="handleCoverImageChange"
                  />
                </div>
              </div>
            </div>
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
      <div v-if="createEventError">
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
