import { ref, computed, watch } from 'vue';
import {
  getModMentionState,
  filterModSuggestions,
  type ModSuggestion,
} from '@/utils/modMentions';

type CaretCoordinates = {
  top: number;
  left: number;
};

/**
 * Calculate the visual coordinates of the caret in a textarea.
 * This is used to position the autocomplete popover near the cursor.
 */
function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): CaretCoordinates {
  const div = document.createElement('div');
  const style = getComputedStyle(element);
  const properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'letterSpacing',
    'wordSpacing',
  ];

  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  properties.forEach((prop) => {
    div.style.setProperty(prop, style.getPropertyValue(prop));
  });
  div.style.width = `${element.clientWidth}px`;
  div.textContent = element.value.substr(0, position);

  const span = document.createElement('span');
  span.textContent = element.value.substr(position) || '.';
  div.appendChild(span);
  document.body.appendChild(div);

  const coords = {
    top: span.offsetTop - element.scrollTop,
    left: span.offsetLeft - element.scrollLeft,
  };

  document.body.removeChild(div);
  return coords;
}

type UseModAutocompleteParams = {
  /** Getter function for current text value */
  getText: () => string;
  /** Getter function for current cursor position */
  getCursorIndex: () => number;
  /** Getter function for whether mod autocomplete is enabled */
  isEnabled: () => boolean;
  /** Getter function for available mod suggestions */
  getModSuggestions: () => ModSuggestion[];
  /** Getter function for textarea element */
  getEditorRef: () => HTMLTextAreaElement | null;
  /** Getter function for whether screen is small */
  getIsSmallScreen: () => boolean;
  /** Callback when text is updated */
  onUpdate: (newText: string) => void;
  /** Callback to update cursor index */
  onCursorUpdate: (index: number) => void;
};

/**
 * Composable for handling mod mention autocomplete in the text editor.
 * Uses getter functions to ensure proper reactivity with parent component state.
 */
export function useModAutocomplete(params: UseModAutocompleteParams) {
  const {
    getText,
    getCursorIndex,
    isEnabled,
    getModSuggestions,
    getEditorRef,
    getIsSmallScreen,
    onUpdate,
    onCursorUpdate,
  } = params;

  const caretCoordinates = ref<CaretCoordinates>({ top: 0, left: 0 });

  /**
   * Get the current mod mention state (trigger index and query)
   */
  const mentionState = computed(() =>
    getModMentionState(getText() || '', getCursorIndex())
  );

  /**
   * Get filtered mod suggestions based on current query.
   * Access all getters upfront to ensure Vue tracks all dependencies.
   */
  const filteredModSuggestions = computed(() => {
    const enabled = isEnabled();
    const suggestions = getModSuggestions();
    const state = mentionState.value;

    if (!enabled || suggestions.length === 0 || !state) {
      return [];
    }
    return filterModSuggestions(suggestions, state.query);
  });

  /**
   * Check if there's an exact match (user has typed a complete mod name)
   */
  const hasExactMatch = computed(() => {
    const query = mentionState.value?.query;
    if (!query) return false;
    return filteredModSuggestions.value.some(
      (mod) => mod.value.toLowerCase() === query.toLowerCase()
    );
  });

  /**
   * Whether to show the mod suggestions popover.
   * Access all dependencies upfront for proper reactivity tracking.
   */
  const showModSuggestions = computed(() => {
    const enabled = isEnabled();
    const hasSuggestions = filteredModSuggestions.value.length > 0;
    const exactMatch = hasExactMatch.value;
    const show = enabled && hasSuggestions && !exactMatch;
    return show;
  });

  const activeSuggestionIndex = ref(0);

  watch(filteredModSuggestions, (suggestions) => {
    if (!suggestions.length) {
      activeSuggestionIndex.value = 0;
      return;
    }
    if (activeSuggestionIndex.value >= suggestions.length) {
      activeSuggestionIndex.value = suggestions.length - 1;
    }
  });

  const showModHelperText = computed(() => {
    const enabled = isEnabled();
    const suggestions = getModSuggestions();
    return enabled && suggestions.length > 0;
  });

  function moveActiveSuggestion(delta: number) {
    const suggestions = filteredModSuggestions.value;
    if (!suggestions.length) {
      activeSuggestionIndex.value = 0;
      return;
    }

    const nextIndex = Math.max(
      0,
      Math.min(activeSuggestionIndex.value + delta, suggestions.length - 1)
    );
    activeSuggestionIndex.value = nextIndex;
  }

  /**
   * Calculate the style for the suggestion popover positioning
   */
  const suggestionPopoverStyle = computed((): Record<string, string> => {
    const textarea = getEditorRef();
    if (!textarea) return { left: '0px', top: '0px', width: '220px' };

    const popoverWidth = Math.min(
      320,
      Math.max(textarea.clientWidth - 16, 220)
    );
    const editorWidth = textarea.clientWidth;
    const maxLeft = Math.max(editorWidth - popoverWidth - 8, 0);
    const baseLeft = caretCoordinates.value.left + 20;
    const left = getIsSmallScreen() ? 0 : Math.min(baseLeft, maxLeft);

    const maxTop = Math.max(textarea.clientHeight, 0);
    const top = getIsSmallScreen()
      ? '100%'
      : `${Math.min(caretCoordinates.value.top + 55, maxTop)}px`;

    return {
      left: `${left}px`,
      top,
      width: `${popoverWidth}px`,
    };
  });

  /**
   * Update the caret coordinates based on current cursor position.
   * Only call this when mod autocomplete is active to avoid performance issues.
   */
  function updateCaretCoordinates() {
    const textarea = getEditorRef();
    if (!textarea) return;
    caretCoordinates.value = getCaretCoordinates(textarea, getCursorIndex());
  }

  /**
   * Apply a mod suggestion to the text
   */
  function applyModSuggestion(suggestion: ModSuggestion) {
    const state = mentionState.value;
    const textarea = getEditorRef();
    if (!state || !textarea) return;

    const text = getText();
    const cursorIndex = getCursorIndex();
    const before = text.slice(0, state.triggerIndex);
    const after = text.slice(cursorIndex);
    const insertion = `/m/${suggestion.value}`;
    const needsSpace = after.length > 0 && !after.startsWith(' ');
    const nextText = `${before}${insertion}${needsSpace ? ' ' : ''}${after}`;

    onUpdate(nextText);
    textarea.value = nextText;
    const nextCursor = before.length + insertion.length + (needsSpace ? 1 : 0);
    textarea.setSelectionRange(nextCursor, nextCursor);
    onCursorUpdate(nextCursor);
    textarea.focus();
    updateCaretCoordinates();
  }

  return {
    mentionState,
    filteredModSuggestions,
    hasExactMatch,
    showModSuggestions,
    showModHelperText,
    suggestionPopoverStyle,
    caretCoordinates,
    updateCaretCoordinates,
    applyModSuggestion,
    activeSuggestionIndex,
    moveActiveSuggestion,
  };
}
