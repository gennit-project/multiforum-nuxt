import type { CreateEditEventFormValues } from '@/types/Event';

/**
 * Map a loaded event into the edit form's values. Extracted from
 * events/edit/[eventId].vue so the field mapping (tags, channels, and the many
 * optional fields with their defaults) is unit-testable.
 */

export type EventEditSource = {
  title?: string | null;
  description?: string | null;
  Tags?: { text: string }[] | null;
  EventChannels?: { channelUniqueName?: string | null }[] | null;
  address?: string | null;
  locationName?: string | null;
  isInPrivateResidence?: boolean | null;
  virtualEventUrl?: string | null;
  startTime?: string | null;
  startTimeDayOfWeek?: string | null;
  startTimeHourOfDay?: number | null;
  endTime?: string | null;
  canceled?: boolean | null;
  deleted?: boolean | null;
  cost?: string | null;
  free?: boolean | null;
  isHostedByOP?: boolean | null;
  isAllDay?: boolean | null;
  coverImageURL?: string | null;
};

export function buildEventEditFormValues(
  eventData: EventEditSource
): CreateEditEventFormValues {
  return {
    title: eventData.title ?? '',
    description: eventData.description || '',
    selectedTags: (eventData.Tags || []).map((tag) => tag.text),
    selectedChannels: (eventData.EventChannels || []).map(
      (ec) => ec.channelUniqueName ?? ''
    ),
    address: eventData.address || '',
    locationName: eventData.locationName || '',
    isInPrivateResidence: eventData.isInPrivateResidence || false,
    virtualEventUrl: eventData.virtualEventUrl || '',
    startTime: eventData.startTime ?? '',
    startTimeDayOfWeek: eventData.startTimeDayOfWeek || '',
    startTimeHourOfDay: eventData.startTimeHourOfDay || 0,
    endTime: eventData.endTime ?? '',
    canceled: eventData.canceled ?? false,
    deleted: eventData.deleted || false,
    cost: eventData.cost || '',
    free: eventData.free || false,
    isHostedByOP: eventData.isHostedByOP || false,
    isAllDay: eventData.isAllDay || false,
    coverImageURL: eventData.coverImageURL || '',
    // Multi-date / recurring event fields
    dateMode: 'single',
    occurrences: [],
    dateRangeGroups: [],
    repeatPattern: undefined,
  };
}
