import { computed, ref, type Ref } from 'vue';

export interface MarkdownHeading {
  id: string;
  text: string;
  level: number;
  anchor: string;
}

export function useMarkdownHeadings(markdownContent: Ref<string>) {
  const headings = computed(() => {
    if (!markdownContent.value) return [];

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(markdownContent.value.matchAll(headingRegex));

    return matches.map((match, index) => {
      const level = match[1].length;
      const text = match[2].trim();

      // Create a URL-friendly anchor from the heading text
      const anchor = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      return {
        id: `heading-${index}`,
        text,
        level,
        anchor: anchor || `heading-${index}`, // Fallback if anchor is empty
      };
    });
  });

  // Function to scroll to a specific heading
  const scrollToHeading = (anchor: string) => {
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return {
    headings,
    scrollToHeading,
  };
}
