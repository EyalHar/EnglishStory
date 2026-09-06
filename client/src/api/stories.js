import apiFetch from "./client";

export function generateNextStory(token) {
  return apiFetch("/api/stories/next", { method: "POST", token });
}

export function fetchStory(token, id) {
  return apiFetch(`/api/stories/${id}`, { token });
}

export function fetchStoryHistory(token) {
  return apiFetch("/api/stories/history", { token });
}
