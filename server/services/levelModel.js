const CEFR_BANDS = [
  { max: 16, cefr: "A1" },
  { max: 33, cefr: "A2" },
  { max: 50, cefr: "B1" },
  { max: 67, cefr: "B2" },
  { max: 84, cefr: "C1" },
  { max: 100, cefr: "C2" },
];

function scoreToCefr(score) {
  return (CEFR_BANDS.find((band) => score <= band.max) || CEFR_BANDS[CEFR_BANDS.length - 1]).cefr;
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

const SELF_REPORT_SEED = {
  beginner: 12,
  intermediate: 42,
  advanced: 72,
};

const ACTIVE_HARD_WORD_BACKOFF_THRESHOLD = 20;

function densityToDelta(density) {
  if (density < 0.05) return 4;
  if (density < 0.15) return 2;
  if (density < 0.3) return 0;
  if (density < 0.45) return -3;
  return -6;
}

// Run once per completed ReadingSession to move the level gradually based on how much
// help the user needed, with an extra pull-back if too many hard words have piled up.
function adjustLevelAfterSession({ currentScore, hardWordDensity, activeHardWordCount }) {
  let delta = densityToDelta(hardWordDensity);
  let reason = `hardWordDensity=${hardWordDensity.toFixed(2)}`;

  const backoff = activeHardWordCount > ACTIVE_HARD_WORD_BACKOFF_THRESHOLD;
  if (backoff) {
    delta -= 2;
    reason += `, backoff: ${activeHardWordCount} active hard words`;
  }

  const newScore = clampScore(currentScore + delta);
  return { newScore, cefr: scoreToCefr(newScore), reason, backoff };
}

module.exports = {
  scoreToCefr,
  clampScore,
  SELF_REPORT_SEED,
  ACTIVE_HARD_WORD_BACKOFF_THRESHOLD,
  adjustLevelAfterSession,
};
