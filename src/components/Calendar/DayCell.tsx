import { DayCellState } from "../../types";
import { isPastEditAllowed, isWithinBackfillWindow } from "../../utils/noteRules";
import { formatDate } from "../../utils/date";
import type { HabitMark } from "../../utils/habits";
import styles from "./DayCell.module.css";

interface DayCellProps {
  day: number | null;
  date?: Date;
  state: DayCellState;
  hasNote: boolean;
  /** Pinned habits done this day; each becomes a hue-tinted dot. */
  habits?: HabitMark[];
  selected?: boolean;
  onClick?: () => void;
}

export function DayCell({
  day,
  date,
  state,
  hasNote,
  habits,
  selected = false,
  onClick,
}: DayCellProps) {
  if (day === null) {
    return <div className={`${styles.dayCell} ${styles.empty}`} />;
  }

  const isClickable =
    state === DayCellState.Today ||
    (state === DayCellState.Past &&
      (hasNote ||
        isPastEditAllowed() ||
        // Skipped days stay writable for a while
        (date !== undefined && isWithinBackfillWindow(formatDate(date)))));

  const habitMarks = habits ?? [];

  // Create accessible label with full date
  const ariaLabel = date
    ? `${date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}${hasNote ? ", has note" : ""}${
        habitMarks.length > 0
          ? `, habits: ${habitMarks.map((h) => h.type).join(", ")}`
          : ""
      }`
    : undefined;

  return (
    <div
      className={[
        styles.dayCell,
        styles[state],
        isClickable && styles.clickable,
        selected && styles.selected,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? ariaLabel : undefined}
      aria-selected={selected ? "true" : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {day}
      {habitMarks.length > 0 ? (
        <span className={styles.dots} aria-hidden="true">
          {hasNote && <span className={styles.dot} />}
          {habitMarks.map((mark) => (
            <span
              key={mark.type}
              className={styles.dot}
              data-hue-slot={mark.slot}
            />
          ))}
        </span>
      ) : (
        hasNote && <span className={styles.indicator} aria-hidden="true" />
      )}
    </div>
  );
}
