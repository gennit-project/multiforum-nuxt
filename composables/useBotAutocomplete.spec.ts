import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick, reactive } from 'vue';
import { useBotAutocomplete } from './useBotAutocomplete';
import type { BotSuggestion } from '@/utils/botMentions';

const makeSuggestion = (
  value: string,
  isDeprecated = false
): BotSuggestion => ({
  value,
  label: value,
  mention: `/bot/${value}`,
  isDeprecated,
});

type State = {
  text: string;
  cursorIndex: number;
  enabled: boolean;
  suggestions: BotSuggestion[];
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

  const composable = useBotAutocomplete({
    getText: () => state.text,
    getCursorIndex: () => state.cursorIndex,
    isEnabled: () => state.enabled,
    getBotSuggestions: () => state.suggestions,
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

describe('useBotAutocomplete', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('mentionState', () => {
    it('is null when there is no trigger', () => {
      const { composable } = setup({ text: 'hello world', cursorIndex: 11 });
      expect(composable.mentionState.value).toBeNull();
    });

    it('returns the query when a /bot/ trigger precedes the cursor', () => {
      const text = 'hey /bot/sum';
      const { composable } = setup({ text, cursorIndex: text.length });
      expect(composable.mentionState.value?.query).toBe('sum');
    });
  });

  describe('filteredBotSuggestions', () => {
    it('is empty when disabled', () => {
      const text = '/bot/s';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        enabled: false,
        suggestions: [makeSuggestion('summarizer')],
      });
      expect(composable.filteredBotSuggestions.value).toEqual([]);
    });

    it('is empty when there are no suggestions', () => {
      const text = '/bot/s';
      const { composable } = setup({ text, cursorIndex: text.length });
      expect(composable.filteredBotSuggestions.value).toEqual([]);
    });

    it('is empty when there is no mention state', () => {
      const { composable } = setup({
        text: 'plain text',
        cursorIndex: 10,
        suggestions: [makeSuggestion('summarizer')],
      });
      expect(composable.filteredBotSuggestions.value).toEqual([]);
    });

    it('excludes deprecated bots from suggestions', () => {
      const text = '/bot/s';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [
          makeSuggestion('summarizer'),
          makeSuggestion('spammer', true),
        ],
      });
      expect(
        composable.filteredBotSuggestions.value.map((s) => s.value)
      ).toEqual(['summarizer']);
    });

    it('filters suggestions by the current query', () => {
      const text = '/bot/su';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [
          makeSuggestion('summarizer'),
          makeSuggestion('translator'),
        ],
      });
      expect(
        composable.filteredBotSuggestions.value.map((s) => s.value)
      ).toEqual(['summarizer']);
    });
  });

  describe('hasExactMatch', () => {
    it('is false when there is no query', () => {
      const text = '/bot/';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer')],
      });
      expect(composable.hasExactMatch.value).toBe(false);
    });

    it('is true when the query exactly matches a suggestion', () => {
      const text = '/bot/summarizer';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer')],
      });
      expect(composable.hasExactMatch.value).toBe(true);
    });
  });

  describe('showBotSuggestions', () => {
    it('is true when enabled with suggestions and no exact match', () => {
      const text = '/bot/su';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer')],
      });
      expect(composable.showBotSuggestions.value).toBe(true);
    });

    it('is false when the query is an exact match', () => {
      const text = '/bot/summarizer';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer')],
      });
      expect(composable.showBotSuggestions.value).toBe(false);
    });
  });

  describe('showBotHelperText', () => {
    it('is true when enabled and suggestions exist', () => {
      const { composable } = setup({
        suggestions: [makeSuggestion('summarizer')],
      });
      expect(composable.showBotHelperText.value).toBe(true);
    });

    it('is false when there are no suggestions', () => {
      const { composable } = setup();
      expect(composable.showBotHelperText.value).toBe(false);
    });
  });

  describe('moveActiveSuggestion', () => {
    it('resets to 0 when there are no suggestions', () => {
      const { composable } = setup();
      composable.moveActiveSuggestion(1);
      expect(composable.activeSuggestionIndex.value).toBe(0);
    });

    it('moves the index forward within bounds', () => {
      const text = '/bot/s';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer'), makeSuggestion('scanner')],
      });
      composable.moveActiveSuggestion(1);
      expect(composable.activeSuggestionIndex.value).toBe(1);
    });

    it('clamps the index to the last suggestion', () => {
      const text = '/bot/s';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer'), makeSuggestion('scanner')],
      });
      composable.moveActiveSuggestion(10);
      expect(composable.activeSuggestionIndex.value).toBe(1);
    });

    it('clamps the index to zero when moving below the start', () => {
      const text = '/bot/s';
      const { composable } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer'), makeSuggestion('scanner')],
      });
      composable.moveActiveSuggestion(-5);
      expect(composable.activeSuggestionIndex.value).toBe(0);
    });
  });

  describe('activeSuggestionIndex watcher', () => {
    it('clamps the active index when the suggestion list shrinks', async () => {
      const text = '/bot/s';
      const { composable, state } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [
          makeSuggestion('summarizer'),
          makeSuggestion('scanner'),
          makeSuggestion('searcher'),
        ],
      });
      composable.moveActiveSuggestion(2);
      state.suggestions = [makeSuggestion('summarizer')];
      void composable.filteredBotSuggestions.value;
      await nextTick();
      expect(composable.activeSuggestionIndex.value).toBe(0);
    });

    it('resets the active index to 0 when suggestions become empty', async () => {
      const text = '/bot/s';
      const { composable, state } = setup({
        text,
        cursorIndex: text.length,
        suggestions: [makeSuggestion('summarizer'), makeSuggestion('scanner')],
      });
      composable.moveActiveSuggestion(1);
      state.suggestions = [];
      void composable.filteredBotSuggestions.value;
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

  describe('applyBotSuggestion', () => {
    it('is a no-op when there is no mention state', () => {
      const { composable, onUpdate } = setup({
        text: 'no trigger',
        cursorIndex: 10,
        editor: makeEditor('no trigger', 10),
      });
      composable.applyBotSuggestion(makeSuggestion('summarizer'));
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('is a no-op when there is no editor', () => {
      const text = '/bot/su';
      const { composable, onUpdate } = setup({
        text,
        cursorIndex: text.length,
      });
      composable.applyBotSuggestion(makeSuggestion('summarizer'));
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('replaces the mention with the selected suggestion', () => {
      const text = 'hey /bot/su';
      const editor = makeEditor(text, text.length);
      const { composable, onUpdate } = setup({
        text,
        cursorIndex: text.length,
        editor,
      });
      composable.applyBotSuggestion(makeSuggestion('summarizer'));
      expect(onUpdate).toHaveBeenCalledWith('hey /bot/summarizer');
    });

    it('adds a trailing space when text follows the mention', () => {
      const text = 'hey /bot/su world';
      const cursor = 'hey /bot/su'.length;
      const editor = makeEditor(text, cursor);
      const { composable, onUpdate } = setup({
        text,
        cursorIndex: cursor,
        editor,
      });
      composable.applyBotSuggestion(makeSuggestion('summarizer'));
      expect(onUpdate).toHaveBeenCalledWith('hey /bot/summarizer world');
    });

    it('reports the updated cursor position', () => {
      const text = 'hey /bot/su';
      const editor = makeEditor(text, text.length);
      const { composable, onCursorUpdate } = setup({
        text,
        cursorIndex: text.length,
        editor,
      });
      composable.applyBotSuggestion(makeSuggestion('summarizer'));
      expect(onCursorUpdate).toHaveBeenCalledWith('hey /bot/summarizer'.length);
    });
  });
});
