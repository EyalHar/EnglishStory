function syllableCount(word) {
  return (word.match(/[aeiouy]+/gi) || []).length || 1;
}

function lengthBucket(length) {
  if (length <= 4) return "short";
  if (length <= 8) return "medium";
  return "long";
}

function letterPatterns(word) {
  const patterns = new Set();
  if (word.length >= 3) patterns.add(word.slice(-3));
  if (word.length >= 4) patterns.add(word.slice(-4));
  for (let i = 0; i <= word.length - 3; i++) {
    patterns.add(word.slice(i, i + 3));
  }
  return Array.from(patterns);
}

// For multi-word phrases (e.g. "flea market"), the first word is used as the representative
// unit for length/pattern features — good enough for pattern detection, not meant to be exact.
function buildWordMetadata(word) {
  const base = word.split(" ")[0];
  return {
    length: base.length,
    syllableCount: syllableCount(base),
    lengthBucket: lengthBucket(base.length),
    letterPatterns: letterPatterns(base),
  };
}

module.exports = { buildWordMetadata };
