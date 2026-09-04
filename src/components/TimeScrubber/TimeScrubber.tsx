import { useEffect, useRef, useState } from "react";
import { formatTimestampLabel } from "../../services/timestampLabel";
import {
  clockAngles,
  pickMomentTime,
  resolveMomentDate,
  scrubberOffset,
} from "../../utils/timeScrubber";
import styles from "./TimeScrubber.module.css";

const BUBBLE_SIZE = 44;
const MARGIN = 12;
/** Gap between the clock and the pane's right edge. */
const EDGE_INSET = 14;
const HIDE_AFTER_MS = 1100;

/** Elements that mark a moment in time inside the scroll container. */
const MARKER_SELECTOR = "[data-moment-time], hr[data-timestamp]";

interface TimeScrubberProps {
  /** The scrolling note pane. The scrubber rides its right edge. */
  scrollContainer: HTMLElement | null;
}

interface ScrubberState {
  visible: boolean;
  /** Translation from the sticky anchor to the bubble's resting spot. */
  dx: number;
  dy: number;
  date: Date | null;
}

const HIDDEN: ScrubberState = { visible: false, dx: 0, dy: MARGIN, date: null };

function readMarkers(container: HTMLElement) {
  const nodes = container.querySelectorAll<HTMLElement>(MARKER_SELECTOR);
  const markers: { top: number; time: string }[] = [];
  for (const node of nodes) {
    const time =
      node.getAttribute("data-moment-time") ??
      node.getAttribute("data-timestamp");
    if (!time) continue;
    markers.push({ top: node.getBoundingClientRect().top, time });
  }
  return markers;
}

/**
 * Path-style time scrubber: a clock bubble that appears on the right edge of
 * the note pane while it scrolls, tracks scroll progress, and shows the time
 * of the entry under it. Fades out once scrolling stops.
 */
export function TimeScrubber({ scrollContainer }: TimeScrubberProps) {
  const [state, setState] = useState<ScrubberState>(HIDDEN);
  const anchorRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollContainer;
    if (!el) return;

    const handleScroll = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const offset = scrubberOffset(
        el.scrollTop,
        el.scrollHeight,
        el.clientHeight,
        BUBBLE_SIZE,
        MARGIN,
      );
      const markers = readMarkers(el);
      if (offset === null || markers.length === 0) {
        setState(HIDDEN);
        return;
      }
      // The anchor sticks wherever the pane's padding puts it, so measure
      // the bubble's translation from the anchor to the pane's own edges.
      const paneRect = el.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const dy = paneRect.top + offset - anchorRect.top;
      const dx = paneRect.right - EDGE_INSET - anchorRect.right;
      const y = paneRect.top + offset + BUBBLE_SIZE / 2;
      const time = pickMomentTime(markers, y);
      const date = time ? resolveMomentDate(time, new Date()) : null;
      setState({ visible: true, dx, dy, date });

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, visible: false }));
      }, HIDE_AFTER_MS);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scrollContainer]);

  const angles = state.date ? clockAngles(state.date) : { hour: 0, minute: 0 };
  const label = state.date ? formatTimestampLabel(state.date.toISOString()) : "";

  return (
    <div className={styles.anchor} aria-hidden="true" ref={anchorRef}>
      <div
        className={styles.scrubber}
        data-visible={state.visible || undefined}
        style={{ transform: `translate(${state.dx}px, ${state.dy}px)` }}
      >
        {label && <span className={styles.label}>{label}</span>}
        <span className={styles.clock}>
          <svg width="34" height="34" viewBox="0 0 40 40">
            <circle className={styles.face} cx="20" cy="20" r="17" />
            <g className={styles.ticks}>
              <line x1="20" y1="5" x2="20" y2="8" />
              <line x1="35" y1="20" x2="32" y2="20" />
              <line x1="20" y1="35" x2="20" y2="32" />
              <line x1="5" y1="20" x2="8" y2="20" />
            </g>
            <line
              className={`${styles.hand} ${styles.hourHand}`}
              x1="20"
              y1="20"
              x2="20"
              y2="11"
              style={{ transform: `rotate(${angles.hour}deg)` }}
            />
            <line
              className={`${styles.hand} ${styles.minuteHand}`}
              x1="20"
              y1="20"
              x2="20"
              y2="7"
              style={{ transform: `rotate(${angles.minute}deg)` }}
            />
            <circle className={styles.pin} cx="20" cy="20" r="1.8" />
          </svg>
        </span>
      </div>
    </div>
  );
}
