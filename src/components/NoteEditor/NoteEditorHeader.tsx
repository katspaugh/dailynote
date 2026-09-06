import { parseDate } from "../../utils/date";
import { getMoonPhaseEmoji, getMoonPhaseName } from "../../utils/moonPhase";
import type { HabitStatus } from "../../hooks/useHabits";
import styles from "./NoteEditor.module.css";

interface NoteEditorHeaderProps {
  date: string;
  formattedDate: string;
  showReadonlyBadge: boolean;
  onJumpToToday?: () => void;
  statusText: string | null;
  isStatusError?: boolean;
  onRestore?: () => void;
  weatherLabel?: string | null;
  debugKeyId?: string | null;
  /** Pinned habits with their current streaks (today's view only). */
  streaks?: HabitStatus[];
}

export function NoteEditorHeader({
  date,
  formattedDate,
  showReadonlyBadge,
  onJumpToToday,
  statusText,
  isStatusError = false,
  onRestore,
  weatherLabel,
  debugKeyId,
  streaks,
}: NoteEditorHeaderProps) {
  const parsed = parseDate(date);
  const moonEmoji = parsed ? getMoonPhaseEmoji(parsed) : "";
  const moonTitle = parsed ? getMoonPhaseName(parsed) : "";

  return (
    <div className={styles.header}>
      <div className={styles.headerTitle}>
        <span className={styles.date}>
          {moonEmoji && <><span className={styles.moonEmoji} title={moonTitle}>{moonEmoji}</span> </>}
          {formattedDate}
        </span>
        {weatherLabel && (
          <span className={styles.weatherLabel}>
            {weatherLabel}
          </span>
        )}
        {streaks && streaks.length > 0 && (
          <span className={styles.streaks} aria-label="Habit streaks">
            {streaks.map((habit) => (
              <span
                key={habit.type}
                className={styles.streak}
                data-hue-slot={habit.slot}
                title={`${habit.type}: ${habit.streak} day streak`}
              >
                <span className={styles.streakDot} aria-hidden="true" />
                <b>{habit.streak}</b> {habit.type}
              </span>
            ))}
          </span>
        )}
        {showReadonlyBadge && (
          <span className={styles.readonlyBadge}>Read only</span>
        )}
        {showReadonlyBadge && onJumpToToday && (
          <button
            type="button"
            className={styles.jumpToTodayButton}
            onClick={onJumpToToday}
            title="Jump to today's note"
          >
            Jump to today
          </button>
        )}
        {debugKeyId && (
          <code className={styles.debugKeyBadge} title={debugKeyId}>
            {debugKeyId.slice(0, 8)}
          </code>
        )}
      </div>
      {statusText && (
        <span
          className={[
            styles.status,
            isStatusError ? styles.statusError : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-live="polite"
        >
          {statusText}
          {onRestore && (
            <button
              className={styles.restoreButton}
              onClick={onRestore}
            >
              Restore
            </button>
          )}
        </span>
      )}
    </div>
  );
}
