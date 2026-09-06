# EnglishStory — Project Status

Last updated: after M6 (pattern detection + progress/history pages) — all originally planned milestones (M1–M6) are now built.

## Core idea

Google login → onboarding (self-reported level + a placement test, **no age question**) → Gemini generates a story at the user's estimated level → the user reads it, can click any word to translate it (context-aware) or mark it as "hard" → on finishing, level adjusts automatically, mastered words graduate, and the next story weaves in words that still need practice.

## Key architecture decisions

- **Stack**: `client/` (React, CRA) + `server/` (Node/Express), MongoDB/Mongoose. RTL Hebrew shell, LTR story text.
- **Auth**: Google ID token verified server-side (`google-auth-library`) → app-issued JWT → `Authorization: Bearer` middleware. Pattern mirrors the sibling project Haci-Haci.
- **DB**: MongoDB Atlas, same cluster as Haci-Haci, separate database (`english-story`).
- **LLM**: **Google Gemini**, not Claude — switched after a cost review. Gemini's Flash tier is a genuine, permanent free tier (no credit card). Default model `gemini-3.8-flash` for story generation, `gemini-3.5-flash-lite` for cheap classification/translation tasks, each with an older-model fallback (`gemini-2.5-flash` / `gemini-2.5-flash-lite`) for when the newest model is overloaded (503).
- **Structured output**: every Gemini call uses `responseSchema` (JSON Schema) via `config.responseMimeType: "application/json"` — no "ask for JSON and hope" parsing.
- **Level representation**: a continuous `levelScore` (0–100) on the `User` doc, mapped to a CEFR band (A1–C2) via fixed thresholds. Continuous score is what allows gradual creep instead of abrupt band jumps.
- **Contextual translation**: translation requests send the surrounding paragraph as context and ask Gemini to detect multi-word expressions (idioms, phrasal verbs, compound nouns) and translate the *whole* expression, not the isolated word (fixes e.g. "flea" → "פרעוש" when the real meaning is "flea market" → "שוק פשפשים"). A word-only translation cache was deliberately **not** used for this, since a bare-word cache key is exactly what would reintroduce that bug.
- **Expression detection is precomputed at story-generation time** (one extra field in the same structured-output call, no extra API cost), not guessed reactively per click — this is what lets the reader highlight both words of "flea market" together on hover, before any click happens.

## What's built (M1–M5)

| Milestone | Status | Key files |
|---|---|---|
| M1 — Auth + skeleton | ✅ | `server/routes/auth.js`, `client/src/context/AuthContext.jsx`, `client/src/components/Sidebar.jsx` |
| M2 — Onboarding + placement test | ✅ | `server/routes/onboarding.js`, `server/data/placementWords.json`, `client/src/pages/Onboarding*.jsx` |
| M3 — Story generation + reader | ✅ | `server/services/storyGeneration.js`, `server/services/geminiClient.js`, `client/src/pages/StoryReaderPage.jsx` |
| M4 — Hard words + contextual translation | ✅ | `server/models/HardWord.js`, `server/services/translation.js`, `client/src/components/WordPopover.jsx`, `client/src/pages/HardWordsPage.jsx` |
| M5 — Level adjustment, graduation, adaptive next story | ✅ | `server/services/levelModel.js`, `server/services/feedback.js`, `POST /api/sessions/:id/complete`, hard/translated words woven into `POST /api/stories/next` |
| M5b — Spaced repetition for graduated words | ✅ | `server/services/spacedRepetition.js` |
| M6a — Difficulty pattern detection | ✅ | `server/services/patternDetection.js`, `server/services/wordTopicClassifier.js`, `server/models/DifficultyPatternProfile.js` |
| M6b — Progress + story history pages | ✅ | `server/routes/progress.js`, `client/src/pages/ProgressPage.jsx`, `client/src/pages/StoryHistoryPage.jsx`, `client/src/components/LevelHistoryChart.jsx` |

### M5 detail — what happens when a story is finished

`POST /api/sessions/:id/complete`:
1. Computes `hardWordDensity` = struggled-words / total-unique-words for this session.
2. Adjusts `levelScore` per a density→delta table (+4 down to −6), with an extra −2 backoff if the user has more than 20 active hard words.
3. Graduates any active hard word that appeared in this story's body but wasn't translated/marked-hard again this time (`status: "graduated"`).
4. Updates the daily streak and `stats.storiesCompleted`.
5. Returns a Hebrew feedback message (age-neutral tone — age collection was explicitly dropped from onboarding).

