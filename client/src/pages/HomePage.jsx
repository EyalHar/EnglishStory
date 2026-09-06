import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>שלום, {user?.name?.split(" ")[0] || ""} 👋</h1>
      <p className={styles.subtitle}>מוכנים להמשיך לתרגל את הקריאה שלכם באנגלית?</p>

      <button className={styles.ctaBtn} onClick={() => navigate("/story")}>
        קריאת סיפור
      </button>

      <div className={styles.cardRow}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>רמה נוכחית</div>
          <div className={styles.cardValue}>{user?.level?.cefr || "A1"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>רצף ימים</div>
          <div className={styles.cardValue}>{user?.streak?.current ?? 0}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>סיפורים שהושלמו</div>
          <div className={styles.cardValue}>{user?.stats?.storiesCompleted ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
