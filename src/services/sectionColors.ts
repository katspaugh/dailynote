import { SECTION_HUE_SLOTS, sectionHueSlot } from "../utils/sectionTypes";

const PALETTE_SIZE = SECTION_HUE_SLOTS;

function applyHueSlot(el: HTMLElement, slot: number): void {
  const target = `section-hue-${slot}`;
  if (el.classList.contains(target)) {
    // Check for stale classes from a different slot
    let hasStale = false;
    for (let i = 0; i < PALETTE_SIZE; i++) {
      if (i !== slot && el.classList.contains(`section-hue-${i}`)) {
        hasStale = true;
        break;
      }
    }
    if (!hasStale) return; // Already correct — skip DOM mutation
  }
  for (let i = 0; i < PALETTE_SIZE; i++) {
    el.classList.remove(`section-hue-${i}`);
  }
  el.classList.add(target);
}

export function applySectionColors(editor: HTMLElement): void {
  const headers = editor.querySelectorAll<HTMLElement>("[data-section-type]");
  for (const header of headers) {
    const type = header.getAttribute("data-section-type");
    if (!type) continue;
    const slot = sectionHueSlot(type);
    applyHueSlot(header, slot);
    const body = header.nextElementSibling;
    if (body instanceof HTMLElement && !body.hasAttribute("data-section-type")) {
      applyHueSlot(body, slot);
    }
  }
}
