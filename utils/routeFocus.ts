/**
 * Move keyboard focus to the page's main content region after a client-side
 * route change. Nuxt's route announcer tells screen-reader users the page
 * changed, but focus otherwise stays on the link that was activated (often now
 * detached), leaving keyboard users stranded. Moving focus to `<main>` puts them
 * at the start of the new page's content.
 *
 * No-op (returns false) if there is no main region, or if the destination page
 * already placed focus inside main (so page-managed focus is never overridden).
 */
export function moveFocusToMain(doc: Document = document): boolean {
  const main = doc.getElementById('main-content');
  if (!main) return false;
  if (main.contains(doc.activeElement)) return false;
  main.focus();
  return true;
}
