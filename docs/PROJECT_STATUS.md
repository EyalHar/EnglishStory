# EnglishStory — Project Status

Last updated: after M5 (adaptive next-story), before spaced repetition + pattern detection.

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
| M5 — Level adjustment, graduation, adaptive next story | ✅ (spaced repetition not yet) | `server/services/levelModel.js`, `server/services/feedback.js`, `POST /api/sessions/:id/complete`, hard/translated words woven into `POST /api/stories/next` |

### M5 detail — what happens when a story is finished

`POST /api/sessions/:id/complete`:
1. Computes `hardWordDensity` = struggled-words / total-unique-words for this session.
2. Adjusts `levelScore` per a density→delta table (+4 down to −6), with an extra −2 backoff if the user has more than 20 active hard words.
3. Graduates any active hard word that appeared in this story's body but wasn't translated/marked-hard again this time (`status: "graduated"`).
4. Updates the daily streak and `stats.storiesCompleted`.
5. Returns a Hebrew feedback message (age-neutral tone — age collection was explicitly dropped from onboarding).

`POST /api/stories/next` then pulls up to 6 active hard words (fewer, 3, if the backoff threshold is exceeded) plus up to 3 recently-translated words, and asks Gemini to weave them into the new story.

## What's NOT built yet

1. **Spaced repetition for graduated words** — `HardWord.spacedRepetition` (boxLevel, dueAtStoryIndex, reviewCount) fields exist in the schema but nothing reads/writes them yet. Once a word graduates it currently never reappears deliberately. Planned: a 4-box, story-count-keyed Leitner schedule (not calendar-based, since usage cadence is user-driven) — box 1 = skip 2 stories, box 2 = 5, box 3 = 10, box 4 = 20; box up on success, un-graduate (back to active) on failure.
2. **Difficulty pattern detection** — no per-word feature aggregation or `DifficultyPatternProfile` yet. Planned: cheap local feature extraction (length bucket, syllable count, letter n-grams) on every `HardWord`, occasional batched Gemini call for topic classification, a Mongo aggregation into a per-user profile, and a natural-language hint injected into the story-generation system prompt.
3. **Progress page** (`/progress`) and **story history page** (`/history`) — both still `ComingSoonPage` placeholders. `User.level.history` is already being recorded (capped at last 50 entries) so a level-over-time chart is ready to build against.
4. **`models/WordTranslationCache.js`** exists but is intentionally unused (see the contextual-translation note above) — either repurpose it later (e.g. a common-words glossary) or remove it.

## Known simplifications (deliberate, not oversights)

- No automated test suite — this is a solo/exploratory build verified manually in-browser per milestone.
- Graduation checks the first word of a multi-word phrase against the story body via regex, not the full phrase — good enough for now, could be tightened later.
- `translated`/`markedHard` interaction tracking is per `ReadingSession`, not merged across a phrase's multiple word-tokens if only one is clicked — acceptable since the reader now always resolves clicks to the full detected phrase before calling the API.
