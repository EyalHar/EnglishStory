import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitSelfReport } from "../api/onboarding";
import styles from "./OnboardingPage.module.css";

const LEVELS = [
  { value: "beginner", label: "מתחיל/ה", desc: "אני יודע/ת מילים בסיסיות ומשפטים פשוטים" },
  { value: "intermediate", label: "בינוני/ת", desc: "אני יכול/ה לקרוא טקסטים יומיומיים ולנהל שיחה" },
  { value: "advanced", label: "מתקדם/ת", desc: "אני קורא/ת באנגלית בביטחון, כולל טקסטים מורכבים" },
];

export default function OnboardingSelfReportPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function choose(level) {
    setLoading(true);
    setError("");
    try {
      await submitSelfReport(token, level);
      navigate("/onboarding/placement");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.step}>שלב 1 מתוך 2</div>
        <h1 className={styles.title}>מה רמת האנגלית שלך?</h1>
        <p className={styles.subtitle}>זו רק נקודת פתיחה — מבחן קצר אחרי זה יעזור לנו לדייק</p>

        <div className={styles.options}>
          {LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              className={styles.option}
              onClick={() => choose(lvl.value)}
              disabled={loading}
            >
              <span className={styles.optionLabel}>{lvl.label}</span>
              <span className={styles.optionDesc}>{lvl.desc}</span>
            </button>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
