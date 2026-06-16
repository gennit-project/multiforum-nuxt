import {
  EVENT_TITLE_CHAR_LIMIT,
  MAX_CHARS_IN_EVENT_DESCRIPTION,
} from '@/utils/constants';

/**
 * Pure validation for the event create/edit form, extracted from
 * CreateEditEventFields. The component still derives `urlIsValid` (via checkUrl)
 * and `startBeforeEnd` from its date pickers and passes them in.
 */
export type EventFormValidationInput = {
  selectedChannelsCount: number;
  title: string;
  description: string;
  virtualEventUrl?: string | null;
  urlIsValid: boolean;
  startBeforeEnd: boolean;
};

/** True when the form is NOT yet submittable. */
export function eventFormNeedsChanges(
  input: EventFormValidationInput
): boolean {
  const {
    selectedChannelsCount,
    title,
    description,
    virtualEventUrl,
    urlIsValid,
    startBeforeEnd,
  } = input;

  const hasValidVirtualEventUrl = virtualEventUrl
    ? urlIsValid && !!virtualEventUrl
    : true;

  return !(
    selectedChannelsCount > 0 &&
    title.length > 0 &&
    startBeforeEnd &&
    title.length <= EVENT_TITLE_CHAR_LIMIT &&
    description.length <= MAX_CHARS_IN_EVENT_DESCRIPTION &&
    (urlIsValid || !virtualEventUrl) &&
    hasValidVirtualEventUrl
  );
}

/** The first applicable validation message, or '' when valid. */
export function getEventFormValidationMessage(
  input: EventFormValidationInput
): string {
  const { selectedChannelsCount, title, description, virtualEventUrl, urlIsValid } =
    input;

  if (selectedChannelsCount === 0) {
    return 'At least one channel must be selected.';
  }
  if (!title) {
    return 'A title is required.';
  }
  if (title.length > EVENT_TITLE_CHAR_LIMIT) {
    return `Title cannot exceed ${EVENT_TITLE_CHAR_LIMIT} characters.`;
  }
  if (description.length > MAX_CHARS_IN_EVENT_DESCRIPTION) {
    return `Description cannot exceed ${MAX_CHARS_IN_EVENT_DESCRIPTION} characters.`;
  }
  if (virtualEventUrl && !urlIsValid) {
    return 'Virtual event URL must be valid.';
  }
  return '';
}
