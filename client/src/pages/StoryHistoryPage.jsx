import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchStoryHistory } from "../api/stories";
import styles from "./StoryHistoryPage.module.css";

export default function StoryHistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStoryHistory(token)
      .then(({ stories }) => setStories(stories))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>היסטוריית סיפורים</h1>

      {error && <p className={styles.error}>{error}</p>}

      {stories.length === 0 ? (
        <p className={styles.empty}>עדיין לא קראת אף סיפור.</p>
      ) : (
        <div className={styles.list}>
          {stories.map((s) => (
            <button key={s._id} className={styles.card} onClick={() => navigate(`/story/${s._id}`)}>
              <div className={styles.cardHeader}>
                <span className={styles.storyTitle}>{s.title}</span>
                {s.level?.cefr && <span className={styles.levelBadge}>{s.level.cefr}</span>}
              </div>
              <div className={styles.meta}>
                <span>{new Date(s.createdAt).toLocaleDateString("he-IL")}</span>
                {s.sessionStatus && (
                  <span className={s.sessionStatus === "completed" ? styles.statusDone : styles.statusActive}>
                    {s.sessionStatus === "completed" ? "הושלם" : "בתהליך"}
                  </span>
                )}
              </div>
              {s.topics?.length > 0 && <div className={styles.topics}>{s.topics.join(" · ")}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
