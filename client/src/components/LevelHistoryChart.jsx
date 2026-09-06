import styles from "./LevelHistoryChart.module.css";

const WIDTH = 600;
const HEIGHT = 180;
const PADDING = 24;

export default function LevelHistoryChart({ history }) {
  if (!history || history.length < 2) {
    return <p className={styles.empty}>נצטרך עוד כמה סיפורים כדי להציג גרף התקדמות.</p>;
  }

  const points = history.map((h, i) => {
    const x = PADDING + (i / (history.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - (h.score / 100) * (HEIGHT - PADDING * 2);
    return { x, y, score: h.score, cefr: h.cefr };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg className={styles.chart} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="גרף התקדמות רמה">
      <line
        x1={PADDING}
        y1={HEIGHT - PADDING}
        x2={WIDTH - PADDING}
        y2={HEIGHT - PADDING}
        className={styles.axis}
      />
      <path d={pathD} className={styles.line} fill="none" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} className={styles.dot} />
      ))}
      <text x={last.x} y={last.y - 10} className={styles.lastLabel} textAnchor="end">
        {last.cefr}
      </text>
    </svg>
  );
}
