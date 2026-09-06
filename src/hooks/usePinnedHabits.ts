import { useCallback, useSyncExternalStore } from "react";
import {
  getPinnedHabits,
  setPinnedHabits,
  subscribePinnedHabits,
} from "../services/habitPreferences";

const SERVER_SNAPSHOT: readonly string[] = Object.freeze([]);

function getServerSnapshot(): readonly string[] {
  return SERVER_SNAPSHOT;
}

export function usePinnedHabits(): {
  pinned: readonly string[];
  setPinned: (habits: readonly string[]) => void;
  togglePinned: (type: string) => void;
} {
  const pinned = useSyncExternalStore(
    subscribePinnedHabits,
    getPinnedHabits,
    getServerSnapshot,
  );

  const togglePinned = useCallback(
    (type: string) => {
      const current = getPinnedHabits();
      setPinnedHabits(
        current.includes(type)
          ? current.filter((t) => t !== type)
          : [...current, type],
      );
    },
    [],
  );

  return { pinned, setPinned: setPinnedHabits, togglePinned };
}
