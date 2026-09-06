import apiFetch from "./client";

export function fetchProgressSummary(token) {
  return apiFetch("/api/progress/summary", { token });
}

export function fetchPatternProfile(token) {
  return apiFetch("/api/progress/pattern-profile", { token });
}
