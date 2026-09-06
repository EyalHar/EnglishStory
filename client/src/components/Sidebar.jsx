import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { to: "/", label: "בית", end: true },
  { to: "/story", label: "קריאה" },
  { to: "/words", label: "מילים קשות" },
  { to: "/progress", label: "התקדמות" },
  { to: "/history", label: "היסטוריית סיפורים" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>EnglishStory</div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        {user && (
          <div className={styles.user}>
            {user.picture && <img className={styles.avatar} src={user.picture} alt="" />}
            <span className={styles.userName}>{user.name}</span>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={logout}>
          התנתקות
        </button>
      </div>
    </aside>
  );
}
