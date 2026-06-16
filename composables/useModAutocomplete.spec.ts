import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick, reactive } from 'vue';
import { useModAutocomplete } from './useModAutocomplete';
import type { ModSuggestion } from '@/utils/modMentions';

const makeSuggestion = (value: string): ModSuggestion => ({
  value,
  label: value,
  mention: `/m/${value}`,
  displayName: value,
  username: value,
});

type State = {
  text: string;
  cursorIndex: number;
  enabled: boolean;
  suggestions: ModSuggestion[];
  smallScreen: boolean;
};

const setup = (
  overrides: Partial<State> & { editor?: HTMLTextAreaElement | null } = {}
) => {
  const { editor: initialEditor = null, ...stateOverrides } = overrides;
  // Reactive so the composable's computeds/watchers respond to mutations,
  // mirroring how the real component passes refs through these getters.
  const state = reactive<State>({
    text: '',
    cursorIndex: 0,
    enabled: true,
    suggestions: [],
    smallScreen: false,
    ...stateOverrides,
  });
  // The editor is a DOM node, kept out of the reactive proxy so its methods
  // (setSelectionRange/focus) operate on the real element.
  const editor: HTMLTextAreaElement | null = initialEditor;

  const onUpdate = vi.fn((next: string) => {
    state.text = next;
  });
  const onCursorUpdate = vi.fn((index: number) => {
    state.cursorIndex = index;
  });

  const composable = useModAutocomplete({
    getText: () => state.text,
    getCursorIndex: () => state.cursorIndex,
    isEnabled: () => state.enabled,
    getModSuggestions: () => state.suggestions,
    getEditorRef: () => editor,
    getIsSmallScreen: () => state.smallScreen,
    onUpdate,
    onCursorUpdate,
  });

  return { state, composable, onUpdate, onCursorUpdate };
};

const makeEditor = (value: string, cursor: number): HTMLTextAreaElement => {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setSelectionRange(cursor, cursor);
  document.body.appendChild(textarea);
  return textarea;
};

