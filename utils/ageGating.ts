const AGE_ERROR_MESSAGES: Record<string, string> = {
  BIRTHDAY_ALREADY_SET:
    'Your birthday has already been set and cannot be changed.',
  BIRTHDAY_REQUIRED: 'Birthday is required.',
  INVALID_BIRTHDAY: 'Enter a valid birthday.',
  MINIMUM_AGE_NOT_MET:
    'You do not meet this server’s minimum age requirement for an account.',
};

export function getAgeErrorMessage(errorMessage?: string): string {
  if (!errorMessage) return '';

  const code = Object.keys(AGE_ERROR_MESSAGES).find((candidate) =>
    errorMessage.includes(candidate)
  );
  return code ? (AGE_ERROR_MESSAGES[code] ?? errorMessage) : errorMessage;
}
