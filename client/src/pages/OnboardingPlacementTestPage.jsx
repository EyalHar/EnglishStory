import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPlacementTest, submitPlacementTest } from "../api/onboarding";
import styles from "./OnboardingPage.module.css";

export default function OnboardingPlacementTestPage() {
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [known, setKnown] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlacementTest(token)
      .then(({ words }) => setWords(words))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function toggle(word) {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const responses = words.map((word) => ({ word, known: known.has(word) }));
      await submitPlacementTest(token, responses);
      await refreshUser();
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.step}>שלב 2 מתוך 2</div>
        <h1 className={styles.title}>אילו מילים אתם מכירים?</h1>
        <p className={styles.hint}>
          סמנו כל מילה שאתם יודעים את המשמעות שלה. אין צורך לדעת הכול — זה עוזר לנו למצוא את הרמה המדויקת
          עבורכם.
        </p>

        <div className={styles.wordsGrid}>
          {words.map((word) => (
            <button
              key={word}
              className={known.has(word) ? `${styles.wordChip} ${styles.wordChipKnown}` : styles.wordChip}
              onClick={() => toggle(word)}
            >
              {word}
            </button>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? "בודקים..." : "סיום המבחן"}
        </button>
      </div>
    </div>
  );
}