describe('useModAutocomplete', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('mentionState', () => {
    it('is null when there is no trigger', () => {
      const { composable } = setup({ text: 'hello world', cursorIndex: 11 });
      expect(composable.mentionState.value).toBeNull();
    });

    it('returns the query when a /m/ trigger precedes the cursor', () => {
      const text = 'hey /m/ali';
      const { composable } = setup({ text, cursorIndex: text.length });
      expect(composable.mentionState.value?.query).toBe('ali');
    });

    it('returns the trigger index when a /m/ trigger precedes the cursor', () => {
      const text = 'hey /m/ali';
      const { composable } = setup({ text, cursorIndex: text.length });
      expect(composable.mentionState.value?.triggerIndex).toBe(4);
    });
  });

  describe('filteredModSuggestions', () => {
    it('is empty when disabled', () => {
      const text = '/m/a';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        enabled: false,
        suggestions: [makeSuggestion('alice')],
      });
      expect(composable.filteredModSuggestions.value).toEqual([]);
    });

    it('is empty when there are no suggestions', () => {
      const text = '/m/a';
      const { composable } = setup({ text, cursorIndex: text.length });
      expect(composable.filteredModSuggestions.value).toEqual([]);
    });

    it('is empty when there is no mention state', () => {
      const { composable } = setup({
        text: 'plain text',
        cursorIndex: 10,
        suggestions: [makeSuggestion('alice')],
      });
      expect(composable.filteredModSuggestions.value).toEqual([]);
    });

    it('filters suggestions by the current query', () => {
      const text = '/m/al';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [
          makeSuggestion('alice'),
          makeSuggestion('bob'),
          makeSuggestion('albert'),
        ],
      });
      expect(
        composable.filteredModSuggestions.value.map((s) => s.value)
      ).toEqual(['alice', 'albert']);
    });
  });

  describe('hasExactMatch', () => {
    it('is false when there is no query', () => {
      const text = '/m/';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice')],
      });
      expect(composable.hasExactMatch.value).toBe(false);
    });

    it('is true when the query exactly matches a suggestion', () => {
      const text = '/m/alice';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice')],
      });
      expect(composable.hasExactMatch.value).toBe(true);
    });
  });

  describe('showModSuggestions', () => {
    it('is true when enabled with suggestions and no exact match', () => {
      const text = '/m/al';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice')],
      });
      expect(composable.showModSuggestions.value).toBe(true);
    });

    it('is false when the query is an exact match', () => {
      const text = '/m/alice';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice')],
      });
      expect(composable.showModSuggestions.value).toBe(false);
    });
  });

  describe('showModHelperText', () => {
    it('is true when enabled and suggestions exist', () => {
      const { composable } = setup({ suggestions: [makeSuggestion('alice')] });
      expect(composable.showModHelperText.value).toBe(true);
    });

    it('is false when there are no suggestions', () => {
      const { composable } = setup();
      expect(composable.showModHelperText.value).toBe(false);
    });
  });

  describe('moveActiveSuggestion', () => {
    it('resets to 0 when there are no suggestions', () => {
      const { composable } = setup();
      composable.moveActiveSuggestion(1);
      expect(composable.activeSuggestionIndex.value).toBe(0);
    });

    it('moves the index forward within bounds', () => {
      const text = '/m/a';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice'), makeSuggestion('albert')],
      });
      composable.moveActiveSuggestion(1);
      expect(composable.activeSuggestionIndex.value).toBe(1);
    });

    it('clamps the index to the last suggestion', () => {
      const text = '/m/a';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice'), makeSuggestion('albert')],
      });
      composable.moveActiveSuggestion(10);
      expect(composable.activeSuggestionIndex.value).toBe(1);
    });

    it('clamps the index to zero when moving below the start', () => {
      const text = '/m/a';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice'), makeSuggestion('albert')],
      });
      composable.moveActiveSuggestion(-5);
      expect(composable.activeSuggestionIndex.value).toBe(0);
    });
  });

  describe('activeSuggestionIndex watcher', () => {
    it('clamps the active index when the suggestion list shrinks', async () => {
      const text = '/m/a';
      const { composable, state } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [
          makeSuggestion('alice'),
          makeSuggestion('albert'),
          makeSuggestion('alan'),
        ],
      });
      composable.moveActiveSuggestion(2);
      state.suggestions = [makeSuggestion('alice')];
      // Force the computed to recompute by touching the dependency
      void composable.filteredModSuggestions.value;
      await nextTick();
      expect(composable.activeSuggestionIndex.value).toBe(0);
    });

    it('resets the active index to 0 when suggestions become empty', async () => {
      const text = '/m/a';
      const { composable, state } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('alice'), makeSuggestion('albert')],
      });
      composable.moveActiveSuggestion(1);
      state.suggestions = [];
      void composable.filteredModSuggestions.value;
      await nextTick();
      expect(composable.activeSuggestionIndex.value).toBe(0);
    });
  });

  describe('suggestionPopoverStyle', () => {
    it('returns default style when there is no editor', () => {
      const { composable } = setup();
      expect(composable.suggestionPopoverStyle.value).toEqual({
        left: '0px',
        top: '0px',
        width: '220px',
      });
    });

    it('pins the popover to the left edge on small screens', () => {
      const { composable } = setup({
        editor: makeEditor('', 0),
        smallScreen: true,
      });
      expect(composable.suggestionPopoverStyle.value.left).toBe('0px');
    });

    it('uses a full-height top anchor on small screens', () => {
      const { composable } = setup({
        editor: makeEditor('', 0),
        smallScreen: true,
      });
      expect(composable.suggestionPopoverStyle.value.top).toBe('100%');
    });

    it('returns a pixel width when an editor is present', () => {
      const { composable } = setup({ editor: makeEditor('', 0) });
      expect(composable.suggestionPopoverStyle.value.width).toMatch(/px$/);
    });
  });

  describe('updateCaretCoordinates', () => {
    it('is a no-op when there is no editor', () => {
      const { composable } = setup();
      composable.updateCaretCoordinates();
      expect(composable.caretCoordinates.value).toEqual({ top: 0, left: 0 });
    });

    it('updates caret coordinates when an editor is present', () => {
      const editor = makeEditor('hello', 5);
      const { composable } = setup({ editor, cursorIndex: 5 });
      composable.updateCaretCoordinates();
      expect(composable.caretCoordinates.value).toHaveProperty('top');
    });
  });

  describe('applyModSuggestion', () => {
    it('is a no-op when there is no mention state', () => {
      const { composable, onUpdate } = setup({
        text: 'no trigger',
        cursorIndex: 10,
        editor: makeEditor('no trigger', 10),
      });
      composable.applyModSuggestion(makeSuggestion('alice'));
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('is a no-op when there is no editor', () => {
      const text = '/m/al';
      const { composable, onUpdate } = setup({
        text,
        cursorIndex: text.length,
      });
      composable.applyModSuggestion(makeSuggestion('alice'));
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('replaces the mention with the selected suggestion', () => {
      const text = 'hey /m/al';
      const editor = makeEditor(text, text.length);
      const { composable, onUpdate } = setup({
        text,
        cursorIndex: text.length,
        editor,
      });
      composable.applyModSuggestion(makeSuggestion('alice'));
      expect(onUpdate).toHaveBeenCalledWith('hey /m/alice');
    });

    it('adds a trailing space when text follows the mention', () => {
      const text = 'hey /m/al world';
      const cursor = 'hey /m/al'.length;
      const editor = makeEditor(text, cursor);
      const { composable, onUpdate } = setup({
        text,
        cursorIndex: cursor,
        editor,
      });
      composable.applyModSuggestion(makeSuggestion('alice'));
      expect(onUpdate).toHaveBeenCalledWith('hey /m/alice world');
    });

    it('reports the updated cursor position', () => {
      const text = 'hey /m/al';
      const editor = makeEditor(text, text.length);
      const { composable, onCursorUpdate } = setup({
        text,
        cursorIndex: text.length,
        editor,
      });
      composable.applyModSuggestion(makeSuggestion('alice'));
      expect(onCursorUpdate).toHaveBeenCalledWith('hey /m/alice'.length);
    });
  });
});
