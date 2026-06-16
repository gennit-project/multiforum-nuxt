import {
  DISCUSSION_TITLE_CHAR_LIMIT,
  MAX_CHARS_IN_DISCUSSION_BODY,
} from '@/utils/constants';

/**
 * Pure validation for the discussion create/edit form, extracted from
 * CreateEditDiscussionFields.
 */
export type DiscussionFormValidationInput = {
  selectedChannelsCount: number;
  title: string;
  body: string;
};

/** True when the form is NOT yet submittable. */
export function discussionFormNeedsChanges(
  input: DiscussionFormValidationInput
): boolean {
  const { selectedChannelsCount, title, body } = input;
  return !(
    selectedChannelsCount > 0 &&
    !!title &&
    body.length <= MAX_CHARS_IN_DISCUSSION_BODY &&
    title.length <= DISCUSSION_TITLE_CHAR_LIMIT
  );
}

/** The first applicable validation message, or '' when valid. */
export function getDiscussionFormValidationMessage(
  input: DiscussionFormValidationInput
): string {
  const { selectedChannelsCount, title, body } = input;
  if (!title) {
    return 'A title is required.';
  }
  if (selectedChannelsCount === 0) {
    return 'Must select at least one forum.';
  }
  if (body.length > MAX_CHARS_IN_DISCUSSION_BODY) {
    return `Body cannot exceed ${MAX_CHARS_IN_DISCUSSION_BODY} characters.`;
  }
  if (title.length > DISCUSSION_TITLE_CHAR_LIMIT) {
    return `Title cannot exceed ${DISCUSSION_TITLE_CHAR_LIMIT} characters.`;
  }
  return '';
}
