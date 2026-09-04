/**
 * Pure helpers for the time scrubber: the clock bubble that rides the edge
 * of the note pane while scrolling and shows the time of the entry under it.
 */

export interface MomentMarker {
  /** Vertical position of the moment's top edge, in the same space as `y`. */
  top: number;
  /** ISO timestamp, or "now" for the open composer. */
  time: string;
}

/**
 * Pick the marker under position `y`: the last marker whose top is at or
 * above `y`, falling back to the first marker when `y` sits above all of them.
 * Markers must be in document order (top ascending).
 */
export function pickMomentTime(
  markers: readonly MomentMarker[],
  y: number,
): string | null {
  if (markers.length === 0) return null;
  let pick = markers[0].time;
  for (const marker of markers) {
    if (marker.top <= y) pick = marker.time;
    else break;
  }
  return pick;
}

/**
 * Where along the visible pane the bubble sits, in pixels from the top,
 * proportional to scroll progress. Returns null when there is nothing to
 * scroll, so the caller can keep the scrubber hidden.
 */
export function scrubberOffset(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  bubbleSize: number,
  margin: number,
): number | null {
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 0) return null;
  const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
  const track = Math.max(0, clientHeight - bubbleSize - margin * 2);
  return margin + progress * track;
}

export interface ClockAngles {
  hour: number;
  minute: number;
}

/** Rotation of the hour and minute hands, in degrees clockwise from 12. */
export function clockAngles(date: Date): ClockAngles {
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  return { hour: (h + m / 60) * 30, minute: m * 6 };
}

/** Resolve a marker's time attribute to a Date, treating "now" as the present. */
export function resolveMomentDate(time: string, now: Date): Date | null {
  if (time === "now") return now;
  const parsed = new Date(time);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
