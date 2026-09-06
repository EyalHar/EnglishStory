import apiFetch from "./client";

export function translateWord(token, sessionId, word, context) {
  return apiFetch(`/api/sessions/${sessionId}/translate`, {
    method: "POST",
    token,
    body: { word, context },
  });
}

export function markWordHard(token, sessionId, word) {
  return apiFetch(`/api/sessions/${sessionId}/mark-hard`, {
    method: "POST",
    token,
    body: { word },
  });
}

export function unmarkWordHard(token, sessionId, word) {
  return apiFetch(`/api/sessions/${sessionId}/unmark-hard`, {
    method: "POST",
    token,
    body: { word },
  });
}

export function completeSession(token, sessionId) {
  return apiFetch(`/api/sessions/${sessionId}/complete`, { method: "POST", token });
}
