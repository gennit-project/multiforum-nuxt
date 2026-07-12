import { describe, it, expect, afterEach } from 'vitest';

import { moveFocusToMain } from '@/utils/routeFocus';

const setup = (html: string) => {
  document.body.innerHTML = html;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('moveFocusToMain', () => {
  it('moves focus to the main content region', () => {
    setup(`
      <a id="link" href="#">nav link</a>
      <main id="main-content" tabindex="-1"><h1>Page</h1></main>
    `);
    document.getElementById('link')!.focus();

    moveFocusToMain(document);

    expect(document.activeElement).toBe(document.getElementById('main-content'));
  });

  it('returns true when it moved focus', () => {
    setup('<main id="main-content" tabindex="-1"></main>');

    expect(moveFocusToMain(document)).toBe(true);
  });

  it('does nothing when there is no main region', () => {
    setup('<a id="link" href="#">nav link</a>');
    document.getElementById('link')!.focus();

    expect(moveFocusToMain(document)).toBe(false);
  });

  it('does not override focus already inside the main region', () => {
    setup(`
      <main id="main-content" tabindex="-1">
        <input id="page-input" />
      </main>
    `);
    document.getElementById('page-input')!.focus();

    const moved = moveFocusToMain(document);

    expect({
      moved,
      active: document.activeElement?.id,
    }).toEqual({ moved: false, active: 'page-input' });
  });
});
