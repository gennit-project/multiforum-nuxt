import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRouter } from 'nuxt/app';
import {
  DeleteEventDocument as DELETE_EVENT,
  CancelEventDocument as CANCEL_EVENT,
  UpdateEventInSeriesDocument as UPDATE_EVENT_IN_SERIES,
  DeleteEventInSeriesDocument as DELETE_EVENT_IN_SERIES,
} from '@/__generated__/operations';
import type { EventEditScope } from '@/components/event/form/EditScopeModal.vue';
import { EventEditScope as EventEditScopeInput } from '@/__generated__/graphql';
const scopeInput = {
  THIS_ONLY: EventEditScopeInput.ThisOnly,
  THIS_AND_FUTURE: EventEditScopeInput.ThisAndFuture,
  ALL_IN_SERIES: EventEditScopeInput.AllInSeries,
};

type MaybeRef<T> = Ref<T> | ComputedRef<T>;

/**
 * Cancel/delete lifecycle for an event, including the standalone-event vs
 * event-series scoping. Owns the confirm/scope modal state, the four mutations
 * (delete, cancel, and their in-series variants) with their post-action
 * navigation/close side effects, and the combined error/loading for the modals.
 * Extracted from EventHeader.vue so this destructive-action flow is readable and
 * unit-testable on its own.
 */
export function useEventCancelDelete(params: {
  eventId: MaybeRef<string>;
  channelId: MaybeRef<string>;
  isPartOfSeries: MaybeRef<boolean>;
}) {
  const { eventId, channelId, isPartOfSeries } = params;
  const router = useRouter();

  const confirmDeleteIsOpen = ref(false);
  const confirmCancelIsOpen = ref(false);
  const showCancelScopeModal = ref(false);
  const showDeleteScopeModal = ref(false);

  let deleteContext = { eventId: eventId.value, channelId: channelId.value };
  let seriesDeleteContext = { ...deleteContext };

  const {
    mutate: deleteEvent,
    error: deleteEventError,
    loading: deleteEventLoading,
    onDone: onDoneDeleting,
  } = useMutation(DELETE_EVENT, () => {
    const targetId = eventId.value;
    deleteContext = { eventId: targetId, channelId: channelId.value };
    return {
      variables: { id: targetId },
      update: (cache) => {
        cache.modify({
          fields: {
            events(existingEventRefs = [], { readField }) {
              return existingEventRefs.filter(
                (ref: { __ref?: string }) => readField('id', ref) !== targetId
              );
            },
          },
        });
      },
    };
  });

  onDoneDeleting(() => {
    if (
      channelId.value &&
      eventId.value === deleteContext.eventId &&
      channelId.value === deleteContext.channelId
    ) {
      router.push({
        name: 'forums-forumId-events',
        params: { forumId: channelId.value },
      });
    }
  });

  const {
    mutate: cancelEvent,
    error: cancelEventError,
    loading: cancelEventLoading,
    onDone: onDoneCanceling,
  } = useMutation(CANCEL_EVENT, () => ({
    variables: {
      updateEventInput: { canceled: { set: true } },
      eventWhere: { id: { eq: eventId.value } },
      channelConnections: [],
      channelDisconnections: [],
    },
  }));

  onDoneCanceling(() => {
    confirmCancelIsOpen.value = false;
  });

  const {
    mutate: cancelEventInSeries,
    error: cancelEventInSeriesError,
    loading: cancelEventInSeriesLoading,
    onDone: onDoneCancelingInSeries,
  } = useMutation(UPDATE_EVENT_IN_SERIES);

  onDoneCancelingInSeries(() => {
    showCancelScopeModal.value = false;
  });

  const combinedCancelError = computed(
    () => cancelEventError.value || cancelEventInSeriesError.value
  );
  const combinedCancelLoading = computed(
    () => cancelEventLoading.value || cancelEventInSeriesLoading.value
  );

  // Show the scope modal for a series event, otherwise the plain confirm modal.
  function handleCancelClick() {
    if (isPartOfSeries.value) {
      showCancelScopeModal.value = true;
    } else {
      confirmCancelIsOpen.value = true;
    }
  }

  function handleCancelScopeConfirm(scope: EventEditScope) {
    cancelEventInSeries({
      eventId: eventId.value,
      scope: scopeInput[scope],
      eventUpdateInput: { canceled: { set: true } },
      channelConnections: [],
      channelDisconnections: [],
    });
  }

  const {
    mutate: deleteEventInSeriesMutation,
    error: deleteEventInSeriesError,
    loading: deleteEventInSeriesLoading,
    onDone: onDoneDeletingInSeries,
  } = useMutation(DELETE_EVENT_IN_SERIES);

  onDoneDeletingInSeries(() => {
    showDeleteScopeModal.value = false;
    if (
      channelId.value &&
      eventId.value === seriesDeleteContext.eventId &&
      channelId.value === seriesDeleteContext.channelId
    ) {
      router.push({
        name: 'forums-forumId-events',
        params: { forumId: channelId.value },
      });
    }
  });

  const combinedDeleteError = computed(
    () => deleteEventError.value || deleteEventInSeriesError.value
  );
  const combinedDeleteLoading = computed(
    () => deleteEventLoading.value || deleteEventInSeriesLoading.value
  );

  function handleDeleteClick() {
    if (isPartOfSeries.value) {
      showDeleteScopeModal.value = true;
    } else {
      confirmDeleteIsOpen.value = true;
    }
  }

  function handleDeleteScopeConfirm(scope: EventEditScope) {
    seriesDeleteContext = {
      eventId: eventId.value,
      channelId: channelId.value,
    };
    deleteEventInSeriesMutation({
      eventId: eventId.value,
      scope: scopeInput[scope],
    });
  }

  return {
    confirmDeleteIsOpen,
    confirmCancelIsOpen,
    showCancelScopeModal,
    showDeleteScopeModal,
    deleteEvent,
    cancelEvent,
    deleteEventError,
    cancelEventError,
    combinedCancelError,
    combinedCancelLoading,
    combinedDeleteError,
    combinedDeleteLoading,
    handleCancelClick,
    handleCancelScopeConfirm,
    handleDeleteClick,
    handleDeleteScopeConfirm,
  };
}
