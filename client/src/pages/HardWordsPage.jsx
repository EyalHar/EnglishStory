import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchHardWords, fetchGraduatedWords } from "../api/words";
import styles from "./HardWordsPage.module.css";

export default function HardWordsPage() {
  const { token } = useAuth();
  const [hardWords, setHardWords] = useState([]);
  const [graduatedWords, setGraduatedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchHardWords(token), fetchGraduatedWords(token)])
      .then(([hard, graduated]) => {
        setHardWords(hard.words);
        setGraduatedWords(graduated.words);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>מילים קשות</h1>
      <p className={styles.subtitle}>
        מילים שסימנת כקשות תוך כדי קריאה. ככל שתתרגלו יותר, המילים האלה ישולבו שוב בסיפורים הבאים.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      {hardWords.length === 0 ? (
        <p className={styles.empty}>עדיין לא סימנת אף מילה כקשה — זה יקרה אוטומטית תוך כדי קריאה.</p>
      ) : (
        <div className={styles.grid}>
          {hardWords.map((w) => (
            <div key={w._id} className={styles.card}>
              <span className={styles.word}>{w.word}</span>
              <span className={styles.counter}>הופיעה קשה {w.timesMarkedHard} פעמים</span>
            </div>
          ))}
        </div>
      )}

      {graduatedWords.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>מילים שכבר לא קשות</h2>
          <div className={styles.grid}>
            {graduatedWords.map((w) => (
              <div key={w._id} className={`${styles.card} ${styles.graduatedCard}`}>
                <span className={styles.word}>{w.word}</span>
                <span className={styles.counter}>רמת שליטה {w.spacedRepetition?.boxLevel ?? 1} מתוך 4</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
