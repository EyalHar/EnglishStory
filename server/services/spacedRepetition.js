// Leitner-box spaced repetition scheduled by completed-story count, not calendar date —
// usage cadence here is "whenever the user clicks Next Story", not daily practice.
const BOX_SKIP = { 1: 2, 2: 5, 3: 10, 4: 20 };
const MAX_BOX = 4;
const REVIEW_WORDS_PER_STORY = 2;

// Called right when a hard word graduates (stops needing translation/marking).
function scheduleFirstReview(hardWord, storiesCompleted) {
  hardWord.spacedRepetition.boxLevel = 1;
  hardWord.spacedRepetition.dueAtStoryIndex = storiesCompleted + BOX_SKIP[1];
}

// Called when a graduated word reappeared in a story as a "review" word and the user
// did NOT need it again — move it to a longer-interval box.
function boxUp(hardWord, storiesCompleted) {
  const nextBox = Math.min(hardWord.spacedRepetition.boxLevel + 1, MAX_BOX);
  hardWord.spacedRepetition.boxLevel = nextBox;
  hardWord.spacedRepetition.dueAtStoryIndex = storiesCompleted + BOX_SKIP[nextBox];
  hardWord.spacedRepetition.reviewCount += 1;
  hardWord.spacedRepetition.lastReviewedAtStory = storiesCompleted;
}

// Called when a graduated "review" word turns out to still be hard — back to the active pool.
function relapseToActive(hardWord) {
  hardWord.status = "active";
  hardWord.timesMarkedHard += 1;
  hardWord.lastMarkedAt = new Date();
  hardWord.spacedRepetition.boxLevel = 1;
}

async function pickDueReviewWords(HardWord, userId, storiesCompleted) {
  return HardWord.find({
    userId,
    status: "graduated",
    "spacedRepetition.dueAtStoryIndex": { $lte: storiesCompleted },
  })
    .sort({ "spacedRepetition.dueAtStoryIndex": 1 })
    .limit(REVIEW_WORDS_PER_STORY);
}

module.exports = {
  BOX_SKIP,
  MAX_BOX,
  REVIEW_WORDS_PER_STORY,
  scheduleFirstReview,
  boxUp,
  relapseToActive,
  pickDueReviewWords,
};
