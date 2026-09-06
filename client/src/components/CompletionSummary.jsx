import styles from "./CompletionSummary.module.css";

export default function CompletionSummary({ result, onNewStory, onHome }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>סיימת את הסיפור! 🎉</h2>
      <p className={styles.feedback}>{result.feedbackMessage}</p>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>מילים שדרשו עזרה</span>
          <span className={styles.statValue}>{result.summary.strugglingWords}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>רמה נוכחית</span>
          <span className={styles.statValue}>{result.summary.levelAfter}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>רצף ימים</span>
          <span className={styles.statValue}>{result.streak.current}</span>
        </div>
      </div>

      {result.newlyGraduatedWords.length > 0 && (
        <p className={styles.graduated}>
          מילים שכבר לא קשות: <span dir="ltr">{result.newlyGraduatedWords.join(", ")}</span>
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={onNewStory}>
          סיפור הבא
        </button>
        <button className={styles.secondaryBtn} onClick={onHome}>
          חזרה לבית
        </button>
      </div>
    </div>
  );
}
