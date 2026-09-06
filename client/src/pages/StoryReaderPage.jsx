import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchStory } from "../api/stories";
import { translateWord, markWordHard, unmarkWordHard, completeSession } from "../api/sessions";
import WordPopover from "../components/WordPopover";
import CompletionSummary from "../components/CompletionSummary";
import styles from "./StoryReaderPage.module.css";

const TOKEN_REGEX = /([A-Za-z']+)|([^A-Za-z']+)/g;
const WORD_REGEX = /^[A-Za-z']+$/;

function tokenize(text) {
  return text.match(TOKEN_REGEX) || [];
}

// Groups consecutive word-tokens that form a known multi-word expression (from story.expressions)
// so they can be hovered/highlighted/translated together as a single unit.
function groupParagraphTokens(paragraphs, expressions) {
  let groupCounter = 0;

  return paragraphs.map((para) => {
    const rawTokens = tokenize(para);
    const wordPositions = rawTokens
      .map((chunk, i) => ({ i, w: chunk.toLowerCase() }))
      .filter((t) => WORD_REGEX.test(t.w));

    const groupIdByIndex = new Map();
    const groupWordsById = new Map();

    (expressions || []).forEach((expr) => {
      const words = (expr.words || []).map((w) => w.toLowerCase());
      if (words.length < 2) return;

      for (let start = 0; start <= wordPositions.length - words.length; start++) {
        const slice = wordPositions.slice(start, start + words.length);
        const alreadyGrouped = slice.some((pos) => groupIdByIndex.has(pos.i));
        if (alreadyGrouped) continue;

        const matches = slice.every((pos, k) => pos.w === words[k]);
        if (matches) {
          const groupId = `g${groupCounter++}`;
          slice.forEach((pos) => groupIdByIndex.set(pos.i, groupId));
          groupWordsById.set(groupId, words);
        }
      }
    });

    return rawTokens.map((chunk, i) => ({
      chunk,
      isWord: WORD_REGEX.test(chunk),
      groupId: groupIdByIndex.get(i) || null,
      groupWords: groupIdByIndex.has(i) ? groupWordsById.get(groupIdByIndex.get(i)) : null,
    }));
  });
}

export default function StoryReaderPage() {
  const { id } = useParams();
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popover, setPopover] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [markedWords, setMarkedWords] = useState(() => new Set());
  const [completion, setCompletion] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchStory(token, id)
      .then(({ story, sessionId }) => {
        setStory(story);
        setSessionId(sessionId);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, id]);

  const paragraphs = useMemo(() => (story ? story.body.split(/\n+/).filter(Boolean) : []), [story]);
  const groupedParagraphs = useMemo(
    () => groupParagraphTokens(paragraphs, story?.expressions),
    [paragraphs, story]
  );

  function handleWordClick(word, event, context) {
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setPopover({
      word,
      phrase: word,
      x,
      y,
      translation: null,
      loading: true,
      error: "",
      markedHard: markedWords.has(word),
    });

    translateWord(token, sessionId, word, context)
      .then(({ phrase, translation }) => {
        setPopover((prev) => (prev?.word === word ? { ...prev, phrase, translation, loading: false } : prev));
      })
      .catch((err) => {
        setPopover((prev) => (prev?.word === word ? { ...prev, error: err.message, loading: false } : prev));
      });
  }

  function handleToggleHard() {
    if (!popover) return;
    const phraseText = popover.phrase || popover.word;

    if (popover.markedHard) {
      unmarkWordHard(token, sessionId, phraseText)
        .then(() => {
          setMarkedWords((prev) => {
            const next = new Set(prev);
            next.delete(phraseText);
            return next;
          });
          setPopover((prev) => (prev ? { ...prev, markedHard: false } : prev));
        })
        .catch((err) => setPopover((prev) => (prev ? { ...prev, error: err.message } : prev)));
    } else {
      markWordHard(token, sessionId, phraseText)
        .then(() => {
          setMarkedWords((prev) => new Set(prev).add(phraseText));
          setPopover((prev) => (prev ? { ...prev, markedHard: true } : prev));
        })
        .catch((err) => setPopover((prev) => (prev ? { ...prev, error: err.message } : prev)));
    }
  }

  function handleFinish() {
    setFinishing(true);
    completeSession(token, sessionId)
      .then((result) => {
        setCompletion(result);
        refreshUser();
      })
      .catch((err) => setError(err.message))
      .finally(() => setFinishing(false));
  }

  if (loading) return null;
  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (completion) {
    return (
      <div className={styles.page}>
        <CompletionSummary
          result={completion}
          onNewStory={() => navigate("/story", { replace: true })}
          onHome={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{story.title}</h1>
        {story.level?.cefr && <span className={styles.levelBadge}>{story.level.cefr}</span>}
      </div>

      <div
        className={styles.storyBody}
        dir="ltr"
        lang="en"
        ref={containerRef}
        onClick={() => setPopover(null)}
      >
        {groupedParagraphs.map((tokens, pIdx) => (
          <p key={pIdx}>
            {tokens.map((t, tIdx) => {
              if (!t.isWord) return <span key={tIdx}>{t.chunk}</span>;

              const unitId = t.groupId || `single-${pIdx}-${tIdx}`;
              const isHovered = hoveredGroup === unitId;

              return (
                <span
                  key={tIdx}
                  className={isHovered ? `${styles.word} ${styles.wordHovered}` : styles.word}
                  onMouseEnter={() => setHoveredGroup(unitId)}
                  onMouseLeave={() => setHoveredGroup((prev) => (prev === unitId ? null : prev))}
                  onClick={(e) => {
                    e.stopPropagation();
                    const phrase = t.groupWords ? t.groupWords.join(" ") : t.chunk.toLowerCase();
                    handleWordClick(phrase, e, paragraphs[pIdx]);
                  }}
                >
                  {t.chunk}
                </span>
              );
            })}
          </p>
        ))}

        {popover && (
          <WordPopover {...popover} onClose={() => setPopover(null)} onToggleHard={handleToggleHard} />
        )}
      </div>

      <div className={styles.actionsRow}>
        <button className={styles.finishBtn} onClick={handleFinish} disabled={finishing}>
          {finishing ? "שומר..." : "סיימתי לקרוא"}
        </button>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          חזרה לבית
        </button>
      </div>
    </div>
  );
}
