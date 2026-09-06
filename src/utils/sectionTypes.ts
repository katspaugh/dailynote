const SECTION_TYPE_RE = /data-section-type="([a-z][a-z-]*)"/g;

export function extractSectionTypes(html: string): string[] {
  const types = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = SECTION_TYPE_RE.exec(html)) !== null) {
    types.add(match[1]);
  }
  SECTION_TYPE_RE.lastIndex = 0;
  return [...types];
}

export function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return ((hash % 360) + 360) % 360;
}

/** Number of hues in the section palette (see noteContent.module.css). */
export const SECTION_HUE_SLOTS = 8;

/** Palette slot (0..7) a section type is coloured with, everywhere it appears. */
export function sectionHueSlot(type: string): number {
  return Math.floor((stringToHue(type) / 360) * SECTION_HUE_SLOTS);
}
