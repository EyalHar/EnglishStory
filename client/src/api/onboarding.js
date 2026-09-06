import apiFetch from "./client";

export function fetchOnboardingStatus(token) {
  return apiFetch("/api/onboarding/status", { token });
}

export function submitSelfReport(token, level) {
  return apiFetch("/api/onboarding/self-report", { method: "POST", token, body: { level } });
}

export function fetchPlacementTest(token) {
  return apiFetch("/api/onboarding/placement-test", { token });
}

export function submitPlacementTest(token, responses) {
  return apiFetch("/api/onboarding/placement-test/submit", {
    method: "POST",
    token,
    body: { responses },
  });
}