`POST /api/stories/next` then pulls up to 6 active hard words (fewer, 3, if the backoff threshold is exceeded), up to 3 recently-translated words, and up to 2 graduated words due for spaced-repetition review, and asks Gemini to weave them into the new story (review words specifically framed as "easy, confidence-boost" usage, not a new challenge).

### M5b detail — spaced repetition (`server/services/spacedRepetition.js`)

Scheduled by **completed-story count**, not calendar date (usage cadence here is "whenever the user clicks Next Story", not daily practice). Four boxes, keyed to how many future stories to skip before a word is eligible for review again: box 1 → skip 2, box 2 → skip 5, box 3 → skip 10, box 4 → skip 20.

- On graduation: `scheduleFirstReview` sets `boxLevel: 1`, `dueAtStoryIndex: storiesCompleted + 2`.
- `POST /api/stories/next` calls `pickDueReviewWords` (up to 2, oldest-due first) and adds them as `source: "review"` in `wordsToWeave`.
- `POST /api/sessions/:id/complete` checks every `review`-source word from `story.targetWords`: if the user didn't need it again → `boxUp` (moves to a longer-interval box); if they did → `relapseToActive` (back to the normal active hard-word pool, `status: "active"`, counter incremented, box reset).
- Surfaced in the completion summary (`relapsedWords` alongside `newlyGraduatedWords`) and in `HardWordsPage` (box level shown per graduated word).

### M6a detail — pattern detection (`server/services/patternDetection.js`)

Two layers, both lazy — run inline on every `POST /api/stories/next` call (cheap enough for a single-user app; no separate job/cron needed):

1. **Per-word features** (already computed since M4, in `wordFeatures.js`, at mark-hard time): `length`, `lengthBucket`, `syllableCount`, `letterPatterns` (3-grams + suffixes) — all local regex/string math, no API call.
2. **Per-word topic** (`wordTopicClassifier.js`): once ≥5 hard words lack a topic tag, one batched Gemini call (`gemini-3.5-flash-lite`) classifies all of them at once and caches the tags onto `HardWord.metadata.topics`.

`recomputeProfile` then runs a Mongo aggregation over the user's active+graduated hard words into `DifficultyPatternProfile` (length-bucket distribution, avg length/syllables, top 8 letter n-grams, top 5 weak topics). `buildPatternHintText` turns that into a short natural-language instruction (e.g. *"This learner tends to struggle with long words... Weak topic areas: business, technology..."*) injected into the story-generation system prompt (`storyGeneration.js`'s existing `patternHint` parameter, previously unused). The hint used for each story is also snapshotted in `Story.generationParams.patternHint` for debugging.

### M6b detail — progress + history pages

- `GET /api/progress/summary` — level (score/cefr/history), streak, stats, active hard-word count.
- `GET /api/progress/pattern-profile` — the `DifficultyPatternProfile` from M6a.
- `ProgressPage`: stat cards, a hand-rolled inline-SVG line chart (`LevelHistoryChart` — no charting library, this app's needs don't justify the dependency) plotting `level.history` scores over time, and a "difficulty patterns" card (avg hard-word length, weak topics, common letter n-grams) shown once at least 3 hard words have been sampled.
- `StoryHistoryPage`: past stories as clickable cards (title, CEFR badge, date, completed/in-progress status, topics) → opens that story in the reader.

## What's left / possible future work

1. **`models/WordTranslationCache.js`** exists but is intentionally unused (see the contextual-translation note above) — either repurpose it later (e.g. a common-words glossary) or remove it.
2. Revisiting a **completed** story from history reopens the plain reader (translate/mark-hard still work) rather than showing its saved completion summary — a minor UX gap, not a bug.
3. No automated eval of story quality/CEFR-accuracy — quality has been checked manually so far.

## Known simplifications (deliberate, not oversights)

- No automated test suite — this is a solo/exploratory build verified manually in-browser per milestone.
- Graduation checks the first word of a multi-word phrase against the story body via regex, not the full phrase — good enough for now, could be tightened later.
- `translated`/`markedHard` interaction tracking is per `ReadingSession`, not merged across a phrase's multiple word-tokens if only one is clicked — acceptable since the reader now always resolves clicks to the full detected phrase before calling the API.
