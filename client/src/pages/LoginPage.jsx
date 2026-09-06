import { useState } from "react";
import { Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { token, login } = useAuth();
  const [error, setError] = useState("");

  if (token) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>EnglishStory</h1>
        <p className={styles.subtitle}>שפרו את הקריאה השוטפת ואוצר המילים שלכם באנגלית</p>

        <div className={styles.loginBox}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              setError("");
              login(credentialResponse.credential).catch((err) => setError(err.message));
            }}
            onError={() => setError("ההתחברות נכשלה, נסו שוב")}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
