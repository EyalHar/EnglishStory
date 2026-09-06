import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchProgressSummary, fetchPatternProfile } from "../api/progress";
import LevelHistoryChart from "../components/LevelHistoryChart";
import styles from "./ProgressPage.module.css";

export default function ProgressPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchProgressSummary(token), fetchPatternProfile(token)])
      .then(([summaryRes, profileRes]) => {
        setSummary(summaryRes);
        setProfile(profileRes.profile);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return null;
  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ההתקדמות שלי</h1>

      <div className={styles.cardRow}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>רמה נוכחית</div>
          <div className={styles.cardValue}>{summary.level.cefr}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>רצף ימים</div>
          <div className={styles.cardValue}>{summary.streak.current}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>שיא רצף</div>
          <div className={styles.cardValue}>{summary.streak.longest}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>סיפורים שהושלמו</div>
          <div className={styles.cardValue}>{summary.stats.storiesCompleted}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>מילים שנשלטו</div>
          <div className={styles.cardValue}>{summary.stats.wordsMastered}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>מילים קשות פעילות</div>
          <div className={styles.cardValue}>{summary.activeHardWordCount}</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>התקדמות רמה לאורך זמן</h2>
      <div className={styles.chartCard}>
        <LevelHistoryChart history={summary.level.history} />
      </div>

      {profile && profile.sampleSize >= 3 && (
        <>
          <h2 className={styles.sectionTitle}>תחומי קושי שזיהינו</h2>
          <div className={styles.patternCard}>
            <p>
              אורך ממוצע של מילים קשות: <strong>{profile.avgWordLength?.toFixed(1)}</strong> אותיות
            </p>
            {profile.weakTopics?.length > 0 && (
              <p>נושאים מאתגרים: {profile.weakTopics.map((t) => t.topic).join(", ")}</p>
            )}
            {profile.commonNGrams?.length > 0 && (
              <p dir="ltr" className={styles.ngrams}>
                {profile.commonNGrams.map((n) => n.ngram).join(", ")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
