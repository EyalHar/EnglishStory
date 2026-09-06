import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchStoryHistory, generateNextStory } from "../api/stories";
import styles from "./ComingSoonPage.module.css";

export default function StoryEntryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { stories } = await fetchStoryHistory(token);
        const active = stories.find((s) => s.sessionStatus === "active");
        const targetId = active ? active._id : (await generateNextStory(token)).story._id;
        if (!cancelled) navigate(`/story/${targetId}`, { replace: true });
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>לא הצלחנו ליצור סיפור</h1>
        <p className={styles.text}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <p className={styles.text}>יוצרים עבורך סיפור...</p>
    </div>
  );
}
