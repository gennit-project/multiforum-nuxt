/**
 * Text formatting utilities for the TextEditor component
 */

/**
 * Format parameters for text formatting functions
 */
export type FormatTextParams = {
  text: string;
  format: FormatType;
};

/**
 * Supported text formatting types
 */
export type FormatType =
  | "bold"
  | "italic"
  | "underline"
  | "header1"
  | "header2"
  | "header3"
  | "quote";

/**
 * Formats text according to the specified format type
 * @param params The format parameters
 * @returns The formatted text
 */
export function formatText(params: FormatTextParams): string {
  const { text, format } = params;

  switch (format) {
    case "bold":
      return formatBold({ text });
    case "italic":
      return formatItalic({ text });
    case "underline":
      return formatUnderline({ text });
    case "header1":
      return formatHeader1({ text });
    case "header2":
      return formatHeader2({ text });
    case "header3":
      return formatHeader3({ text });
    case "quote":
      return formatQuote({ text });
    default:
      return text;
  }
}

/**
 * Format a piece of text as bold (markdown)
 * @param params The text to format
 * @returns The formatted text
 */
export function formatBold(params: { text: string }): string {
  return `**${params.text}**`;
}

/**
 * Format a piece of text as italic (markdown)
 * @param params The text to format
 * @returns The formatted text
 */
export function formatItalic(params: { text: string }): string {
  return `*${params.text}*`;
}

/**
 * Format a piece of text as underlined (HTML)
 * @param params The text to format
 * @returns The formatted text
 */
export function formatUnderline(params: { text: string }): string {
  return `<u>${params.text}</u>`;
}

/**
 * Format a piece of text as header level 1 (markdown)
 * @param params The text to format
 * @returns The formatted text
 */
export function formatHeader1(params: { text: string }): string {
  return `# ${params.text}`;
}

/**
 * Format a piece of text as header level 2 (markdown)
 * @param params The text to format
 * @returns The formatted text
 */
export function formatHeader2(params: { text: string }): string {
  return `## ${params.text}`;
}

/**
 * Format a piece of text as header level 3 (markdown)
 * @param params The text to format
 * @returns The formatted text
 */
export function formatHeader3(params: { text: string }): string {
  return `### ${params.text}`;
}

/**
 * Format text as a block quote (markdown)
 * @param params The text to format
 * @returns The formatted text
 */
export function formatQuote(params: { text: string }): string {
  return params.text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

/**
 * Insert text at a specific position in an existing string
 * @param params Object containing the original text, position, and text to insert
 * @returns The new text with the inserted content
 */
export function insertTextAtPosition(params: {
  originalText: string;
  position: { start: number; end: number };
  textToInsert: string;
}): string {
  const { originalText, position, textToInsert } = params;
  return (
    originalText.substring(0, position.start) + textToInsert + originalText.substring(position.end)
  );
}

/**
 * Calculate the number of characters remaining for a text input
 * @param params Object containing the current number of characters and the maximum allowed
 * @returns The number of characters remaining (can be negative if over limit)
 */
export function calculateRemainingChars(params: { current: number; max: number }): number {
  return params.max - params.current;
}

/**
 * Insert an emoji at a cursor position in text
 * @param params Object containing the original text, cursor position, and emoji to insert
 * @returns The new text with the emoji inserted
 */
export function insertEmoji(params: { text: string; position: number; emoji: string }): string {
  return params.text.slice(0, params.position) + params.emoji + params.text.slice(params.position);
}
