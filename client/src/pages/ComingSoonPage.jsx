import styles from "./ComingSoonPage.module.css";

export default function ComingSoonPage({ title }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>המסך הזה ייבנה בשלב הבא של הפיתוח.</p>
    </div>
  );
}
