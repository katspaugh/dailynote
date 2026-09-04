import styles from "./TimeLabel.module.css";

const MERIDIEM_RE = /^(.*\S)\s+(AM|PM)$/i;

/**
 * A moment's time label. The AM/PM suffix, when present, is set smaller and
 * tight against the digits so the label stays narrow on the rail.
 */
export function TimeLabel({ label }: { label: string }) {
  const match = MERIDIEM_RE.exec(label);
  if (!match) return <>{label}</>;
  return (
    <>
      {match[1]}
      <span className={styles.meridiem}>{match[2]}</span>
    </>
  );
}
