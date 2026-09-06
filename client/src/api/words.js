import apiFetch from "./client";

export function fetchHardWords(token) {
  return apiFetch("/api/words/hard", { token });
}

export function fetchGraduatedWords(token) {
  return apiFetch("/api/words/graduated", { token });
}
