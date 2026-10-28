type SignupDraft = { username: string; birthday: string };
const key = (email: string) => `signup-draft:${email}`;
export const readSignupDraft = (email: string): SignupDraft | null => {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key(email)) || 'null');
    return draft &&
      typeof draft.username === 'string' &&
      typeof draft.birthday === 'string'
      ? {
          username: draft.username.slice(0, 50),
          birthday: draft.birthday.slice(0, 10),
        }
      : null;
  } catch {
    return null;
  }
};
export const saveSignupDraft = (email: string, draft: SignupDraft) => {
  try {
    sessionStorage.setItem(key(email), JSON.stringify(draft));
  } catch {
    /* Storage may be blocked. */
  }
};
export const clearSignupDraft = (email: string) => {
  try {
    sessionStorage.removeItem(key(email));
  } catch {
    /* Storage may be blocked. */
  }
};
