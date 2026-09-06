import type { HabitStatus } from "../../hooks/useHabits";
import styles from "./HabitChips.module.css";

interface HabitChipsProps {
  habits: HabitStatus[];
  /** Start a `+type` section in the composer. */
  onPick: (type: string) => void;
}

/**
 * Pinned habits under the composer. A hollow chip is not done today; tapping
 * any chip starts an entry of that section type, which is how a habit gets
 * checked off.
 */
export function HabitChips({ habits, onPick }: HabitChipsProps) {
  if (habits.length === 0) return null;

  return (
    <div className={styles.chips} role="group" aria-label="Habits">
      {habits.map((habit) => (
        <button
          key={habit.type}
          type="button"
          className={styles.chip}
          data-hue-slot={habit.slot}
          data-done={habit.done || undefined}
          onClick={() => onPick(habit.type)}
          aria-label={`${habit.type}${habit.done ? ", done today" : ""}`}
          title={`Start a +${habit.type} entry`}
        >
          <span className={styles.dot} aria-hidden="true" />
          {habit.type}
        </button>
      ))}
    </div>
  );
}
