import { formatDate, isToday, parseDate } from "./date";

const ALLOW_PAST_EDIT_KEY = "dailynote_allow_past_edit";

// Notes are editable until this hour (exclusive) of next day
const LATE_NIGHT_EDIT_UNTIL_HOUR = 3;

export function isPastEditAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ALLOW_PAST_EDIT_KEY) === "1";
}

/**
 * Skipped days can still receive a note (backfill) while the day is
 * strictly in the past and at most one calendar month old.
 */
export function isWithinBackfillWindow(dateStr: string): boolean {
  const date = parseDate(dateStr);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date >= today) return false;

  const cutoff = new Date(today);
  const dayOfMonth = cutoff.getDate();
  cutoff.setMonth(cutoff.getMonth() - 1);
  // Month-end overflow (e.g. Mar 31 − 1 month → Mar 3): clamp to the
  // last day of the previous month
  if (cutoff.getDate() !== dayOfMonth) cutoff.setDate(0);

  return date >= cutoff;
}

export interface CanEditNoteOptions {
  // The note for this date has no content yet (missing or empty)
  noteIsEmpty?: boolean;
}

export function canEditNote(
  dateStr: string,
  options?: CanEditNoteOptions,
): boolean {
  if (isPastEditAllowed()) {
    return true;
  }
  if (isToday(dateStr)) {
    return true;
  }
  // Allow editing yesterday's note during late night (before 3am)
  if (new Date().getHours() < LATE_NIGHT_EDIT_UNTIL_HOUR) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === formatDate(yesterday)) return true;
  }
  // Skipped days: notes without content can still be written for a while
  if (options?.noteIsEmpty && isWithinBackfillWindow(dateStr)) {
    return true;
  }
  return false;
}
