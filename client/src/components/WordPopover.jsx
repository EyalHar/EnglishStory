import styles from "./WordPopover.module.css";

export default function WordPopover({
  word,
  phrase,
  x,
  y,
  translation,
  loading,
  error,
  markedHard,
  onToggleHard,
  onClose,
}) {
  const display = phrase || word;

  return (
    <div className={styles.popover} style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="סגור">
        ×
      </button>
      <div className={styles.word}>{display}</div>
      {loading && <div className={styles.status}>מתרגם...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {translation && <div className={styles.translation}>{translation}</div>}

      <button
        className={markedHard ? `${styles.hardBtn} ${styles.hardBtnActive}` : styles.hardBtn}
        onClick={onToggleHard}
      >
        {markedHard ? "✓ מסומנת כקשה" : "סמן כמילה קשה"}
      </button>
    </div>
  );
}
