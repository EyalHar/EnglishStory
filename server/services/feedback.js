function buildFeedbackMessage({ levelBefore, levelAfter, cefr, newlyGraduatedWords, streak }) {
  const messages = [];

  if (levelAfter > levelBefore) {
    messages.push(`כל הכבוד! התקדמת לרמה ${cefr} 🎉`);
  } else if (levelAfter < levelBefore) {
    messages.push("הסיפור הזה היה מאתגר — נוריד קצת את הרמה כדי שתרגישו בנוח יותר.");
  } else {
    messages.push("קצב מצוין — ממשיכים באותה רמה.");
  }

  if (newlyGraduatedWords.length) {
    messages.push(`${newlyGraduatedWords.length} מילים שהיו קשות בעבר כבר לא קשות לך יותר!`);
  }

  if (streak.current > 1) {
    messages.push(`רצף קריאה של ${streak.current} ימים ברציפות 🔥`);
  }

  return messages.join(" ");
}

module.exports = { buildFeedbackMessage };
